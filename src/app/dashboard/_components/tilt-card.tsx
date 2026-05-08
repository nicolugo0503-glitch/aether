"use client";
import { useRef, MouseEvent, ReactNode, CSSProperties } from "react";

export function TiltCard({
  children, style, className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el  = ref.current; if (!el) return;
    const r   = el.getBoundingClientRect();
    const rx  = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -7;
    const ry  = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  7;
    el.style.transform  = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.025)`;
    el.style.transition = "transform 0.08s ease";
  };

  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform  = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.transition = "transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)";
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, transformStyle: "preserve-3d", willChange: "transform" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
