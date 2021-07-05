import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import PrimeVue from 'primevue/config';
import 'primeflex/primeflex.css';
import 'primevue/resources/themes/saga-orange/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

createApp(App)
  .use(router)
  .use(PrimeVue)
  .mount('#app')
