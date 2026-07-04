// App routes. The builder/dashboard/responses are product chrome; /f/:formId is
// the public renderer a stranger loads. Public and owner surfaces share the same
// SPA but never share theme (form theme is scoped inside FormRenderer).
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/pages/DashboardView.vue') },
    { path: '/forms/:id/edit', name: 'builder', component: () => import('@/pages/BuilderView.vue') },
    { path: '/forms/:id/responses', name: 'responses', component: () => import('@/pages/ResponsesView.vue') },
    { path: '/f/:formId', name: 'public-form', component: () => import('@/pages/PublicFormView.vue') },
    // Unknown paths fall back to the dashboard.
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

export default router;
