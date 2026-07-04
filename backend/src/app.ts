// Builds the Fastify instance. Kept separate from index.ts so tests can build an
// app without binding a port. Routes are framework-thin; this is where the
// cross-cutting concerns (CORS, rate limit, error mapping) live.
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { env } from './config/env';
import { AppError } from './lib/errors';
import { formRoutes } from './routes/forms';
import { healthRoutes } from './routes/health';
import { publicRoutes } from './routes/public';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    // Trust the proxy so req.ip reflects the real client (rate limiting + meta).
    trustProxy: true,
  });

  await app.register(cors, { origin: env.corsOrigins, credentials: true });
  // Generous global cap; the public submit route tightens this further.
  await app.register(rateLimit, { global: false, max: 200, timeWindow: '1 minute' });

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message, details: error.details });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: 'Invalid request body.', details: error.issues });
    }
    // Fastify's own validation / 4xx errors carry a statusCode < 500.
    const e = error as { statusCode?: number; message?: string };
    if (typeof e.statusCode === 'number' && e.statusCode < 500) {
      return reply.status(e.statusCode).send({ error: e.message });
    }
    reply.log.error(error);
    return reply.status(500).send({ error: 'Internal server error.' });
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(formRoutes, { prefix: '/api' });
  await app.register(publicRoutes, { prefix: '/api' });

  return app;
}
