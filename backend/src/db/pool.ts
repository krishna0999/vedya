// One shared pg connection pool for the process. Services import `pool` and run
// queries directly; there is no ORM — the schema is small and jsonb-heavy.
import pg from 'pg';
import { env } from '../config/env';

// node-postgres does not honour `sslmode=require` in the URL on its own, so we
// detect it (and Neon hosts) and enable TLS explicitly. Neon terminates TLS at
// a proxy with a well-known CA, so `rejectUnauthorized: false` is expected.
function needsSsl(url: string): boolean {
  return /sslmode=require/.test(url) || /\.neon\.tech/.test(url);
}

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: needsSsl(env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
});

// Thin typed helper so callers get row types without repeating the generic dance.
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}
