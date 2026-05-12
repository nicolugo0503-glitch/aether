"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Building2, Code2, Home, Heart, GraduationCap, Briefcase, Utensils,
  Mail, Share2, HeadphonesIcon, Search, ArrowRight, Sparkles, CheckCircle2, Zap, Bot,
} from "lucide-react";
import { AetherMark } from "@/components/ui/logo";
import { completeOnboarding } from "./actions";

/* ─── Data ─────────────────────────────────────────────── */
const INDUSTRIES = [
  { id: "ecommerce",   label: "E-Commerce",      icon: ShoppingBag,    color: "#f59e0b" },
  { id: "agency",      label: "Agency",           icon: Building2,      color: "#7c3aed" },
  { id: "saas",        label: "SaaS / Tech",      icon: Code2,          color: "#0891b2" },
  { id: "realestate",  label: "Real Estate",      icon: Home,           color: "#059669" },
  { id: "health",      label: "Health & Wellness", icon: Heart,         color: "#ec4899" },
  { id: "education",   label: "Education",         icon: GraduationCap, color: "#f97316" },
  { id: "consulting",  label: "Consulting",        icon: Briefcase,     color: "#8b5cf6" },
  { id: "food",        label: "Food & Hospitality", icon: Utensils,     color: "#ef4444" },
];

const GOALS = [
  { id: "leads",   label: "Generate more leads",      icon: Mail,            color: "#7c3aed", desc: "Ava writes personalized outreach to fill your pipeline" },
  { id: "social",  label: "Grow on social media",     icon: Share2,          color: "#ec4899", desc: "Auto-post to Instagram, Facebook & X every day" },
  { id: "support", label: "Automate customer support", icon: HeadphonesIcon, color: "#059669", desc: "Sage handles tickets so your team can focus on growth" },
  { id: "research",label: "Research & intelligence",   icon: Search,         color: "#0891b2", desc: "Rex monitors markets, competitors, and opportunities" },
];

