import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <LogoMark />
          <span>Aether</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/#features" className="hover:text-white">Product</Link>
          <Link href="/#employees" className="hover:text-white">AI Employees</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/#faq" className="hover:text-white">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn-primary">Hire your first AI</Link>
        </div>
      </div>
    </header>
  );
}

export function LogoMark() {
  return (
    <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-accent to-accent-2" />
  );
}
