import '@vueform/multiselect/themes/default.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import './assets/multiselect.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import './assets/swal.css';
import App from './App.vue';
import router from './router';
import { installGlobalErrorLogging, logError } from './utils/logger';

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  logError('vue', err, { component: instance?.$options.name, info });
};
installGlobalErrorLogging();

app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount('#app');
});
