import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../db/pool';

// Liveness + DB reachability. Handy for local smoke tests and uptime checks.
export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    await pool.query('SELECT 1');
    return { ok: true };
  });

  // Liveness only — never touches the DB. Target for keep-awake pings and
  // Render's health check, so they don't hold Neon awake (it scales to zero
  // after 5 idle minutes; always-on would exhaust the free CU-hours).
  app.get('/ping', async () => ({ ok: true }));
};
