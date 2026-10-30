// Builds the Fastify instance. Kept separate from index.ts so tests can build an
// app without binding a port. Routes are framework-thin; this is where the
// cross-cutting concerns (CORS, rate limit, error mapping) live.
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import * as Sentry from '@sentry/node';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { env } from './config/env';
import { populateUser } from './auth/session';
import { clientIp } from './lib/clientIp';
import { AppError } from './lib/errors';
import { authRoutes } from './routes/auth';
import { formRoutes } from './routes/forms';
import { healthRoutes } from './routes/health';
import { templateRoutes } from './routes/templates';
import { publicRoutes } from './routes/public';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    // Don't trust X-Forwarded-For: Render appends to it, so its left-most entry
    // is client-controlled. The real client IP comes from lib/clientIp.
    trustProxy: false,
  });

  await app.register(cors, { origin: env.corsOrigins, credentials: true });
  // Generous global cap; the public submit route tightens this further.
  await app.register(rateLimit, { global: false, max: 200, timeWindow: '1 minute', keyGenerator: clientIp });

  // CSRF defence in depth (Lucia's recommendation): a browser's state-changing
  // request must come from an allowed origin. SameSite=Lax already keeps the
  // cookie off cross-site requests; this also covers same-site subdomains.
  // A missing Origin is a non-browser client, which CSRF can't come from.
  app.addHook('onRequest', async (req) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
    const origin = req.headers.origin;
    if (origin && !env.corsOrigins.includes(origin)) throw new AppError(403, 'Origin not allowed.');
  });

  // Resolve the session cookie into request.user for every request.
  app.decorateRequest('user', null);
  app.addHook('onRequest', populateUser);

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message, details: error.details });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: 'Invalid request body.', details: error.issues });
    }
    // Fastify's own validation / 4xx errors carry a statusCode < 500.
    const e = error as { statusCode?: number; message?: string; code?: string };
    // Postgres invalid_text_representation: a malformed uuid in the URL. Every
    // id we take is a uuid, so the resource simply doesn't exist.
    if (e.code === '22P02') return reply.status(404).send({ error: 'Not found.' });
    if (typeof e.statusCode === 'number' && e.statusCode < 500) {
      return reply.status(e.statusCode).send({ error: e.message });
    }
    reply.log.error(error);
    // Only real failures reach monitoring; 4xx above are the client's doing.
    Sentry.captureException(error, { tags: { route: _req.routeOptions.url ?? 'unknown' } });
    return reply.status(500).send({ error: 'Internal server error.' });
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(formRoutes, { prefix: '/api' });
  await app.register(templateRoutes, { prefix: '/api' });
  await app.register(publicRoutes, { prefix: '/api' });

  return app;
}
