"use client";
import { useRef, useState, useCallback, ReactNode, CSSProperties } from "react";

export function HoloCard({
  children, style, className, intensity = 18, disabled = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  intensity?: number;
  disabled?: boolean;
}) {
  const ref  = useRef<HTMLDivElement>(null);
  const raf  = useRef<number>(0);
  const [shine, setShine] = useState({ x: 50, y: 50, active: false });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current; if (!el) return;
      const r  = el.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width;
      const y  = (e.clientY - r.top)  / r.height;
      const rx = (y - 0.5) * -intensity;
      const ry = (x - 0.5) *  intensity;
      el.style.transform  = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.03,1.03,1.03)`;
      el.style.transition = "transform 0.06s ease";
      setShine({ x: x * 100, y: y * 100, active: true });
    });
  }, [intensity, disabled]);

  const onLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const el = ref.current; if (!el) return;
    el.style.transform  = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    el.style.transition = "transform 0.55s cubic-bezier(0.23,1,0.32,1)";
    setShine(s => ({ ...s, active: false }));
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, transformStyle: "preserve-3d", willChange: "transform", position: "relative" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Rainbow shimmer layer */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "inherit",
        background: shine.active
          ? `
            radial-gradient(ellipse at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18) 0%, transparent 55%),
            linear-gradient(${105 + shine.x * 1.2}deg,
              rgba(255,80,120,0.05) 0%,
              rgba(124,58,237,0.07) 20%,
              rgba(0,190,255,0.05) 40%,
              rgba(80,255,180,0.04) 60%,
              rgba(124,58,237,0.07) 80%,
              rgba(255,80,120,0.05) 100%
            )
          ` : "none",
        pointerEvents: "none",
        zIndex: 5,
        transition: "background 0.1s ease",
        mixBlendMode: "overlay",
      }} />
      {/* Deep shadow on tilt */}
      {shine.active && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          boxShadow: `
            0 0 0 1px rgba(124,58,237,0.35),
            0 20px 60px rgba(0,0,0,0.6),
            0 0 40px rgba(124,58,237,0.15)
          `,
          pointerEvents: "none",
          zIndex: 4,
        }} />
      )}
      {children}
    </div>
  );
}
