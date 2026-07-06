import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

// Build a real SMTP transport only if EMAIL_* is configured. In local dev with
// no SMTP, we fall back to logging the message (and reset link) to the console.
function getTransporter() {
  if (transporter) return transporter;
  if (!env.email.host || !env.email.user) return null;

  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: { user: env.email.user, pass: env.email.pass },
  });
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    console.log('\n[mailer] SMTP not configured — logging email instead:');
    console.log(`[mailer]   to:      ${to}`);
    console.log(`[mailer]   subject: ${subject}`);
    console.log(`[mailer]   body:    ${text}\n`);
    return { logged: true };
  }
  return tx.sendMail({ from: env.email.from, to, subject, text, html });
}

export async function sendPasswordReset(to, resetUrl) {
  return sendMail({
    to,
    subject: 'Reset your WOW-Toon-Data password',
    text: `You requested a password reset.\n\nOpen this link to choose a new password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>You requested a password reset.</p>
<p><a href="${resetUrl}">Choose a new password</a> (valid for 1 hour).</p>
<p>If you didn't request this, you can ignore this email.</p>`,
  });
}
