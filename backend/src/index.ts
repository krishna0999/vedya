// Process entrypoint: build the app and listen. `pnpm dev`.
import './instrument'; // first: error monitoring must initialise before the app loads
import * as Sentry from '@sentry/node';
import { buildApp } from './app';
import { env } from './config/env';

async function main(): Promise<void> {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

main().catch(async (err) => {
  console.error(err);
  Sentry.captureException(err);
  await Sentry.flush(2000); // send the crash report before the process exits
  process.exit(1);
});
