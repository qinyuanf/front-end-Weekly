import vue from 'vue'
import App from './App.vue'

module.exports = function createApp(context) {
  const app = new vue({
    render: h => h(App)
  })
  return { app }
}