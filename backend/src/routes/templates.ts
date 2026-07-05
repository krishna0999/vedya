// Template catalog route (ROADMAP Phase 1). Read-only static content, so it needs
// no auth — the gallery is fetched by signed-in owners, but the data isn't
// owner-scoped. Instantiating a template into a real form lives on the authed
// owner routes (POST /forms/from-template in routes/forms.ts).
import type { FastifyPluginAsync } from 'fastify';
import { listTemplates } from '../services/templates';

export const templateRoutes: FastifyPluginAsync = async (app) => {
  app.get('/templates', async () => listTemplates());
};
