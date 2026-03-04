import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendWelcomeEmail(toEmail: string, name: string) {
  await transporter.sendMail({
    from: `"Habit Tracker" <${process.env.GMAIL_USER}>`,
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
  });
}