/* ─── Agent preview cards for step 3 ───────────────────── */
const AGENT_PREVIEWS: Record<string, Record<string, { name: string; tagline: string; prompt: string }>> = {
  ecommerce: {
    leads:    { name: "Ava — E-Commerce SDR",       tagline: "Converts cold leads into paying customers",       prompt: "You are Ava, an elite e-commerce SDR. Given a lead's name, company, and website, write an 80-word personalized cold email referencing a specific pain point from their store (high cart abandonment, low repeat rate, or poor mobile UX). Lead with the pain, offer a clear solution, one strong CTA. No fluff." },
    social:   { name: "Nova — Social Commerce",     tagline: "Drives product discovery across all platforms",    prompt: "You are Nova, a social commerce specialist. Given a product or collection, create an engaging post that drives discovery: open with a scroll-stopping hook, highlight the transformation the product delivers, include a soft CTA, and add 5 relevant hashtags. Keep it authentic, under 220 words." },
    support:  { name: "Sage — Shop Support",        tagline: "Resolves orders, returns & questions instantly",   prompt: "You are Sage, a specialist in e-commerce customer support. Given a customer message about an order, return, or product question, write a warm, clear response under 100 words. Acknowledge their issue, give a direct resolution, and close with an invitation to reach out again. Reflect the brand's friendly tone." },
    research: { name: "Rex — Market Analyst",       tagline: "Tracks trends, competitors & opportunities",       prompt: "You are Rex, an e-commerce market analyst. Given a product category or brand, produce a sharp 150-word brief: top market trends, 3 key competitors and their positioning, one untapped opportunity, and one specific recommendation. Be direct and data-oriented." },
  },
  agency: {
    leads:    { name: "Ava — Agency Biz Dev",       tagline: "Lands retainers with high-intent outreach",        prompt: "You are Ava, a business development specialist for marketing agencies. Given a prospect's company, industry, and role, write an 80-word cold email that references a specific growth opportunity or gap you've identified. Position the agency as the clear solution. One CTA: a 15-minute strategy call." },
    social:   { name: "Nova — Agency Showcase",     tagline: "Builds authority and attracts inbound clients",     prompt: "You are Nova, a content strategist for a marketing agency. Given a topic or recent client result, create a LinkedIn/social post that demonstrates expertise and builds authority. Lead with an insight or bold claim, back it with a brief example, end with a thought-provoking question. Under 200 words." },
    support:  { name: "Sage — Client Success",      tagline: "Keeps clients happy and reduces churn",            prompt: "You are Sage, a client success specialist at a marketing agency. Given a client message (question, concern, or feedback), write a professional, empathetic response that reframes issues as opportunities, summarizes next steps clearly, and reinforces confidence in the agency's work. Under 120 words." },
    research: { name: "Rex — Competitive Intel",    tagline: "Delivers insights that win pitches",               prompt: "You are Rex, a competitive intelligence analyst for a marketing agency. Given a prospect or competitor, produce a concise 150-word brief: their current marketing strategy, what's working for them, what's not, and one specific angle our agency can use to position against them in a pitch." },
  },
  saas: {
    leads:    { name: "Ava — SaaS SDR",             tagline: "Books demos with your ideal customer profile",     prompt: "You are Ava, an elite SaaS SDR. Given a lead's role, company size, and tech stack, write an 80-word cold email that opens with a specific pain this persona faces, connects it to a tangible outcome your software delivers, and ends with a low-friction CTA (15-min call or free trial). No buzzwords." },
    social:   { name: "Nova — SaaS Growth",         tagline: "Turns product updates into pipeline",              prompt: "You are Nova, a SaaS social media specialist. Given a product feature or update, create an engaging post that leads with the user benefit (not the feature), tells a quick story of the problem it solves, and ends with a CTA to try it free. Under 200 words. Professional but human." },
    support:  { name: "Sage — SaaS Support",        tagline: "Resolves tickets and reduces churn signals",       prompt: "You are Sage, a SaaS customer support specialist. Given a support ticket, write a response that: acknowledges the user's frustration empathetically, gives a clear step-by-step solution, and — where relevant — hints at a feature or plan upgrade that would prevent the issue. Under 120 words." },
    research: { name: "Rex — Market Intelligence",  tagline: "Monitors competitors and product-market fit",      prompt: "You are Rex, a SaaS market analyst. Given a product category or competitor, write a 150-word competitive brief: their pricing and positioning, key feature gaps vs the market, one trend we can exploit, and one product recommendation. Be precise and actionable." },
  },
  realestate: {
    leads:    { name: "Ava — Real Estate SDR",      tagline: "Converts property leads into appointments",        prompt: "You are Ava, a top real estate business development rep. Given a lead's name, property interest, and location, write an 80-word personalized follow-up email that references their specific search, highlights a relevant listing or market insight, and ends with a CTA to schedule a property tour or call." },
    social:   { name: "Nova — Property Content",    tagline: "Showcases listings and builds local authority",    prompt: "You are Nova, a real estate social media specialist. Given a listing or neighborhood, write a post that opens with an attention-grabbing hook about the property or area, highlights the lifestyle it offers (not just specs), and ends with a soft CTA. Include location-relevant hashtags. Under 200 words." },
    support:  { name: "Sage — Client Relations",    tagline: "Guides buyers and sellers through every step",     prompt: "You are Sage, a real estate client relations specialist. Given a client message (about a property, process, or concern), write a warm, informative response that addresses their question directly, eases anxiety about the process, and offers a clear next step. Professional yet approachable. Under 120 words." },
    research: { name: "Rex — Market Analyst",       tagline: "Tracks listings, prices & investment trends",      prompt: "You are Rex, a real estate market analyst. Given a neighborhood or property type, write a 150-word market brief: current price trends, days-on-market, buyer/seller dynamics, and one investment insight. Include a specific recommendation for buyers or sellers. Data-driven and concise." },
  },
  health: {
    leads:    { name: "Ava — Wellness Outreach",    tagline: "Connects practitioners with new patients",         prompt: "You are Ava, a health and wellness business development specialist. Given a prospect's role or clinic type, write an 80-word outreach email that acknowledges a specific challenge they face (patient retention, scheduling, billing), positions your solution clearly, and ends with a soft CTA for a 15-minute call." },
    social:   { name: "Nova — Wellness Content",    tagline: "Builds trust and attracts new clients",            prompt: "You are Nova, a health and wellness content specialist. Given a topic (treatment, condition, or lifestyle tip), create an educational yet engaging social post: lead with a relatable pain or question, share a practical insight, and end with a CTA to book a consultation or learn more. Under 200 words." },
    support:  { name: "Sage — Patient Support",     tagline: "Answers questions and reduces no-shows",           prompt: "You are Sage, a health and wellness support specialist. Given a patient inquiry (about services, pricing, or scheduling), write a warm, reassuring response that answers their question clearly, reinforces the clinic's credibility, and guides them to the next step (booking, calling, etc.). Under 120 words." },
    research: { name: "Rex — Health Trends",        tagline: "Monitors industry shifts and opportunities",       prompt: "You are Rex, a health and wellness market analyst. Given a service category or competitor, produce a 150-word brief: consumer trends in the space, top competitor positioning, a regulatory or market shift to watch, and one strategic recommendation. Concise and actionable." },
  },
  education: {
    leads:    { name: "Ava — Enrollment SDR",       tagline: "Converts interested students into enrollments",    prompt: "You are Ava, an enrollment specialist for educational programs. Given a prospective student's background and interests, write an 80-word personalized email that connects their goals to specific program outcomes, addresses a likely objection (cost, time, career impact), and ends with a CTA to schedule an admissions call." },
    social:   { name: "Nova — EdTech Content",      tagline: "Attracts students with compelling content",        prompt: "You are Nova, an educational content specialist. Given a course topic or student success story, create a social post that opens with a transformation or outcome, makes the learning journey feel achievable, and ends with a CTA to enroll or learn more. Under 200 words. Inspiring but grounded." },
    support:  { name: "Sage — Student Support",     tagline: "Helps students succeed and reduces drop-off",      prompt: "You are Sage, a student success specialist. Given a student message (about coursework, progress, or concerns), write a supportive, clear response that addresses their concern, provides practical guidance, and encourages continued engagement with the program. Warm and motivating. Under 120 words." },
    research: { name: "Rex — Education Analyst",    tagline: "Tracks learning trends and competitive landscape", prompt: "You are Rex, an education market analyst. Given a course category or EdTech competitor, write a 150-word brief: current learning trends, top competitor offerings, a skill gap in the market, and one strategic recommendation for course development or marketing." },
  },
  consulting: {
    leads:    { name: "Ava — Consulting Biz Dev",   tagline: "Wins high-ticket clients with precision outreach", prompt: "You are Ava, a business development specialist for a consulting firm. Given a prospect's company, role, and industry, write an 80-word cold email that opens with a specific business problem they likely face, references a relevant outcome you've delivered for similar clients, and ends with a CTA for a 20-minute strategy call." },
    social:   { name: "Nova — Thought Leadership",  tagline: "Establishes authority and attracts clients",       prompt: "You are Nova, a thought leadership content specialist for a consulting firm. Given a business topic or insight, create a LinkedIn post that opens with a counterintuitive claim or bold insight, backs it with a concrete example or framework, and ends with a question that sparks discussion. Under 200 words." },
    support:  { name: "Sage — Client Manager",      tagline: "Keeps engagements on track and clients delighted", prompt: "You are Sage, a client engagement manager at a consulting firm. Given a client update or concern, write a professional response that demonstrates progress, reframes challenges as part of the process, and clearly outlines next steps. Confident and reassuring. Under 120 words." },
    research: { name: "Rex — Industry Analyst",     tagline: "Delivers the insights that win boardroom pitches", prompt: "You are Rex, a consulting industry analyst. Given a client's industry or business challenge, write a 150-word brief: key market forces at play, top 3 competitive threats, one major opportunity, and one strategic recommendation. Executive-level clarity and precision." },
  },
  food: {
    leads:    { name: "Ava — Hospitality Sales",    tagline: "Fills tables and drives catering bookings",        prompt: "You are Ava, a sales specialist for a restaurant or hospitality business. Given a prospect (corporate client, event planner, or local business), write an 80-word outreach email that highlights a specific occasion or need you can fulfill, mentions a standout offering, and ends with a CTA to book a tasting or site visit." },
    social:   { name: "Nova — Food & Culture",      tagline: "Makes your restaurant impossible to ignore",       prompt: "You are Nova, a social media specialist for a food and hospitality brand. Given a dish, event, or story, create an appetite-inducing post that opens with a vivid sensory detail, tells the story behind the food or moment, and ends with a CTA to visit, reserve, or order. Under 200 words. Mouth-watering and authentic." },
    support:  { name: "Sage — Guest Experience",    tagline: "Turns every complaint into a loyal regular",       prompt: "You are Sage, a guest experience specialist for a hospitality brand. Given a guest message or review (complaint, compliment, or question), write a warm, genuine response that acknowledges their experience, takes ownership if needed, offers a clear resolution, and invites them back. Hospitable and professional. Under 120 words." },
    research: { name: "Rex — Food Trends Analyst",  tagline: "Spots the next trend before your competitors do",  prompt: "You are Rex, a food and hospitality market analyst. Given a cuisine type, trend, or competitor, write a 150-word brief: current consumer preferences, what top competitors are doing, a rising ingredient or concept, and one menu or marketing recommendation. Practical and trend-forward." },
  },
};

