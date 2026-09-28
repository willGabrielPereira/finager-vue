import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useAdminAuthStore } from '../stores/adminAuth';
import router from '../router';
import { logError } from '../utils/logger';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Ponto único de log para toda falha de API que chega ao chamador (não loga 401 que
// será reautenticado e reenviado com sucesso). Inclui o X-Request-ID que o backend já
// gera em toda resposta, para achar a mesma requisição no log do backend.
const logApiError = (error: any) => {
  logError('api', error, {
    method: error.config?.method,
    url: error.config?.url,
    status: error.response?.status,
    requestId: error.response?.headers?.['x-request-id'],
  });
};

api.interceptors.request.use(config => {
  const authStore = useAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }

  // Rotas /admin/* exigem elevação extra: se houver token elevado, anexa no header
  // dedicado (não substitui o Authorization normal, que já foi setado acima).
  if (config.url?.startsWith('/admin')) {
    const adminAuthStore = useAdminAuthStore();
    if (adminAuthStore.elevatedToken) {
      config.headers['X-Admin-Elevation'] = adminAuthStore.elevatedToken;
    }
  }

  return config;
}, error => {
  logApiError(error);
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  return response;
}, async error => {
  const originalRequest = error.config;

  // Elevação de admin ausente ou expirada: limpa o estado elevado e manda o usuário
  // reautenticar antes de voltar para a rota que ele tentava acessar. Condição
  // mutuamente exclusiva com o bloco de 401/refresh abaixo (status diferente).
  if (error.response?.status === 403 && error.response?.data?.error?.code === 'E_ELEVATION_REQUIRED') {
    const adminAuthStore = useAdminAuthStore();
    adminAuthStore.clear();
    // Evita redirect=/admin/reauth?redirect=... aninhado se chamadas paralelas
    // falharem enquanto já se está na própria tela de reauth.
    if (router.currentRoute.value.path !== '/admin/reauth') {
      const currentPath = router.currentRoute.value.fullPath;
      router.push({ path: '/admin/reauth', query: { redirect: currentPath } });
    }
    logApiError(error);
    return Promise.reject(error);
  }

  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = 'Bearer ' + token;
        return api(originalRequest);
      }).catch(err => {
        logApiError(err);
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const authStore = useAuthStore();
    if (!authStore.refreshToken) {
      isRefreshing = false;
      authStore.logout();
      router.push('/login');
      logApiError(error);
      return Promise.reject(error);
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/auth/refresh`, {
        refresh_token: authStore.refreshToken
      });

      const { access_token, refresh_token } = response.data;
      authStore.setTokens(access_token, refresh_token);

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      processQueue(null, access_token);
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      authStore.logout();
      router.push('/login');
      logApiError(err);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
  logApiError(error);
  return Promise.reject(error);
});
