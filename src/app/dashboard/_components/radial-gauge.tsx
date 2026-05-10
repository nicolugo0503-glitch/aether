"use client";
import { useEffect, useState } from "react";

export function RadialGauge({
  value, max, label, size = 120,
}: {
  value: number;
  max: number;
  size?: number;
  label?: string;
}) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min(value / max, 1);

  useEffect(() => {
    const t = setTimeout(() => {
      let frame = 0;
      const total = 60;
      const id = setInterval(() => {
        frame++;
        const ease = 1 - Math.pow(1 - frame / total, 3);
        setAnimated(ease * pct);
        if (frame >= total) clearInterval(id);
      }, 16);
      return () => clearInterval(id);
    }, 200);
    return () => clearTimeout(t);
  }, [pct]);

  const R = (size / 2) - 10;
  const circ = 2 * Math.PI * R;
  const arcStart = -220; // degrees — leave gap at bottom
  const arcSpan  = 260;  // degrees of arc

  const color = animated > 0.8 ? "#ef4444" : animated > 0.6 ? "#f59e0b" : "#7c3aed";
  const glowColor = animated > 0.8 ? "rgba(239,68,68,0.5)" : animated > 0.6 ? "rgba(245,158,11,0.5)" : "rgba(124,58,237,0.5)";

  // SVG arc path
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = size / 2, cy = size / 2;

  function arcPath(startDeg: number, spanDeg: number) {
    const s = toRad(startDeg);
    const e = toRad(startDeg + spanDeg);
    const x1 = cx + R * Math.cos(s);
    const y1 = cy + R * Math.sin(s);
    const x2 = cx + R * Math.cos(e);
    const y2 = cy + R * Math.sin(e);
    const large = spanDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  }

  const bgPath   = arcPath(arcStart, arcSpan);
  const fillPath = arcPath(arcStart, arcSpan * animated);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Shadow filter */}
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} strokeLinecap="round" />
        {/* Fill */}
        {animated > 0 && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        )}
        {/* Center text */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={size * 0.18}
          fontWeight="900"
          fontFamily="inherit"
        >
          {value}
        </text>
        <text
          x={cx} y={cy + size * 0.14}
          textAnchor="middle"
          fill="#52525b"
          fontSize={size * 0.1}
          fontFamily="inherit"
        >
          / {max}
        </text>
        {label && (
          <text
            x={cx} y={cy + size * 0.28}
            textAnchor="middle"
            fill="#3f3f46"
            fontSize={size * 0.08}
            fontFamily="inherit"
            letterSpacing="0.06em"
            style={{ textTransform: "uppercase" }}
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
