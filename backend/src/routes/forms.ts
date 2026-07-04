// Owner-scoped form routes (CLAUDE.md §6). Framework-thin: parse at the boundary,
// resolve the owner, delegate to the forms service. Owner is the dev stub until
// Lucia lands (step 5) — see requireOwner.
import type { FastifyPluginAsync } from 'fastify';
import { CreateFormSchema, DraftPatchSchema } from '../api/schemas';
import { requireOwner } from '../services/dev-owner';
import type { DraftPatch } from '../services/forms';
import {
  createForm, deleteForm, exportSubmissionsCsv, getForm, listForms,
  listSubmissions, publishForm, updateForm,
} from '../services/forms';

type IdParams = { Params: { id: string } };

export const formRoutes: FastifyPluginAsync = async (app) => {
  app.post('/forms', async (req, reply) => {
    const { title } = CreateFormSchema.parse(req.body ?? {});
    const draft = await createForm(requireOwner(), title);
    return reply.status(201).send(draft);
  });

  app.get('/forms', async () => listForms(requireOwner()));

  app.get<IdParams>('/forms/:id', async (req) => getForm(requireOwner(), req.params.id));

  app.patch<IdParams>('/forms/:id', async (req) => {
    const patch = DraftPatchSchema.parse(req.body ?? {}) as DraftPatch;
    return updateForm(requireOwner(), req.params.id, patch);
  });

  app.post<IdParams>('/forms/:id/publish', async (req, reply) => {
    const version = await publishForm(requireOwner(), req.params.id);
    return reply.status(201).send(version);
  });

  app.delete<IdParams>('/forms/:id', async (req, reply) => {
    await deleteForm(requireOwner(), req.params.id);
    return reply.status(204).send();
  });

  app.get<IdParams>('/forms/:id/submissions', async (req) => listSubmissions(requireOwner(), req.params.id));

  app.get<IdParams>('/forms/:id/submissions.csv', async (req, reply) => {
    const csv = await exportSubmissionsCsv(requireOwner(), req.params.id);
    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="form-${req.params.id}-responses.csv"`)
      .send(csv);
  });
};
