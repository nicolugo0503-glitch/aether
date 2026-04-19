import Link from "next/link";

/* ─── New Logo — Circuit "A" ─────────────────────────────────────────── */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-glow shrink-0"
    >
      <defs>
        <linearGradient id="lg1" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#00e87a" />
          <stop offset="100%" stopColor="#00b4ff" />
        </linearGradient>
      </defs>
      {/* Outer square frame */}
      <rect x="1" y="1" width="30" height="30" rx="7" stroke="url(#lg1)" strokeWidth="1.5" fill="rgba(0,232,122,0.04)" />
      {/* A shape */}
      <path d="M16 6 L24 26 M16 6 L8 26" stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round" />
      {/* Crossbar */}
      <line x1="11" y1="19" x2="21" y2="19" stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round" />
      {/* Corner circuit dots */}
      <circle cx="5"  cy="5"  r="1.5" fill="#00e87a" opacity="0.6" />
      <circle cx="27" cy="5"  r="1.5" fill="#00b4ff" opacity="0.6" />
      <circle cx="5"  cy="27" r="1.5" fill="#00b4ff" opacity="0.4" />
      <circle cx="27" cy="27" r="1.5" fill="#00e87a" opacity="0.4" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-mono text-base font-bold tracking-tight text-text">
      ÆTHER
    </span>
  );
}

/* ─── Marketing Nav ──────────────────────────────────────────────────── */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LogoMark size={28} />
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            ["How it works", "/#how-it-works"],
            ["AI Employees", "/#employees"],
            ["Platform",     "/#features"],
            ["Pricing",      "/pricing"],
          ].map(([label, href]) => (
            <Link key={label} href={href} className="btn-ghost text-sm">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login"  className="btn-ghost text-sm">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm px-4 py-2 rounded-xl">
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}
