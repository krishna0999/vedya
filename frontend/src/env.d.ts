/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the Fastify API. Defaults to http://localhost:8787/api in dev.
  readonly VITE_API_BASE?: string;
  // Cloudflare Turnstile site key for the public submit bot check. Unset = off.
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

// The slice of Cloudflare's Turnstile global we use (loaded on public forms).
interface Window {
  turnstile?: {
    render(el: HTMLElement, opts: Record<string, unknown>): string;
    reset(widgetId?: string): void;
  };
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
