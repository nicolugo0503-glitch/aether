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

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [count, setCount] = useState({ teams: 0, emails: 0, saves: 0 });

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const colors = ["rgba(124,58,237,", "rgba(167,139,250,", "rgba(34,211,238,", "rgba(99,102,241,"];
    const particles: { x:number;y:number;vx:number;vy:number;size:number;alpha:number;color:string }[] = [];
    for (let i = 0; i < 140; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2.5 + 0.5, alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124,58,237,${0.07 * (1 - dist/130)})`;
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
        if (dist < 220) { p.vx += dx * 0.00007; p.vy += dy * 0.00007; }
        p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.vy *= 0.99;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // Mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Magnetic CTA button
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const onMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      btn.style.transform = `translate(${(e.clientX - cx) * 0.28}px, ${(e.clientY - cy) * 0.28}px)`;
    };
    const onLeave = () => { btn.style.transform = "translate(0, 0)"; };
    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
    return () => { btn.removeEventListener("mousemove", onMove); btn.removeEventListener("mouseleave", onLeave); };
  }, []);

  // Typewriter
  useEffect(() => {
    const word = WORDS[wordIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < word.length) {
      t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === word.length) {
      t = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % WORDS.length);
    }
    return () => clearTimeout(t);
  }, [displayed, deleting, wordIdx]);

  // Count-up animation
  useEffect(() => {
    const targets = { teams: 2400, emails: 847000, saves: 10 };
    const duration = 2200;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCount({ teams: Math.floor(e * targets.teams), emails: Math.floor(e * targets.emails), saves: Math.floor(e * targets.saves) });
      if (p < 1) requestAnimationFrame(tick);
    };
    const t = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Gradient orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full opacity-25"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.6) 0%, transparent 70%)", filter: "blur(50px)", animation: "pulse-glow 4s ease-in-out infinite" }} />
        <div className="absolute top-[15%] right-[-8%] w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.5) 0%, transparent 70%)", filter: "blur(70px)", animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.6) 0%, transparent 70%)", filter: "blur(70px)", animation: "float 10s ease-in-out infinite reverse" }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-xs mb-12 animate-fade-up"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(34,211,238,0.06))", border: "1px solid rgba(124,58,237,0.3)", backdropFilter: "blur(12px)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          <span className="text-violet-300 font-medium">Now live: Instagram · Facebook · X · Email automation</span>
          <ArrowRight className="h-3 w-3 text-violet-400" />
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-[88px] lg:text-[108px] font-black leading-[0.9] tracking-tight mb-8">
          <span className="block text-white font-mono text-[0.85em] md:text-[0.85em]">
            <ScrambleText text="AI that writes" />
          </span>
          <span className="block relative my-2">
            <span className="gradient-text text-glow">{displayed}</span>
            <span className="inline-block w-[3px] h-[0.82em] bg-violet-400 ml-1 align-middle animate-pulse" />
          </span>
          <span className="block text-white">for you.</span>
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-14 leading-relaxed">
          Aether deploys autonomous AI employees that send emails, post on Instagram, X, and Facebook, research leads — all on autopilot.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link ref={btnRef} href="/signup"
            className="group relative inline-flex items-center gap-3 px-9 py-4 rounded-2xl text-white font-bold text-lg overflow-hidden btn-shine"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 0 60px rgba(124,58,237,0.6), 0 0 120px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}>
            <span className="relative z-10">Deploy your AI team free</span>
            <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link href="#features"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-zinc-300 font-medium text-base transition-all hover:text-white group"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
            See it in action
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-24">
          {[
            { value: `${count.teams.toLocaleString()}+`, label: "Teams using Aether" },
            { value: `${(count.emails / 1000).toFixed(0)}K+`, label: "AI actions taken" },
            { value: `${count.saves}hrs+`, label: "Saved per team weekly" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-5xl font-black gradient-text">{stat.value}</div>
              <div className="text-sm text-zinc-600 mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
          <div className="flex -space-x-2.5">
            {["#7c3aed","#2563eb","#059669","#dc2626","#d97706"].map((c, i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-white"
                style={{ background: c }}>
                {["N","A","M","J","S"][i]}
              </div>
            ))}
          </div>
          <span><strong className="text-white">2,400+</strong> teams shipping with Aether</span>
        </div>
      </div>
    </section>
  );
}
