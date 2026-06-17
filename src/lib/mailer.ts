// Email via Resend's HTTP API (POST over 443) instead of SMTP.
// Render's free tier blocks outbound SMTP ports, so nodemailer/Gmail can't
// connect; an HTTPS API call works fine.
//
// Env vars:
//   RESEND_API_KEY  - from https://resend.com (API Keys)
//   RESEND_FROM     - sender, e.g. "Habit Tracker <welcome@yourdomain.com>"
//                     defaults to Resend's shared test sender (onboarding@resend.dev)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Habit Tracker <onboarding@resend.dev>";

export async function sendWelcomeEmail(toEmail: string, name: string) {
  if (!RESEND_API_KEY) {
    console.warn("[mailer] RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  console.log("[mailer] sending welcome email via Resend", { to: toEmail });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: toEmail,
      subject: "Welcome to Habit Tracker!",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f0f7ff;border-radius:16px;">
          <h1 style="color:#1d4ed8;margin-bottom:8px;">Welcome, ${name}!</h1>
          <p style="color:#374151;font-size:16px;line-height:1.6;">
            You've successfully registered on <strong>Habit Tracker</strong>.
          </p>
          <blockquote style="border-left:4px solid #3b82f6;margin:24px 0;padding:12px 20px;background:#dbeafe;border-radius:8px;color:#1e40af;font-style:italic;">
            "Small habits, compounded daily, build the person you want to become."
          </blockquote>
          <p style="color:#6b7280;font-size:14px;">
            Start tracking your habits today and watch your progress grow day by day.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
            — The Habit Tracker Team
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id?: string };
  console.log("[mailer] welcome email sent", { id: data.id });
}
