import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { webSearch } from "@/lib/search";
import { readSheetLeads, type Lead } from "@/lib/sheets";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { scoreLeadsBatch, type LeadTier } from "@/lib/lead-scoring";
import {
  pickVariant,
  renderTemplate,
  pickWinner as pickWinnerStat,
  type VariantInput,
  type WinnerMetric,
} from "@/lib/ab-testing";

interface ScoreInfo {
  score: number;
  tier: LeadTier;
  reasoning: string;
  signals: string[];
  redFlags: string[];
}

function scoreOf(map: Map<string, ScoreInfo>, email: string): number {
  const v = map.get(email.toLowerCase());
  if (!v) return 0;
  return v.score;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const campaignId: string = body.campaignId;
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: user.id },
    });
    if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

    const agent = await prisma.agent.findFirst({ where: { id: campaign.agentId, userId: user.id } });
    if (!agent) return NextResponse.json({ error: "agent not found" }, { status: 404 });

    if (!user.resendApiKey) {
      return NextResponse.json({ error: "No email API key. Add your Resend API key in Settings." }, { status: 400 });
    }
    if (!user.fromEmail) {
      return NextResponse.json({ error: "No sender email. Add your From Email in Settings." }, { status: 400 });
    }

    const planLimits = PLAN_LIMITS[toPlanKey(user.plan)];
    const referralBonus = user.referralBonusRuns || 0;
    const effectiveLimit = planLimits.monthlyRuns + referralBonus;
    if (user.runsUsedThisPeriod >= effectiveLimit) {
      return NextResponse.json({
        error: "Monthly run limit reached on " + planLimits.label + " plan. Upgrade at /dashboard/billing.",
      }, { status: 402 });
    }
    const runsRemaining = effectiveLimit - user.runsUsedThisPeriod;

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "running", results: "[]" },
    });

    const allLeads = await readSheetLeads(campaign.sheetUrl);
    if (allLeads.length === 0) {
      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "error" } });
      return NextResponse.json({ error: "No valid leads found in sheet" }, { status: 400 });
    }

    const scoreByEmail = new Map<string, ScoreInfo>();
    if (campaign.scoringEnabled) {
      try {
        await prisma.leadScore.deleteMany({ where: { campaignId: campaign.id } });
        const icp = (agent.description && agent.description.trim()) || ("Target customer for the agent role " + agent.role + ".");
        const scored = await scoreLeadsBatch(allLeads, { idealCustomerProfile: icp }, 4);
        await prisma.$transaction(scored.map(s => prisma.leadScore.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            leadEmail: s.lead.email,
            leadName: s.lead.name || "",
            leadCompany: s.lead.company || null,
            score: s.score,
            tier: s.tier,
            reasoning: s.reasoning,
            signals: JSON.stringify(s.signals),
            redFlags: JSON.stringify(s.redFlags),
            skipped: s.score < campaign.minScoreThreshold,
          },
        })));
        for (const s of scored) {
          scoreByEmail.set(s.lead.email.toLowerCase(), {
            score: s.score, tier: s.tier, reasoning: s.reasoning,
            signals: s.signals, redFlags: s.redFlags,
          });
        }
      } catch (err) {
        console.error("[campaign] scoring failed:", err);
      }
    }

    const threshold = campaign.minScoreThreshold || 0;
    let workQueue: Lead[] = allLeads.filter(l => {
      const s = scoreByEmail.get(l.email.toLowerCase());
      if (!s) return true;
      return s.score >= threshold;
    });

    if (campaign.sortByScore && scoreByEmail.size > 0) {
      workQueue.sort((a, b) => scoreOf(scoreByEmail, b.email) - scoreOf(scoreByEmail, a.email));
    }

    const droppedByThreshold = allLeads.length - workQueue.length;
    const leads = workQueue.slice(0, runsRemaining);
    const droppedByQuota = workQueue.length - leads.length;

    // A/B test setup: if abTestEnabled && variants exist, use templates.
    // Otherwise fall back to the original AI-generates-per-lead flow.
    const variantRows: any[] = await prisma.campaignVariant.findMany({
      where: { campaignId: campaign.id },
      orderBy: { label: "asc" },
    });
    const useAbTest = campaign.abTestEnabled && variantRows.length > 0;
    const weightsById: Record<string, number> = {};
    const variantTemplatesById: Record<string, { subjectTemplate: string; bodyTemplate: string; label: string }> = {};
    let liveVariants: VariantInput[] = [];
    if (useAbTest) {
      for (const v of variantRows) {
        weightsById[v.id] = v.weight || 50;
        variantTemplatesById[v.id] = {
          subjectTemplate: v.subjectTemplate,
          bodyTemplate: v.bodyTemplate,
          label: v.label,
        };
      }
      liveVariants = variantRows.map((v: any) => ({
        id: v.id,
        label: v.label,
        name: v.name,
        isControl: v.isControl,
        isWinner: v.isWinner,
        active: v.active,
        sentCount: v.sentCount,
        openedCount: v.openedCount,
        clickedCount: v.clickedCount,
        repliedCount: v.repliedCount,
        hotRepliedCount: v.hotRepliedCount,
        errorCount: v.errorCount,
      }));
    }

    const results: any[] = [];

    for (const lead of leads) {
      const scoreInfo = scoreByEmail.get(lead.email.toLowerCase());

      if (useAbTest) {
        // A/B-driven send path
        const chosen = pickVariant(
          { activeVariants: liveVariants, abWinnerVariantId: campaign.abWinnerVariantId },
          weightsById,
        );

        if (!chosen) {
          results.push({
            lead: lead.email,
            status: "error",
            error: "A/B test has no active variants. Add a variant or pick a winner.",
            score: scoreInfo?.score,
            tier: scoreInfo?.tier,
          });
          continue;
        }

        try {
          const tpl = variantTemplatesById[chosen.id];
          const ctx = { name: lead.name, email: lead.email, company: lead.company };
          const subjectLine = renderTemplate(tpl.subjectTemplate, ctx);
          const bodyTxt = renderTemplate(tpl.bodyTemplate, ctx);

          await sendEmail({
            apiKey: user.resendApiKey,
            from: user.fromEmail,
            to: lead.email,
            subject: subjectLine,
            body: bodyTxt,
          });

          chosen.sentCount += 1;
          await prisma.campaignVariant.update({
            where: { id: chosen.id },
            data: { sentCount: { increment: 1 } },
          });
          await prisma.variantEvent.create({
            data: {
              variantId: chosen.id,
              campaignId: campaign.id,
              userId: user.id,
              type: "sent",
              leadEmail: lead.email,
              leadName: lead.name || null,
            },
          });

          const outputText = "Subject: " + subjectLine + "\n\n" + bodyTxt;
          await prisma.run.create({
            data: {
              agentId: agent.id,
              userId: user.id,
              input: "[A/B Variant " + chosen.label + "] " + lead.name + " <" + lead.email + ">",
              output: outputText,
              status: "success",
              tokensIn: 0,
              tokensOut: 0,
              costCents: 0,
              finishedAt: new Date(),
            },
          });
          await prisma.user.update({
            where: { id: user.id },
            data: { runsUsedThisPeriod: { increment: 1 } },
          });

          if (scoreInfo) {
            await prisma.leadScore.updateMany({
              where: { campaignId: campaign.id, leadEmail: lead.email },
              data: { contacted: true },
            });
          }

          results.push({
            lead: lead.email,
            status: "sent",
            output: outputText,
            variantId: chosen.id,
            variantLabel: chosen.label,
            score: scoreInfo?.score,
            tier: scoreInfo?.tier,
          });
        } catch (err: any) {
          chosen.errorCount += 1;
          await prisma.campaignVariant.update({
            where: { id: chosen.id },
            data: { errorCount: { increment: 1 } },
          });
          await prisma.variantEvent.create({
            data: {
              variantId: chosen.id,
              campaignId: campaign.id,
              userId: user.id,
              type: "error",
              leadEmail: lead.email,
              errorMessage: String(err.message || err).slice(0, 500),
            },
          });
          results.push({
            lead: lead.email,
            status: "error",
            error: err.message,
            variantId: chosen.id,
            variantLabel: chosen.label,
            score: scoreInfo?.score,
            tier: scoreInfo?.tier,
          });
        }

        // After every send, if auto-pick is on, check whether we can elect a winner.
        if (
          campaign.abAutoPickWinner &&
          !campaign.abWinnerVariantId &&
          liveVariants.length >= 2
        ) {
          try {
            const metric = (campaign.abWinnerMetric || "reply_rate") as WinnerMetric;
            const r = pickWinnerStat(
              liveVariants,
              metric,
              campaign.abMinSampleSize || 20,
              campaign.abConfidence || 95,
            );
            if (r.winnerId) {
              await prisma.$transaction([
                prisma.campaignVariant.updateMany({
                  where: { campaignId: campaign.id },
                  data: { isWinner: false, active: false },
                }),
                prisma.campaignVariant.update({
                  where: { id: r.winnerId },
                  data: { isWinner: true, active: true },
                }),
                prisma.campaign.update({
                  where: { id: campaign.id },
                  data: { abWinnerVariantId: r.winnerId, abWinnerPickedAt: new Date() },
                }),
              ]);
              campaign.abWinnerVariantId = r.winnerId;
            }
          } catch (e) {
            console.error("[ab] auto-pick winner failed:", e);
          }
        }

        continue;
      }

      // Legacy AI-per-lead flow
      try {
        let context = "Lead name: " + lead.name + "\nLead email: " + lead.email;
        if (lead.company) context += "\nCompany: " + lead.company;

        if (scoreInfo) {
          context += "\n\nAI lead score: " + scoreInfo.score + "/100 (" + scoreInfo.tier + ")";
          context += "\nWhy this score: " + scoreInfo.reasoning;
          if (scoreInfo.signals.length > 0) {
            context += "\nPositive signals: " + scoreInfo.signals.join("; ");
          }
        }

        if (user.serperApiKey && lead.company) {
          try {
            const searchResults = await webSearch(lead.company + " " + lead.name, user.serperApiKey);
            context += "\n\nWeb research about this lead:\n" + searchResults;
          } catch {
            // continue
          }
        }

        const result = await runAgent({
          systemPrompt: agent.systemPrompt,
          knowledge: agent.knowledge,
          input: context,
          model: agent.model,
          temperature: agent.temperature,
        });

        const lines = result.output.split("\n").filter(Boolean);
        const subjLine = lines.find(l => l.toLowerCase().startsWith("subject:"));
        const subjectLine = subjLine ? subjLine.replace(/^subject:\s*/i, "") : ("Quick note for " + lead.name);
        const bodyTxt = result.output.replace(/^subject:.*\n?/im, "").trim();

        await sendEmail({
          apiKey: user.resendApiKey,
          from: user.fromEmail,
          to: lead.email,
          subject: subjectLine,
          body: bodyTxt,
        });

        results.push({
          lead: lead.email, status: "sent", output: result.output,
          score: scoreInfo ? scoreInfo.score : undefined,
          tier: scoreInfo ? scoreInfo.tier : undefined,
        });

        if (scoreInfo) {
          await prisma.leadScore.updateMany({
            where: { campaignId: campaign.id, leadEmail: lead.email },
            data: { contacted: true },
          });
        }

        await prisma.run.create({
          data: {
            agentId: agent.id,
            userId: user.id,
            input: context,
            output: result.output,
            status: "success",
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            costCents: result.costCents,
            finishedAt: new Date(),
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { runsUsedThisPeriod: { increment: 1 } },
        });
      } catch (err: any) {
        results.push({
          lead: lead.email, status: "error", error: err.message,
          score: scoreInfo ? scoreInfo.score : undefined,
          tier: scoreInfo ? scoreInfo.tier : undefined,
        });
      }
    }

    if (droppedByThreshold > 0) {
      const dropped = allLeads.filter(l => !workQueue.includes(l));
      for (const l of dropped) {
        const s = scoreByEmail.get(l.email.toLowerCase());
        results.push({
          lead: l.email, status: "skipped",
          error: "Below score threshold (" + (s ? s.score : "n/a") + "/100 < " + threshold + ")",
          score: s ? s.score : undefined,
          tier: s ? s.tier : undefined,
        });
      }
    }
    if (droppedByQuota > 0) {
      const overflow = workQueue.slice(leads.length);
      for (const l of overflow) {
        const s = scoreByEmail.get(l.email.toLowerCase());
        results.push({
          lead: l.email, status: "error",
          error: "Skipped, monthly run limit reached. Upgrade your plan.",
          score: s ? s.score : undefined,
          tier: s ? s.tier : undefined,
        });
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "done", results: JSON.stringify(results) },
    });

    return NextResponse.json({
      success: true,
      results,
      scoredLeads: scoreByEmail.size,
      contacted: leads.length,
      skippedByThreshold: droppedByThreshold,
      skippedByQuota: droppedByQuota,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
