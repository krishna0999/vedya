// Transactional email via Resend's HTTP API (no SDK — it's one POST). Plain
// text only: no HTML means user-supplied content (form titles, answers) can't
// inject markup. Without RESEND_API_KEY (local dev) the email is logged instead.
import * as Sentry from '@sentry/node';
import { env } from '../config/env';

export interface Email {
  to: string;
  subject: string;
  text: string;
}

// Never throws: a failed email must not fail the request that triggered it.
// Callers that care (none yet) can check the boolean.
export async function sendEmail(email: Email): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.info(`[email:dev] to=${email.to} subject=${JSON.stringify(email.subject)}\n${email.text}`);
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, ...email }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[email] Resend ${res.status}: ${await res.text()}`);
      // Sends are fire-and-forget, so this is the only way an outage surfaces.
      // Status only: Resend's body can echo the recipient address.
      Sentry.captureMessage(`Resend rejected email (HTTP ${res.status})`, 'error');
    }
    return res.ok;
  } catch (err) {
    console.error('[email] send failed', err);
    Sentry.captureException(err);
    return false;
  }
}
