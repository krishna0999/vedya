// App routes. Owner surfaces (dashboard/builder/responses) require auth; /login
// and /signup are the entry; /f/:formId is the public renderer a stranger loads.
// Public and owner surfaces share the SPA but never share theme.
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('@/pages/LandingView.vue') },
    { path: '/dashboard', name: 'dashboard', component: () => import('@/pages/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/forms', name: 'forms', component: () => import('@/pages/FormsView.vue'), meta: { requiresAuth: true } },
    { path: '/forms/:id/edit', name: 'builder', component: () => import('@/pages/BuilderView.vue'), meta: { requiresAuth: true } },
    { path: '/forms/:id/responses', name: 'responses', component: () => import('@/pages/ResponsesView.vue'), meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: () => import('@/pages/SettingsView.vue'), meta: { requiresAuth: true } },
    { path: '/account', name: 'account', component: () => import('@/pages/AccountView.vue'), meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: () => import('@/pages/AuthView.vue'), props: { mode: 'login' } },
    { path: '/signup', name: 'signup', component: () => import('@/pages/AuthView.vue'), props: { mode: 'signup' } },
    { path: '/f/:formId', name: 'public-form', component: () => import('@/pages/PublicFormView.vue') },
    // Unknown paths fall back to the landing page (which redirects if logged in).
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

// Resolve the session once, then gate. Unauthed → login (remembering intent);
// authed users skip the landing/login/signup screens and land on the dashboard.
router.beforeEach(async (to) => {
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

export default router;
