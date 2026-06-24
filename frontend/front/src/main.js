import './assets/main.css'

import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'
import router from './router/router'

const app = createApp(App)
const pinia = createPinia()

setActivePinia(pinia)   
app.use(pinia)
app.use(router)
app.mount('#app')