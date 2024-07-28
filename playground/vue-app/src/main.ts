import { createApp } from 'vue'
import { router } from './router.ts'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import 'uno.css'

createApp(App).use(router).mount('#app')
