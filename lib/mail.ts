const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY!;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN!;
const FROM_EMAIL = process.env.FROM_EMAIL || `Buzz2Remote <noreply@${MAILGUN_DOMAIN}>`;

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({ to, subject, html, text }: SendMailOptions) {
  const form = new URLSearchParams();
  form.append("from", FROM_EMAIL);
  form.append("to", to);
  form.append("subject", subject);
  form.append("html", html);
  if (text) form.append("text", text);

  const res = await fetch(
    `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Mailgun error: ${error}`);
  }

  return res.json();
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendMail({
    to: email,
    subject: "Welcome to Buzz2Remote!",
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Thanks for joining Buzz2Remote. Start exploring remote jobs now.</p>
      <a href="${process.env.NEXTAUTH_URL}/jobs">Browse Jobs</a>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  return sendMail({
    to: email,
    subject: "Reset your Buzz2Remote password",
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">Reset Password</a>
    `,
  });
}
