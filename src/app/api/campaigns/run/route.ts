import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { webSearch } from "@/lib/search";
import { readSheetLeads } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { campaignId } = await req.json();
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: user.id },
    });
    if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

    const agent = await prisma.agent.findFirst({ where: { id: campaign.agentId } });
    if (!agent) return NextResponse.json({ error: "agent not found" }, { status: 404 });

    // Check required integrations
    if (!user.resendApiKey) {
      return NextResponse.json({ error: "No email API key. Add your Resend API key in Settings." }, { status: 400 });
    }
    if (!user.fromEmail) {
      return NextResponse.json({ error: "No sender email. Add your From Email in Settings." }, { status: 400 });
    }

    // Mark campaign as running
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "running", results: "[]" },
    });

    // Read leads from Google Sheet
    const leads = await readSheetLeads(campaign.sheetUrl);
    if (leads.length === 0) {
      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "error" } });
      return NextResponse.json({ error: "No valid leads found in sheet" }, { status: 400 });
    }

    const results: any[] = [];

    for (const lead of leads) {
      try {
        let context = `Lead name: ${lead.name}\nLead email: ${lead.email}`;
        if (lead.company) context += `\nCompany: ${lead.company}`;

        // Web search for lead context (if serper key is set)
        if (user.serperApiKey && lead.company) {
          try {
            const searchResults = await webSearch(`${lead.company} ${lead.name}`, user.serperApiKey);
            context += `\n\nWeb research about this lead:\n${searchResults}`;
          } catch {
            // search failed, continue without it
          }
        }

        // Run the agent to generate the email
        const result = await runAgent({
          systemPrompt: agent.systemPrompt,
          knowledge: agent.knowledge,
          input: context,
          model: agent.model,
          temperature: agent.temperature,
        });

        // Extract subject line from output (first line) or use default
        const lines = result.output.split("\n").filter(Boolean);
        const subjectLine = lines.find(l => l.toLowerCase().startsWith("subject:"))?.replace(/^subject:\s*/i, "")
          || `Quick note for ${lead.name}`;
        const body = result.output.replace(/^subject:.*\n?/im, "").trim();

        // Send the email
        await sendEmail({
          apiKey: user.resendApiKey,
          from: user.fromEmail,
          to: lead.email,
          subject: subjectLine,
          body,
        });

        results.push({ lead: lead.email, status: "sent", output: result.output });

        // Log as a run
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
        results.push({ lead: lead.email, status: "error", error: err.message });
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "done", results: JSON.stringify(results) },
    });

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
