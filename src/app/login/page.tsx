import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingNav } from "@/components/nav";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return redirect("/login?error=missing");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return redirect("/login?error=invalid");
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <MarketingNav />
      <div className="mx-auto mt-16 max-w-md px-6">
        <div className="card">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to your Aether workspace.
          </p>
          {error && (
            <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error === "invalid" ? "Invalid email or password." : "Missing fields."}
            </div>
          )}
          <form action={login} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
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
                autoComplete="current-password"
              />
            </div>
            <button className="btn-primary w-full">Sign in</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            No account?{" "}
            <Link href="/signup" className="link">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}
