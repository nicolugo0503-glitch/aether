import Link from "next/link";
import { MarketingNav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Check } from "lucide-react";

const tiers = [
  {
    key: "STARTER",
    name: "Starter",
    price: "$49",
    cadence: "/mo",
    blurb: "For solo operators and small teams trying their first AI employee.",
    features: ["3 AI employees", "500 runs / month", "All core integrations", "Email support"],
  },
  {
    key: "GROWTH",
    name: "Growth",
    price: "$299",
    cadence: "/mo",
    blurb: "For teams scaling AI across sales, support, and ops.",
    features: [
      "10 AI employees",
      "5,000 runs / month",
      "Autopilot workflows",
      "Priority support & SLAs",
      "Advanced analytics",
    ],
    popular: true,
  },
  {
    key: "SCALE",
    name: "Scale",
    price: "$1,499",
    cadence: "/mo",
    blurb: "For companies operationalizing an autonomous workforce.",
    features: [
      "100 AI employees",
      "50,000 runs / month",
      "SSO + SCIM",
      "SOC 2 Type II, audit logs",
      "BYO-model / VPC option",
      "Dedicated CSM",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <MarketingNav />
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Simple, seat-based pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Start free. Upgrade when the output is worth more than the bill. All plans
          include unlimited users, every AI employee, and the full runtime.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.key}
              className={
                "card relative flex flex-col " +
                (t.popular ? "border-accent" : "")
              }
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted">{t.blurb}</p>
              <div className="mt-6 text-4xl font-semibold">
                {t.price}
                <span className="text-base font-normal text-muted">{t.cadence}</span>
              </div>
              <ul className="mt-6 space-y-2 text-left text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-accent-2" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <form action="/api/stripe/checkout" method="POST" className="mt-6">
                <input type="hidden" name="plan" value={t.key} />
                <button className={t.popular ? "btn-primary w-full" : "btn-secondary w-full"}>
                  {t.popular ? "Start Growth" : `Choose ${t.name}`}
                </button>
              </form>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted">
          Need custom terms, procurement, or on-prem?{" "}
          <Link href="/#" className="link">Talk to sales</Link>.
        </p>
      </section>
      <Footer />
    </>
  );
}
