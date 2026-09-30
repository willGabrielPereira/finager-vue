import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAdminAuthStore } from '../stores/adminAuth';
import { toast } from '../utils/feedback';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
    { path: '/register', component: () => import('../views/RegisterView.vue'), meta: { public: true } },
    { path: '/esqueci-senha', component: () => import('../views/ForgotPasswordView.vue'), meta: { public: true } },
    // "open": acessível autenticado ou não (link chega por e-mail, sessão pode estar aberta em outra aba)
    { path: '/redefinir-senha', component: () => import('../views/ResetPasswordView.vue'), meta: { open: true } },
    { path: '/convite', component: () => import('../views/AcceptInviteView.vue'), meta: { open: true } },
    { path: '/descadastrar', component: () => import('../views/UnsubscribeView.vue'), meta: { open: true } },
    { path: '/', component: () => import('../views/DashboardView.vue') },
    { path: '/transactions', component: () => import('../views/TransactionsView.vue') },
    { path: '/accounts', component: () => import('../views/AccountsView.vue') },
    { path: '/tags', component: () => import('../views/TagsView.vue') },
    { path: '/profile', component: () => import('../views/ProfileView.vue') },
    { path: '/billing', component: () => import('../views/BillingView.vue') },
    { path: '/tag-rules', component: () => import('../views/TagRulesView.vue') },
    { path: '/admin', component: () => import('../views/AdminDashboardView.vue'), meta: { roles: ['admin', 'moderator'], layout: 'admin' } },
    { path: '/admin/reauth', component: () => import('../views/AdminReauthView.vue'), meta: { roles: ['admin', 'moderator'], layout: 'admin' } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const adminAuthStore = useAdminAuthStore();

  // router.isReady() resolve a navegação inicial antes do app montar (main.ts), e fetchMe()
  // só roda no onMounted do AppLayout — sem isso, authStore.user ainda é null em qualquer
  // cold-load de uma rota com meta.roles (URL direta, F5), expulsando até um admin de verdade.
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchMe();
  }

  if (to.meta.open) {
    next();
  } else if (!to.meta.public && !authStore.isAuthenticated) {
    // Guarda o link original: após o login, o usuário volta para ele em vez de cair sempre no Dashboard
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else if (to.meta.public && authStore.isAuthenticated) {
    next('/');
  } else if (to.meta.roles && !(to.meta.roles as string[]).includes(authStore.user?.role ?? '')) {
    toast.error('Acesso restrito');
    next('/');
  } else if (to.meta.roles && to.path !== '/admin/reauth' && !adminAuthStore.isElevated()) {
    // Rota administrativa exige elevação recente (reauth). A própria tela de
    // reauth é isenta dessa checagem, senão ninguém conseguiria chegar nela.
    next({ path: '/admin/reauth', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;