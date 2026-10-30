// Error monitoring (Sentry). Imported first by index.ts so it initialises
// before Fastify loads. Off unless SENTRY_DSN is set; Sentry calls elsewhere are
// no-ops then. Only errors are sent — no performance tracing — and nothing that
// can carry personal data: request bodies (respondent answers), cookies,
// headers, query strings and user info are all switched off.
import * as Sentry from '@sentry/node';
import { env } from './config/env';

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: Boolean(env.SENTRY_DSN),
  environment: env.NODE_ENV,
  tracesSampleRate: 0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
  },
});
