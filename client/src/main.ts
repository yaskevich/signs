import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import PrimeVue from 'primevue/config';
import 'primeflex/primeflex.css';
import 'primevue/resources/themes/saga-orange/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import ScrollTop from 'primevue/scrolltop';
import Paginator from 'primevue/paginator';

const app  = createApp(App);
app.component('ScrollTop', ScrollTop);
app.component('Dropdown', Dropdown);
app.component('InputText', InputText);
app.component('Button', Button);
app.component('Divider', Divider);
app.component('Paginator', Paginator);


app.use(router).use(PrimeVue).mount('#app')
