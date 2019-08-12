import Vue from 'vue'
import App from './App.vue'
import sync from 'vue-router-sync'
import { createRouter } from './router'
import { createStore } from './store'

module.exports = function createApp() {
  // 创建 router、store 实例
  const router = createRouter()
  const store = createStore()

  // 同步路由状态（route state）到 store
  sync(store, router)

  const app = new Vue({
    // 注入 router、store 到根 Vue 实例
    router,
    store,
    render: h => h(App)
  })
  // 返回 app、router、store
  return { app, router, store }
}