// Lucia session manager (CLAUDE.md §2, §10 — don't hand-roll auth). Backed by the
// existing pg pool via the Postgres adapter; sessions live in the `sessions`
// table, users in `users`. User attributes surfaced to the app are email + plan.
import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import { env } from '../config/env';
import { pool } from '../db/pool';

const adapter = new NodePostgresAdapter(pool, { user: 'users', session: 'sessions' });

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    // Secure cookies in production; dev is plain http on localhost.
    attributes: { secure: env.NODE_ENV === 'production' },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    name: attributes.name,
    plan: attributes.plan,
  }),
});

// Columns the adapter returns for a user (everything but `id`). We only expose
// email + plan to the app; password_hash stays out of the session user object.
interface DatabaseUserAttributes {
  email: string;
  name: string | null;
  plan: string;
  password_hash: string | null;
  created_at: Date;
}

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
