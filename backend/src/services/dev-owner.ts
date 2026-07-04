// AUTH SEAM (step 5). Until Lucia lands, every owner-scoped route acts as one
// fixed dev user. This is the ONLY place that assumption lives — swap
// `requireOwner` for real session resolution in step 5 and no route changes.
import { pool } from '../db/pool';

// A fixed uuid so the seeded row is stable across restarts and migrations.
export const DEV_OWNER_ID = '00000000-0000-4000-8000-000000000001';
const DEV_OWNER_EMAIL = 'dev@formbuilder.local';

// Ensure the dev user exists (FK target for forms.owner_id). Called once on boot.
export async function ensureDevOwner(): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, email, plan) VALUES ($1, $2, 'free')
     ON CONFLICT (id) DO NOTHING`,
    [DEV_OWNER_ID, DEV_OWNER_EMAIL],
  );
}

// Resolve the current owner for a request. In step 5 this reads the Lucia
// session; for now it is always the dev owner.
export function requireOwner(): string {
  return DEV_OWNER_ID;
}
