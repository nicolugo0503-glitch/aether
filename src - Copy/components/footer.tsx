import Link from "next/link";
import { LogoMark } from "./nav";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 text-sm md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <LogoMark />
            <span>Aether</span>
          </Link>
          <p className="mt-3 text-muted">
            The autonomous workforce for modern teams.
          </p>
        </div>
        <div>
          <div className="label mb-3">Product</div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/#features" className="hover:text-white">Features</Link></li>
            <li><Link href="/#employees" className="hover:text-white">AI Employees</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Company</div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/#" className="hover:text-white">About</Link></li>
            <li><Link href="/#" className="hover:text-white">Careers</Link></li>
            <li><Link href="/#" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Legal</div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/#" className="hover:text-white">Terms</Link></li>
            <li><Link href="/#" className="hover:text-white">Privacy</Link></li>
            <li><Link href="/#" className="hover:text-white">Security</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Aether AI, Inc. All rights reserved.
      </div>
    </footer>
  );
}
