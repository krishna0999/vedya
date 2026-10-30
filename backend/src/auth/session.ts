// Request <-> session glue. A global onRequest hook resolves the session cookie
// into request.user (or null) and refreshes/clears the cookie as Lucia dictates.
// requireAuth gates owner routes; getUserId reads the authenticated id.
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors';
import { lucia } from './lucia';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  emailVerified: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser | null;
  }
}

// onRequest hook: parse + validate the session cookie, hydrate request.user, and
// keep the cookie fresh (Lucia rolls session expiry) or blank it when invalid.
export async function populateUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
  if (!sessionId) {
    req.user = null;
    return;
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (session?.fresh) {
    reply.header('set-cookie', lucia.createSessionCookie(session.id).serialize());
  }
  if (!session) {
    reply.header('set-cookie', lucia.createBlankSessionCookie().serialize());
  }
  req.user = user;
}

// preHandler for owner-scoped routes.
export async function requireAuth(req: FastifyRequest): Promise<void> {
  if (!req.user) throw new AppError(401, 'You must be signed in.');
}

// Read the authenticated owner id (defensive: only valid after requireAuth).
export function getUserId(req: FastifyRequest): string {
  if (!req.user) throw new AppError(401, 'You must be signed in.');
  return req.user.id;
}
