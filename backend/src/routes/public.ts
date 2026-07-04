// Public, unauthenticated routes for the renderer (CLAUDE.md §6). The submit
// endpoint is rate-limited (it is the one write path a stranger can hit).
import type { FastifyPluginAsync } from 'fastify';
import { SubmissionBodySchema } from '../api/schemas';
import { getPublishedVersion } from '../services/forms';
import { submit } from '../services/submissions';

type FormParams = { Params: { formId: string } };

export const publicRoutes: FastifyPluginAsync = async (app) => {
  // The currently published FormVersion the renderer consumes.
  app.get<FormParams>('/f/:formId', async (req) => getPublishedVersion(req.params.formId));

  // Validate (server-side, authoritative) against the published version and store.
  app.post<FormParams>(
    '/f/:formId/submissions',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { answers } = SubmissionBodySchema.parse(req.body ?? {});
      const result = await submit(req.params.formId, answers, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return reply.status(201).send(result);
    },
  );
};
