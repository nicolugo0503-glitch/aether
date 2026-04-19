// Email sending via Resend API (https://resend.com)
// No npm package needed — just fetch

export async function sendEmail({
  apiKey,
  from,
  to,
  subject,
  body,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: body,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to send email");
  }
  return data;
}
