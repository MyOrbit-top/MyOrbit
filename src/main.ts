import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'
import ClickOutside from 'vue-click-outside'

const app = createApp(App)
app.directive('click-outside', ClickOutside)
app.mount('#app')

