// Auth routes (CLAUDE.md §2). Credentials are ours to check; sessions are Lucia's.
// Cookies are set via Set-Cookie from the Lucia session cookie serializer.
import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { CredentialsSchema } from '../api/schemas';
import { hashPassword, verifyPassword } from '../auth/password';
import { lucia } from '../auth/lucia';
import { pool } from '../db/pool';
import { AppError } from '../lib/errors';

interface UserRow {
  id: string;
  email: string;
  plan: string;
  password_hash: string | null;
}

// Create a session for the user and attach its cookie to the reply.
async function startSession(reply: import('fastify').FastifyReply, userId: string): Promise<void> {
  const session = await lucia.createSession(userId, {});
  reply.header('set-cookie', lucia.createSessionCookie(session.id).serialize());
}

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
    return reply.status(201).send({ id, email, plan: 'free' });
  });

  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { email, password } = CredentialsSchema.parse(req.body ?? {});
    const { rows } = await pool.query<UserRow>(
      'SELECT id, email, plan, password_hash FROM users WHERE email = $1',
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
    return { id: user.id, email: user.email, plan: user.plan };
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
};
