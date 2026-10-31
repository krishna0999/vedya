// App routes. Owner surfaces (dashboard/builder/responses) require auth; /login
// and /signup are the entry; /f/:formId is the public renderer a stranger loads.
// Public and owner surfaces share the SPA but never share theme.
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('@/pages/LandingView.vue') },
    { path: '/dashboard', name: 'dashboard', component: () => import('@/pages/DashboardView.vue'), meta: { requiresAuth: true, title: 'Dashboard' } },
    { path: '/forms', name: 'forms', component: () => import('@/pages/FormsView.vue'), meta: { requiresAuth: true, title: 'Forms' } },
    { path: '/forms/:id/edit', name: 'builder', component: () => import('@/pages/BuilderView.vue'), meta: { requiresAuth: true, title: 'Edit form' } },
    { path: '/forms/:id/responses', name: 'responses', component: () => import('@/pages/ResponsesView.vue'), meta: { requiresAuth: true, title: 'Responses' } },
    { path: '/settings', name: 'settings', component: () => import('@/pages/SettingsView.vue'), meta: { requiresAuth: true, title: 'Settings' } },
    { path: '/account', name: 'account', component: () => import('@/pages/AccountView.vue'), meta: { requiresAuth: true, title: 'Account' } },
    { path: '/login', name: 'login', component: () => import('@/pages/AuthView.vue'), props: { mode: 'login' }, meta: { title: 'Log in', description: 'Log in to Vedya to build forms and see your responses.' } },
    { path: '/signup', name: 'signup', component: () => import('@/pages/AuthView.vue'), props: { mode: 'signup' }, meta: { title: 'Sign up', description: 'Create a free Vedya account. Build a form, share a link, and collect responses. No credit card needed.' } },
    // Emailed-link flows: reachable signed in or out.
    { path: '/forgot-password', name: 'forgot-password', component: () => import('@/pages/PasswordResetView.vue'), meta: { title: 'Reset password' } },
    { path: '/reset-password', name: 'reset-password', component: () => import('@/pages/PasswordResetView.vue'), meta: { title: 'Reset password' } },
    { path: '/verify-email', name: 'verify-email', component: () => import('@/pages/VerifyEmailView.vue'), meta: { title: 'Confirm email' } },
    { path: '/f/:formId', name: 'public-form', component: () => import('@/pages/PublicFormView.vue'), meta: { public: true } },
    // Public template gallery + pages (SEO). Prerendered as static HTML at build.
    { path: '/templates', name: 'templates', component: () => import('@/pages/TemplatesView.vue'), meta: { public: true, title: 'Free form templates', description: 'Free form templates for contact forms, RSVPs, job applications, surveys, registrations and more. Pick one, edit anything, share a link.' } },
    { path: '/templates/:slug', name: 'template', component: () => import('@/pages/TemplateView.vue'), meta: { public: true, title: 'Form template' } },
    { path: '/privacy', name: 'privacy', component: () => import('@/pages/PrivacyView.vue'), meta: { public: true, title: 'Privacy Policy', description: 'How Vedya collects, uses, and protects your data and the responses your forms collect.' } },
    { path: '/terms', name: 'terms', component: () => import('@/pages/TermsView.vue'), meta: { public: true, title: 'Terms of Service', description: 'The terms for using Vedya, the online form builder.' } },
    // Unknown paths fall back to the landing page (which redirects if logged in).
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

// Resolve the session once, then gate. Unauthed → login (remembering intent);
// authed users skip the landing/login/signup screens and land on the dashboard.
router.beforeEach(async (to) => {
  // Public pages (a stranger's form, the legal pages) never need the session:
  // don't make them wait on (or break with) /auth/me before they can load.
  if (to.meta.public) return true;
  const auth = useAuthStore();
  if (!auth.ready) await auth.init();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  const isPublicEntry = to.name === 'landing' || to.name === 'login' || to.name === 'signup';
  if (isPublicEntry && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }
  return true;
});

// Per-page <title>, description and canonical URL. Google renders the SPA, so
// these are what it indexes; the defaults live in index.html. The canonical is
// always vedya.app, whichever host (www, a Vercel preview) served the page.
// /f/:id overrides the title with the form's own once it loads.
const DEFAULT_TITLE = document.title;
const DEFAULT_DESCRIPTION =
  document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
router.afterEach((to) => {
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} | Vedya` : DEFAULT_TITLE;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', (to.meta.description as string | undefined) ?? DEFAULT_DESCRIPTION);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://vedya.app${to.path}`);
});

export default router;
