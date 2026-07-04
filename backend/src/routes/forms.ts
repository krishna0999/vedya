// Owner-scoped form routes (CLAUDE.md §6). Framework-thin: parse at the boundary,
// resolve the authenticated owner, delegate to the forms service. The whole
// plugin is gated by requireAuth, so req.user is always present in a handler.
import type { FastifyPluginAsync } from 'fastify';
import { CreateFormSchema, DraftPatchSchema } from '../api/schemas';
import { getUserId, requireAuth } from '../auth/session';
import type { DraftPatch } from '../services/forms';
import {
  createForm, deleteForm, exportSubmissionsCsv, getForm, listForms,
  listSubmissions, publishForm, updateForm,
} from '../services/forms';

type IdParams = { Params: { id: string } };

export const formRoutes: FastifyPluginAsync = async (app) => {
  // Every route in this plugin requires a signed-in owner.
  app.addHook('preHandler', requireAuth);

  app.post('/forms', async (req, reply) => {
    const { title } = CreateFormSchema.parse(req.body ?? {});
    const draft = await createForm(getUserId(req), title);
    return reply.status(201).send(draft);
  });

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

  app.get<IdParams>('/forms/:id/submissions.csv', async (req, reply) => {
    const csv = await exportSubmissionsCsv(getUserId(req), req.params.id);
    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="form-${req.params.id}-responses.csv"`)
      .send(csv);
  });
};
