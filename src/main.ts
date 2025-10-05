import { createApp } from 'vue';

import AppRoot from './app/AppRoot.vue';
import { router } from './app/router';
import { registerAppProviders } from './app/providers';
import './style.css';

const app = createApp(AppRoot);
registerAppProviders(app);
app.use(router);
app.mount('#app');
