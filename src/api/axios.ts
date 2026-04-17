import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import router from '../router';

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

api.interceptors.request.use(config => {
  const authStore = useAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  return response;
}, async error => {
  const originalRequest = error.config;
  
  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = 'Bearer ' + token;
        return api(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const authStore = useAuthStore();
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
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(error);
});
