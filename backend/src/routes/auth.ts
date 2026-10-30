// Auth routes (CLAUDE.md §2). Credentials are ours to check; sessions are Lucia's.
// Cookies are set via Set-Cookie from the Lucia session cookie serializer.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import {
  ChangePasswordSchema, CredentialsSchema, ForgotPasswordSchema, ResetPasswordSchema,
  UpdateProfileSchema, VerifyEmailSchema,
} from '../api/schemas';
import { hashPassword, verifyPassword } from '../auth/password';
import { lucia } from '../auth/lucia';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { sendEmail } from '../lib/email';
import { AppError } from '../lib/errors';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  password_hash: string | null;
  email_verified_at: Date | null;
}

// Create a session for the user and attach its cookie to the reply.
async function startSession(reply: import('fastify').FastifyReply, userId: string): Promise<void> {
  const session = await lucia.createSession(userId, {});
  reply.header('set-cookie', lucia.createSessionCookie(session.id).serialize());
}

// --- Emailed single-use tokens (verify email / reset password) --------------

type TokenPurpose = 'verify' | 'reset';
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// Issue a fresh token (replacing any outstanding one of the same purpose) and
// return the raw value for the link. Only its hash is stored.
async function issueToken(userId: string, purpose: TokenPurpose, ttlMinutes: number): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await pool.query('DELETE FROM email_tokens WHERE user_id = $1 AND purpose = $2', [userId, purpose]);
  await pool.query(
    `INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [sha256(token), userId, purpose, ttlMinutes],
  );
  return token;
}

// Atomically use up a token: deleted whether or not it's still valid, so a
// link works at most once. Returns the user id, or null if bad/expired.
async function consumeToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  const { rows } = await pool.query<{ user_id: string; expired: boolean }>(
    `DELETE FROM email_tokens WHERE token_hash = $1 AND purpose = $2
     RETURNING user_id, expires_at < now() AS expired`,
    [sha256(token), purpose],
  );
  const row = rows[0];
  return row && !row.expired ? row.user_id : null;
}

async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const token = await issueToken(userId, 'verify', 60 * 24);
  await sendEmail({
    to: email,
    subject: 'Confirm your email for Vedya',
    text:
      `Confirm this is your email address so Vedya can send you form notifications:\n\n` +
      `${env.appUrl}/verify-email?token=${token}\n\n` +
      `The link works once and expires in 24 hours. If you didn't sign up for Vedya, ignore this email.`,
  });
}

