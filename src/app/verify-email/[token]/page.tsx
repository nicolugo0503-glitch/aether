import { redirect } from "next/navigation";

// Redirect old /verify-email/TOKEN links to the API route handler
// which is the only place that can set cookies (createSession) in Next.js 15
export default async function VerifyEmailPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/api/auth/verify-email?token=${token}`);
}
