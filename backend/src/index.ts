// Process entrypoint: seed the dev owner, build the app, listen. `pnpm dev`.
import { buildApp } from './app';
import { env } from './config/env';
import { ensureDevOwner } from './services/dev-owner';

async function main(): Promise<void> {
  await ensureDevOwner();
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
