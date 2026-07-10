// Public, unauthenticated routes for the renderer (CLAUDE.md §6). The submit
// endpoint is rate-limited (it is the one write path a stranger can hit).
import type { FastifyPluginAsync } from 'fastify';
import { SubmissionBodySchema } from '../api/schemas';
import { getPublicForm, recordView } from '../services/forms';
import { submit } from '../services/submissions';

type FormParams = { Params: { formId: string } };

export const publicRoutes: FastifyPluginAsync = async (app) => {
  // The published FormVersion the renderer consumes, plus the branding flag.
  app.get<FormParams>('/f/:formId', async (req) => getPublicForm(req.params.formId));

  // Analytics view ping (ROADMAP Phase 1), fired once per renderer load.
  // Always 204 — a stranger's page load must never see an analytics error.
  app.post<FormParams>(
    '/f/:formId/views',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (req, reply) => {
      await recordView(req.params.formId);
      return reply.status(204).send();
    },
  );

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
