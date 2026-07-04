import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../db/pool';

// Liveness + DB reachability. Handy for local smoke tests and uptime checks.
export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    await pool.query('SELECT 1');
    return { ok: true };
  });
};