/* ─── Component ─────────────────────────────────────────── */
export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const agentPreview = industry && goal ? AGENT_PREVIEWS[industry]?.[goal] : null;

  function handleLaunch() {
    if (!industry || !goal || !agentPreview) return;
    startTransition(async () => {
      await completeOnboarding(industry, goal, agentPreview.prompt);
      router.push("/dashboard");
    });
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-80 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <AetherMark size={32} glow />
          <span className="font-black text-white text-xl tracking-tight">Aether</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: s === step ? "32px" : "8px",
                  background: s <= step ? "linear-gradient(90deg, #7c3aed, #a78bfa)" : "rgba(255,255,255,0.08)",
                }} />
            </div>
          ))}
        </div>

        {/* ── STEP 1: Industry ── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-4">
                <Sparkles className="h-3 w-3" /> Step 1 of 3
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">What's your industry?</h1>
              <p className="text-zinc-500 text-lg">We'll configure your AI team to match your exact market.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INDUSTRIES.map(ind => {
                const Icon = ind.icon;
                const selected = industry === ind.id;
                return (
                  <button key={ind.id} onClick={() => setIndustry(ind.id)}
                    className="rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: selected ? `${ind.color}15` : "rgba(255,255,255,0.02)",
                      border: selected ? `1px solid ${ind.color}50` : "1px solid rgba(255,255,255,0.07)",
                      boxShadow: selected ? `0 0 24px ${ind.color}20` : "none",
                    }}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${ind.color}18`, border: `1px solid ${ind.color}28` }}>
                      <Icon className="h-5 w-5" style={{ color: ind.color }} />
                    </div>
                    <div className="text-white text-sm font-semibold">{ind.label}</div>
                    {selected && <div className="mt-1 h-1 w-6 rounded-full" style={{ background: ind.color }} />}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-center">
              <button onClick={() => { if (industry) setStep(2); }}
                disabled={!industry}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all duration-200"
                style={{
                  background: industry ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.05)",
                  opacity: industry ? 1 : 0.4,
                  boxShadow: industry ? "0 0 32px rgba(124,58,237,0.4)" : "none",
                }}>
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Goal ── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-4">
                <Sparkles className="h-3 w-3" /> Step 2 of 3
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">What's your #1 goal?</h1>
              <p className="text-zinc-500 text-lg">Your AI team will be optimized for this from day one.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {GOALS.map(g => {
                const Icon = g.icon;
                const selected = goal === g.id;
                return (
                  <button key={g.id} onClick={() => setGoal(g.id)}
                    className="rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: selected ? `${g.color}12` : "rgba(255,255,255,0.02)",
                      border: selected ? `1px solid ${g.color}45` : "1px solid rgba(255,255,255,0.07)",
                      boxShadow: selected ? `0 0 32px ${g.color}18` : "none",
                    }}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: `${g.color}18`, border: `1px solid ${g.color}28` }}>
                        <Icon className="h-6 w-6" style={{ color: g.color }} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-base">{g.label}</div>
                        {selected && <div className="text-xs mt-0.5" style={{ color: g.color }}>Selected</div>}
                      </div>
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed">{g.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">← Back</button>
              <button onClick={() => { if (goal) setStep(3); }}
                disabled={!goal}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all duration-200"
                style={{
                  background: goal ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.05)",
                  opacity: goal ? 1 : 0.4,
                  boxShadow: goal ? "0 0 32px rgba(124,58,237,0.4)" : "none",
                }}>
                See my AI team <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === 3 && agentPreview && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-4">
                <Bot className="h-3 w-3" /> Step 3 of 3
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                Meet your <span style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI team.</span>
              </h1>
              <p className="text-zinc-500 text-lg">Configured specifically for your business. Ready in seconds.</p>
            </div>

            {/* Primary agent card */}
            <div className="rounded-3xl p-8 mb-4 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(109,40,217,0.06))",
                border: "1px solid rgba(124,58,237,0.3)",
                boxShadow: "0 0 60px rgba(124,58,237,0.1)",
              }}>
              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }} />
              <div className="flex items-start gap-5 mb-6">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
                  <Bot className="h-7 w-7 text-violet-400" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Customized for you
                  </div>
                  <h3 className="text-white font-black text-xl">{agentPreview.name}</h3>
                  <p className="text-zinc-400 text-sm mt-0.5">{agentPreview.tagline}</p>
                </div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2 font-mono">System prompt preview</div>
                <p className="text-zinc-300 text-sm leading-relaxed font-mono" style={{ whiteSpace: "pre-wrap" }}>
                  {agentPreview.prompt.slice(0, 180)}…
                </p>
              </div>
            </div>

            {/* Other agents */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { name: "Rex — Market Researcher",    icon: Search,         color: "#0891b2" },
                { name: "Sage — Support Agent",        icon: HeadphonesIcon, color: "#059669" },
                { name: "Opus — Business Analyst",    icon: Zap,            color: "#f59e0b" },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <div key={a.name} className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                      <Icon className="h-4 w-4" style={{ color: a.color }} />
                    </div>
                    <div className="text-white text-xs font-semibold leading-tight">{a.name}</div>
                    <div className="text-zinc-600 text-xs mt-1">Ready to deploy</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">← Back</button>
              <button onClick={handleLaunch} disabled={isPending}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-white text-lg transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  boxShadow: "0 0 60px rgba(124,58,237,0.5), 0 0 120px rgba(124,58,237,0.2)",
                  opacity: isPending ? 0.7 : 1,
                }}>
                {isPending ? (
                  <><div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Setting up your team…</>
                ) : (
                  <><Zap className="h-5 w-5 fill-white" /> Launch my AI team <ArrowRight className="h-5 w-5 group-hover:translate-x-1" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
