import { createApp } from 'vue';
import { createHead } from '@unhead/vue'
import App from './App.vue';
// import './registerServiceWorker'
import router from './router';
import JsonViewer from 'vue-json-viewer';

createApp(App).use(createHead()).use(router).use(JsonViewer).mount('#app');
