import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
// Self-hosted Inter (the font the tokens name), so the UI and forms using the
// "Inter" theme look the same on every OS instead of falling back to the system
// font. Each weight ships per-subset files with unicode-range: browsers fetch
// only the scripts a page uses. Self-hosting keeps the CSP's font-src 'self'.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles/tokens.css';
import './style.css';

const app = createApp(App).use(createPinia()).use(router);
app.mount('#app');

// Error monitoring (Sentry), only when a DSN is configured, and loaded lazily
// so it stays out of the main bundle. Errors only — no performance tracing, no
// session replay — and nothing that can carry personal data (form answers,
// cookies, headers, query strings, user info).
// ponytail: errors thrown before this resolves (first few ms) aren't reported.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  void import('@sentry/vue').then((Sentry) =>
    Sentry.init({
      app,
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
      },
    }),
  );
}
