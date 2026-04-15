import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingNav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

async function signup(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  if (!email || !password || password.length < 8) {
    return redirect("/signup?error=invalid");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return redirect("/signup?error=exists");

  const user = await prisma.user.create({
    data: {
      email,
      name: name || email.split("@")[0],
      passwordHash: await hashPassword(password),
      // Seed a starter agent so first login isn't empty.
      agents: {
        create: {
          name: "Ava — AI SDR",
          role: "Sales Development Rep",
          description: "Drafts personalized cold emails from lead context.",
          systemPrompt:
            "You are Ava, an elite B2B SDR. Given a lead profile, produce a tight 80-word cold email with a specific hook. No fluff, one CTA.",
        },
      },
    },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export default async function SignupPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <MarketingNav />
      <div className="mx-auto mt-16 max-w-md px-6">
        <div className="card">
          <h1 className="text-2xl font-semibold">Create your workspace</h1>
          <p className="mt-1 text-sm text-muted">
            Start free. No credit card required.
          </p>
          {error && (
            <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error === "exists"
                ? "An account with that email already exists."
                : "Please enter a valid email and a password of 8+ characters."}
            </div>
          )}
          <form action={signup} className="mt-6 space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input mt-1" type="text" name="name" />
            </div>
            <div>
              <label className="label">Work email</label>
              <input
                className="input mt-1"
                type="email"
                name="email"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input mt-1"
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button className="btn-primary w-full">Create workspace</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="link">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
