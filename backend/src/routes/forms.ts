// Owner-scoped form routes (CLAUDE.md §6). Framework-thin: parse at the boundary,
// resolve the authenticated owner, delegate to the forms service. The whole
// plugin is gated by requireAuth, so req.user is always present in a handler.
import type { FastifyPluginAsync } from 'fastify';
import { CreateFormSchema, DraftPatchSchema, FromTemplateSchema, GenerateFormSchema } from '../api/schemas';
import { getUserId, requireAuth } from '../auth/session';
import { generateForm } from '../services/ai';
import type { DraftPatch } from '../services/forms';
import {
  createForm, deleteForm, exportAccount, exportSubmissionsCsv, getAccountUsage,
  getForm, getFormStats, listForms, listSubmissions, publishForm, updateForm,
} from '../services/forms';
import { createFormFromTemplate } from '../services/templates';

type IdParams = { Params: { id: string } };

export const formRoutes: FastifyPluginAsync = async (app) => {
  // Every route in this plugin requires a signed-in owner.
  app.addHook('preHandler', requireAuth);

  app.post('/forms', async (req, reply) => {
    const { title } = CreateFormSchema.parse(req.body ?? {});
    const draft = await createForm(getUserId(req), title);
    return reply.status(201).send(draft);
  });

  app.post('/forms/from-template', async (req, reply) => {
    const { templateId } = FromTemplateSchema.parse(req.body ?? {});
    const draft = await createFormFromTemplate(getUserId(req), templateId);
    return reply.status(201).send(draft);
  });

  // AI form generation (ROADMAP Phase 1): NL prompt → persisted FormDraft.
  // Monthly quota lives in the service (limits.ts); this rate limit only guards
  // against hammering the upstream AI call.
  app.post(
    '/forms/generate',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { prompt } = GenerateFormSchema.parse(req.body ?? {});
      const draft = await generateForm(getUserId(req), req.user!.plan, prompt);
      return reply.status(201).send(draft);
    },
  );

  app.get('/forms', async (req) => listForms(getUserId(req)));

  app.get<IdParams>('/forms/:id', async (req) => getForm(getUserId(req), req.params.id));

  app.patch<IdParams>('/forms/:id', async (req) => {
    const patch = DraftPatchSchema.parse(req.body ?? {}) as DraftPatch;
    return updateForm(getUserId(req), req.params.id, patch);
  });

  app.post<IdParams>('/forms/:id/publish', async (req, reply) => {
    const version = await publishForm(getUserId(req), req.params.id);
    return reply.status(201).send(version);
  });

  app.delete<IdParams>('/forms/:id', async (req, reply) => {
    await deleteForm(getUserId(req), req.params.id);
    return reply.status(204).send();
  });

  app.get<IdParams>('/forms/:id/submissions', async (req) => listSubmissions(getUserId(req), req.params.id));

  // Basic analytics (ROADMAP Phase 1): views / submissions for one form.
  app.get<IdParams>('/forms/:id/stats', async (req) => getFormStats(getUserId(req), req.params.id));

  // Account-level analytics: totals, monthly quota consumption, 30-day timeline.
  app.get('/usage', async (req) => getAccountUsage(getUserId(req), req.user!.plan));

  // Full account data export ("own your data"): one JSON dump, browser-downloaded.
  app.get('/account/export', async (req, reply) => {
    const data = await exportAccount(getUserId(req));
    const date = new Date().toISOString().slice(0, 10);
    return reply
      .header('content-type', 'application/json; charset=utf-8')
      .header('content-disposition', `attachment; filename="vedya-export-${date}.json"`)
      .send(data);
  });

  app.get<IdParams>('/forms/:id/submissions.csv', async (req, reply) => {
    const csv = await exportSubmissionsCsv(getUserId(req), req.params.id);
    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="form-${req.params.id}-responses.csv"`)
      .send(csv);
  });
};
