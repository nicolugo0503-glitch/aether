"use client";

interface AetherMarkProps {
  size?: number;
  glow?: boolean;
  className?: string;
}

export function AetherMark({ size = 36, glow = true, className = "" }: AetherMarkProps) {
  const id = `logo-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`${id}-grad2`} x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" stopOpacity="0.6" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0.6" />
        </linearGradient>
        {glow && (
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Outer ring — rotates slowly */}
      <circle
        cx="20" cy="20" r="18.5"
        stroke={`url(#${id}-grad2)`}
        strokeWidth="0.75"
        strokeDasharray="4 3"
        opacity="0.5"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 20 20"
          to="360 20 20"
          dur="12s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Inner background circle */}
      <circle cx="20" cy="20" r="15" fill={`url(#${id}-grad)`} opacity="0.08" />
      <circle cx="20" cy="20" r="15" stroke={`url(#${id}-grad)`} strokeWidth="0.75" opacity="0.35" />

      {/* The A — clean geometric letterform */}
      <path
        d="M20 9 L28.5 29 H24.8 L20 18.5 L15.2 29 H11.5 Z"
        fill={`url(#${id}-grad)`}
        filter={glow ? `url(#${id}-glow)` : undefined}
      />
      {/* Crossbar */}
      <rect x="14.5" y="22.5" width="11" height="2" rx="1" fill={`url(#${id}-grad)`} />

      {/* Apex dot — glows */}
      <circle cx="20" cy="9" r="2" fill="#a78bfa">
        {glow && (
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Orbiting dot */}
      <circle cx="20" cy="1.5" r="1.5" fill="#22d3ee" opacity="0.9">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 20 20"
          to="-360 20 20"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Tiny accent dots at bottom corners */}
      <circle cx="11.5" cy="29" r="1" fill="#7c3aed" opacity="0.5" />
      <circle cx="28.5" cy="29" r="1" fill="#22d3ee" opacity="0.5" />
    </svg>
  );
}

export function AetherWordmark({ height = 28 }: { height?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <AetherMark size={height} glow={true} />
      <span
        className="font-black tracking-tight text-white"
        style={{ fontSize: height * 0.72, letterSpacing: "-0.02em" }}
      >
        Aether
      </span>
    </div>
  );
}
