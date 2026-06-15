import nodemailer, { Transporter } from "nodemailer";

/**
 * Pluggable SMTP mailer.
 *
 * Email is OFF by default. To enable it, fill in the SMTP_* vars in `.env`:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  (required)
 *   SMTP_FROM                                    (optional, defaults to SMTP_USER)
 *
 * If any required var is missing, `sendMail` becomes a no-op that just logs —
 * nothing else in the app breaks. Works with Gmail (app password), the ITB
 * mail server, SendGrid/Mailtrap SMTP, etc.
 */

// `undefined` = not yet resolved, `null` = explicitly disabled (missing config)
let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    cachedTransporter = null;
    return null;
  }

  const port = Number(SMTP_PORT);
  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // SSL on 465, STARTTLS otherwise
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return cachedTransporter;
}

export function isMailEnabled(): boolean {
  return getTransporter() !== null;
}

export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string[];
  subject: string;
  text: string;
}): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `[mailer] disabled (SMTP not configured) — skipping: ${subject}`,
    );
    return;
  }

  if (to.length === 0) {
    console.log(`[mailer] no recipients — skipping: ${subject}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({ from, to, subject, text });
}
