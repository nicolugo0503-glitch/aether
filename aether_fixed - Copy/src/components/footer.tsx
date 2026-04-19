import Link from "next/link";
import { LogoMark, Wordmark } from "./nav";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <LogoMark size={24} />
            <Wordmark />
          </Link>
          <p className="text-sm text-muted leading-relaxed max-w-xs">
            The autonomous AI workforce platform. Replace repetitive work with AI employees that perform.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            All systems operational
          </div>
        </div>
        {[
          { title: "Product",  items: [["Features","/#features"],["AI Employees","/#employees"],["Pricing","/pricing"],["How it works","/#how-it-works"]] },
          { title: "Company",  items: [["About","#"],["Blog","#"],["Careers","#"],["Contact","#"]] },
          { title: "Legal",    items: [["Terms","#"],["Privacy","#"],["Security","#"]] },
        ].map(({ title, items }) => (
          <div key={title}>
            <div className="label mb-4">{title}</div>
            <ul className="space-y-2.5">
              {items.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted hover:text-accent transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/50 py-5">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-muted">
          <span>© {new Date().getFullYear()} Aether AI, Inc. SOC 2 Type II certified.</span>
          <span>Built for teams that move fast.</span>
        </div>
      </div>
    </footer>
  );
}
