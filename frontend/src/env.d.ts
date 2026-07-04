/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the Fastify API. Defaults to http://localhost:8787/api in dev.
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
