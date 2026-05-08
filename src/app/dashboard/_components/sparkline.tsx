"use client";

interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  filled?: boolean;
}

export function Sparkline({ values, color = "#7c3aed", width = 80, height = 32, filled = true }: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * w,
    y: pad + h - ((v - min) / range) * h,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const fillPath = `M${points[0].x},${points[0].y} ` +
    points.slice(1).map((p) => `L${p.x},${p.y}`).join(" ") +
    ` L${points[points.length - 1].x},${pad + h} L${points[0].x},${pad + h} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {filled && (
        <path
          d={fillPath}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* last dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
