"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ArrowRight, Menu, Sparkles, Zap, LayoutGrid, DollarSign } from "lucide-react";
import { AetherMark } from "@/components/ui/logo";

const LINKS = [
  { href: "#features",  label: "Features",  icon: Sparkles,   desc: "What Aether can do"       },
  { href: "#platforms", label: "Platforms", icon: LayoutGrid, desc: "Every channel, automated"  },
  { href: "#agents",    label: "Agents",    icon: Zap,        desc: "Your AI workforce"          },
  { href: "#pricing",   label: "Pricing",   icon: DollarSign, desc: "Simple, honest plans"      },
];

function MenuOverlay({ onClose, animIn }: { onClose: () => void; animIn: boolean }) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        opacity: animIn ? 1 : 0,
        transition: "opacity 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* Deep background */}
      <div style={{ position: "absolute", inset: 0, background: "#030305" }} />

      {/* Subtle noise texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4,
        pointerEvents: "none",
      }} />

      {/* Top violet glow */}
      <div style={{
        position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Bottom glow */}
      <div style={{
        position: "absolute", bottom: -80, right: -60,
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top bar */}
      <div style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} onClick={onClose}>
          <AetherMark size={28} glow />
          <span style={{ fontWeight: 900, color: "#fff", fontSize: 17, letterSpacing: "-0.02em" }}>Aether</span>
        </Link>
        <button
          onClick={onClose}
          style={{
            height: 36, width: 36, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
          }}
          aria-label="Close menu"
        >
          <X style={{ width: 16, height: 16, color: "rgba(255,255,255,0.7)" }} />
        </button>
      </div>

      {/* Nav links */}
      <nav style={{
        position: "relative", flex: 1,
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "8px 16px",
        gap: 6,
      }}>
        {LINKS.map((link, i) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 18,
                textDecoration: "none",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                opacity: animIn ? 1 : 0,
                transform: animIn ? "translateY(0) scale(1)" : "translateY(14px) scale(0.97)",
                transition: `opacity 0.35s cubic-bezier(0.4,0,0.2,1) ${0.04 + i * 0.06}s, transform 0.35s cubic-bezier(0.4,0,0.2,1) ${0.04 + i * 0.06}s`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Icon bubble */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(109,40,217,0.12))",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}>
                  <Icon style={{ width: 18, height: 18, color: "#a78bfa" }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                    {link.label}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                    {link.desc}
                  </div>
                </div>
              </div>
              <ArrowRight style={{ width: 16, height: 16, color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px" }} />

      {/* CTAs */}
      <div style={{
        position: "relative",
        padding: "16px 16px 36px",
        display: "flex", flexDirection: "column", gap: 10,
        opacity: animIn ? 1 : 0,
        transform: animIn ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.4s ease 0.28s, transform 0.4s ease 0.28s",
      }}>
        <Link
          href="/signup"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "15px",
            borderRadius: 16,
            textDecoration: "none",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            boxShadow: "0 4px 30px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
            color: "#fff", fontWeight: 700, fontSize: 15,
          }}
        >
          Get started free
          <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
        <Link
          href="/login"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "15px",
            borderRadius: 16,
            textDecoration: "none",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 15,
          }}
        >
          Sign in
        </Link>
      </div>
    </div>,
    document.body
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) handleClose(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
  };

  const handleClose = () => {
    setAnimIn(false);
    setTimeout(() => setOpen(false), 300);
  };

  return (
    <>
      <button
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={handleOpen}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 text-white" />
      </button>

      {open && <MenuOverlay onClose={handleClose} animIn={animIn} />}
    </>
  );
}
