import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
    { path: '/register', component: () => import('../views/RegisterView.vue'), meta: { public: true } },
    { path: '/', component: () => import('../views/DashboardView.vue') },
    { path: '/transactions', component: () => import('../views/TransactionsView.vue') },
    { path: '/import', component: () => import('../views/ImportView.vue') },
    { path: '/tags', component: () => import('../views/TagsView.vue') },
    { path: '/profile', component: () => import('../views/ProfileView.vue') },
    { path: '/tag-rules', component: () => import('../views/TagRulesView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  
  if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.public && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