const toAuthUser = (u: UserRow) => ({
  id: u.id, email: u.email, name: u.name, plan: u.plan, emailVerified: u.email_verified_at !== null,
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  // Rate-limit credential endpoints per IP: blunt brute-force and signup spam.
  app.post('/auth/signup', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { email, password } = CredentialsSchema.parse(req.body ?? {});
    const passwordHash = await hashPassword(password);
    const id = randomUUID();
    try {
      await pool.query(
        `INSERT INTO users (id, email, plan, password_hash) VALUES ($1, $2, 'free', $3)`,
        [id, email, passwordHash],
      );
    } catch (err) {
      // 23505 = unique_violation on the email citext index.
      if ((err as { code?: string }).code === '23505') {
        throw new AppError(409, 'An account with that email already exists.');
      }
      throw err;
    }
    await startSession(reply, id);
    // Fire-and-forget: signup shouldn't wait on (or fail because of) email.
    void sendVerificationEmail(id, email).catch((err) => req.log.error(err));
    return reply.status(201).send({ id, email, name: null, plan: 'free', emailVerified: false });
  });

  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { email, password } = CredentialsSchema.parse(req.body ?? {});
    const { rows } = await pool.query<UserRow>(
      'SELECT id, email, name, plan, password_hash, email_verified_at FROM users WHERE email = $1',
      [email],
    );
    const user = rows[0];
    // Same error whether the email is unknown or the password is wrong — don't
    // leak which emails have accounts. Still run a verify to blunt timing signals.
    const ok = user?.password_hash
      ? await verifyPassword(user.password_hash, password)
      : await verifyPassword('x:00', password).then(() => false);
    if (!user || !ok) throw new AppError(401, 'Incorrect email or password.');

    await startSession(reply, user.id);
    return toAuthUser(user);
  });

  // Always answers the same way whether or not the email has an account (no
  // account enumeration). The send is fire-and-forget so timing doesn't leak it.
  app.post('/auth/forgot-password', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req) => {
    const { email } = ForgotPasswordSchema.parse(req.body ?? {});
    const { rows } = await pool.query<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE email = $1',
      [email],
    );
    const user = rows[0];
    if (user) {
      void (async () => {
        // Per-account cooldown on top of the per-IP limit: rotating IPs can't
        // flood someone's inbox with reset emails.
        const recent = await pool.query(
          `SELECT 1 FROM email_tokens WHERE user_id = $1 AND purpose = 'reset'
              AND created_at > now() - interval '2 minutes'`,
          [user.id],
        );
        if (recent.rowCount) return;
        const token = await issueToken(user.id, 'reset', 30);
        await sendEmail({
          to: user.email,
          subject: 'Reset your Vedya password',
          text:
            `Someone (hopefully you) asked to reset the password for this Vedya account.\n\n` +
            `${env.appUrl}/reset-password?token=${token}\n\n` +
            `The link works once and expires in 30 minutes. If you didn't ask, ignore this email — your password won't change.`,
        });
      })().catch((err) => req.log.error(err));
    }
    return { ok: true };
  });

  // Set a new password from an emailed link. Following the link proves inbox
  // ownership, so it also verifies the email. Every other session is revoked.
  app.post('/auth/reset-password', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const { token, newPassword } = ResetPasswordSchema.parse(req.body ?? {});
    const userId = await consumeToken(token, 'reset');
    if (!userId) throw new AppError(400, 'This reset link is invalid or has expired. Request a new one.');
    const { rows } = await pool.query<UserRow>(
      `UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, now())
        WHERE id = $1
        RETURNING id, email, name, plan, password_hash, email_verified_at`,
      [userId, await hashPassword(newPassword)],
    );
    await lucia.invalidateUserSessions(userId);
    await startSession(reply, userId);
    return toAuthUser(rows[0]!);
  });

  app.post('/auth/verify-email', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (req) => {
    const { token } = VerifyEmailSchema.parse(req.body ?? {});
    const userId = await consumeToken(token, 'verify');
    if (!userId) throw new AppError(400, 'This confirmation link is invalid or has expired.');
    await pool.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1', [userId]);
    return { ok: true };
  });

  app.post('/auth/resend-verification', { config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } }, async (req) => {
    if (!req.user) throw new AppError(401, 'Not signed in.');
    if (!req.user.emailVerified) await sendVerificationEmail(req.user.id, req.user.email);
    return { ok: true };
  });

  app.post('/auth/logout', async (req, reply) => {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
    if (sessionId) await lucia.invalidateSession(sessionId);
    reply.header('set-cookie', lucia.createBlankSessionCookie().serialize());
    return { ok: true };
  });

  app.get('/auth/me', async (req) => {
    if (!req.user) throw new AppError(401, 'Not signed in.');
    return req.user;
  });

  // Update profile (display name only — email change needs verification infra we
  // don't have yet). Empty string clears the name back to NULL.
  app.patch('/auth/profile', async (req) => {
    if (!req.user) throw new AppError(401, 'Not signed in.');
    const { name } = UpdateProfileSchema.parse(req.body ?? {});
    const value = name.length ? name : null;
    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [value, req.user.id]);
    return { ...req.user, name: value };
  });

  // Change password: verify the current one, store the new hash, then rotate —
  // invalidate every session and start a fresh one for this device.
  app.patch('/auth/password', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (!req.user) throw new AppError(401, 'Not signed in.');
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body ?? {});
    const { rows } = await pool.query<{ password_hash: string | null }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id],
    );
    const hash = rows[0]?.password_hash;
    if (!hash || !(await verifyPassword(hash, currentPassword))) {
      throw new AppError(401, 'Current password is incorrect.');
    }
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      await hashPassword(newPassword),
      req.user.id,
    ]);
    await lucia.invalidateUserSessions(req.user.id);
    await startSession(reply, req.user.id);
    return { ok: true };
  });

  // Delete account: the users row cascades to sessions, forms, versions,
  // submissions, and views (FKs in migrations 001/002/004).
  app.delete('/auth/account', async (req, reply) => {
    if (!req.user) throw new AppError(401, 'Not signed in.');
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    reply.header('set-cookie', lucia.createBlankSessionCookie().serialize());
    return reply.status(204).send();
  });
};
