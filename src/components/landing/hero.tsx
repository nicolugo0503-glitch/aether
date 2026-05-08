"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const WORDS = ["cold emails", "social posts", "lead research", "X threads", "support tickets", "sales outreach"];
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!";

function ScrambleText({ text }: { text: string }) {
  const [output, setOutput] = useState(text);
  useEffect(() => {
    let iter = 0;
    const id = setInterval(() => {
      setOutput(
        text.split("").map((c, i) => {
          if (c === " ") return " ";
          if (i < iter) return c;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join("")
      );
      iter += 0.5;
      if (iter > text.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [text]);
  return <>{output}</>;
}

function LivePreviewCard() {
  const cards = [
    {
      agent: "Ava",
      role: "AI SDR",
      color: "#7c3aed",
      emoji: "⚡",
      status: "Composing email #47",
      lines: ["Subject: Quick question, Marcus", "", "Hi Marcus — congrats on the", "Series B. We help growth-stage", "teams like Helix book 3x demos."],
      meta: "lead@helix.com • 0.8s",
    },
    {
      agent: "Social",
      role: "Autopilot",
      color: "#e1306c",
      emoji: "📱",
      status: "Post published",
      lines: ["AI is transforming how teams", "work. Here's what we learned", "deploying 50 AI employees..."],
      meta: "Instagram · Facebook · X · just now",
    },
    {
      agent: "Rex",
      role: "Researcher",
      color: "#0891b2",
      emoji: "🔍",
      status: "Research complete",
      lines: ["Competitor brief: TechCorp", "• Series A, $8M raised", "• 42 employees, hiring SDRs", "• No AI automation stack"],
      meta: "for Sarah's pitch · 2.1s",
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [typedLines, setTypedLines] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const cycle = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % cards.length);
        setTypedLines(0);
        setAnimating(false);
      }, 400);
    }, 4000);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    setTypedLines(0);
    const t = setInterval(() => {
      setTypedLines(n => {
        if (n >= cards[activeIdx].lines.length) { clearInterval(t); return n; }
        return n + 1;
      });
    }, 320);
    return () => clearInterval(t);
  }, [activeIdx]);

  const card = cards[activeIdx];

  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      {/* Background cards (depth) */}
      {[1, 2].map(d => (
        <div key={d} className="absolute rounded-2xl"
          style={{
            inset: 0,
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.05)",
            transform: `translateX(${d * 10}px) translateY(${d * 10}px) scale(${1 - d * 0.03})`,
            zIndex: -d,
          }} />
      ))}

      {/* Main card */}
      <div
        className="rounded-2xl p-5 transition-all duration-400"
        style={{
          background: "rgba(10,10,15,0.92)",
          border: `1px solid ${card.color}40`,
          boxShadow: `0 0 60px ${card.color}20, 0 32px 64px rgba(0,0,0,0.5)`,
          backdropFilter: "blur(24px)",
          transform: animating ? "translateY(8px) scale(0.98)" : "translateY(0) scale(1)",
          opacity: animating ? 0 : 1,
          transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          minHeight: 200,
        }}>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: `${card.color}25`, border: `1px solid ${card.color}40` }}>
            {card.emoji}
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{card.agent}</div>
            <div className="text-xs" style={{ color: card.color }}>{card.status}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: card.color }} />
            <span className="text-xs text-zinc-600">LIVE</span>
          </div>
        </div>

        {/* Content lines */}
        <div className="rounded-xl p-3 font-mono text-xs space-y-0.5 mb-3" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {card.lines.slice(0, typedLines).map((line, i) => (
            <div key={i} className="text-zinc-300 leading-relaxed">{line || "\u00A0"}</div>
          ))}
          <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse" />
        </div>

        {/* Meta */}
        <div className="text-xs text-zinc-600">{card.meta}</div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-3 justify-center">
          {cards.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === activeIdx ? 16 : 4, background: i === activeIdx ? card.color : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
      </div>

      {/* Floating stat badge */}
      <div className="absolute -bottom-4 -right-4 rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 8px 24px rgba(124,58,237,0.5)", border: "1px solid rgba(167,139,250,0.3)" }}>
        142 emails sent today
      </div>
    </div>
  );
}

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [count, setCount] = useState({ teams: 0, emails: 0, saves: 0 });

  // Canvas particle system — pauses when not visible
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Skip canvas on touch/mobile devices for performance
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let visible = true;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const colors = ["rgba(124,58,237,", "rgba(167,139,250,", "rgba(34,211,238,", "rgba(99,102,241,"];
    const particles: { x:number;y:number;vx:number;vy:number;size:number;alpha:number;color:string }[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.4, alpha: Math.random() * 0.4 + 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    const draw = () => {
      if (!visible) { animId = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124,58,237,${0.06 * (1 - dist/120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 200) { p.vx += dx * 0.00006; p.vy += dy * 0.00006; }
        p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.vy *= 0.99;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };

    // Pause when tab is hidden
    const onVisibility = () => { visible = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVisibility);

    // Pause when canvas is scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    draw();
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const onMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - rect.left - rect.width/2) * 0.25}px, ${(e.clientY - rect.top - rect.height/2) * 0.25}px)`;
    };
    const onLeave = () => { btn.style.transform = "translate(0,0)"; };
    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
    return () => { btn.removeEventListener("mousemove", onMove); btn.removeEventListener("mouseleave", onLeave); };
  }, []);

  useEffect(() => {
    const word = WORDS[wordIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < word.length) {
      t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === word.length) {
      t = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
    } else {
      setDeleting(false);
      setWordIdx(i => (i + 1) % WORDS.length);
    }
    return () => clearTimeout(t);
  }, [displayed, deleting, wordIdx]);

  useEffect(() => {
    const targets = { teams: 2400, emails: 847000, saves: 10 };
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / 2200, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCount({ teams: Math.floor(e * targets.teams), emails: Math.floor(e * targets.emails), saves: Math.floor(e * targets.saves) });
      if (p < 1) requestAnimationFrame(tick);
    };
    const t = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Background orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[900px] h-[700px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.7) 0%, transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 5s ease-in-out infinite" }} />
        <div className="absolute top-[30%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-12"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.5) 0%, transparent 70%)", filter: "blur(80px)", animation: "float 9s ease-in-out infinite" }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.6) 0%, transparent 70%)", filter: "blur(70px)", animation: "float 11s ease-in-out infinite reverse" }} />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 z-0 opacity-[0.02]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* SPLIT SCREEN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

          {/* LEFT: Headline + CTAs */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-xs mb-10"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(34,211,238,0.05))", border: "1px solid rgba(124,58,237,0.28)", backdropFilter: "blur(12px)" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              <span className="text-violet-300 font-medium">Instagram · Facebook · X · Email — all on autopilot</span>
            </div>

            {/* Headline */}
            <h1 className="text-[42px] sm:text-[56px] md:text-[72px] lg:text-[88px] font-black leading-[0.9] tracking-tight mb-6 md:mb-8">
              <span className="block text-white">The AI team</span>
              <span className="block relative">
                <span className="gradient-text text-glow">{displayed}</span>
                <span className="inline-block w-[3px] h-[0.82em] bg-violet-400 ml-1 align-middle animate-pulse" />
              </span>
              <span className="block text-white font-mono text-[0.88em]">
                <ScrambleText text="for you." />
              </span>
            </h1>

            <p className="text-base md:text-xl text-zinc-400 mb-8 md:mb-10 leading-relaxed max-w-lg">
              Deploy autonomous AI employees that send emails, post on every social network, and research leads — 24/7, zero clicks.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <Link ref={btnRef} href="/signup"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base overflow-hidden btn-shine"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: "0 0 50px rgba(124,58,237,0.55), 0 0 100px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}>
                <span className="relative z-10">Deploy your AI team free</span>
                <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="#features"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-zinc-300 font-medium text-base transition-all hover:text-white group"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
                Watch it work
                <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-sm">
              {[
                { value: `${count.teams.toLocaleString()}+`, label: "Teams" },
                { value: `${(count.emails / 1000).toFixed(0)}K+`, label: "AI actions" },
                { value: `${count.saves}hrs+`, label: "Saved weekly" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl md:text-3xl font-black gradient-text">{s.value}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Live agent preview */}
          <div className="hidden lg:block relative">
            <div style={{ transform: "perspective(1400px) rotateY(-6deg) rotateX(3deg)" }}>
              <LivePreviewCard />
            </div>

            {/* Floating mini stats */}
            <div className="absolute -top-6 -left-6 rounded-2xl px-4 py-3 text-xs"
              style={{ background: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                94% delivery rate
              </div>
            </div>

            <div className="absolute -bottom-2 -left-12 rounded-2xl px-4 py-3 text-xs"
              style={{ background: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center gap-2 mb-1 text-zinc-400">
                <span>Platforms</span>
              </div>
              <div className="flex gap-1.5">
                {["IG","FB","X","✉"].map(p => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded-full text-zinc-300"
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
