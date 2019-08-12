import Vue from 'vue'
import { createApp } from './app.js'

const { app, router, store } = createApp()

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

// 当路由组件被复用，但 params 或 query 更改也要调用 'asyncData()'
Vue.mixin({
  beforeRouteUpdate(to, from, next) {
    const { asyncData } = this.$options
    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to
      }).then(next).catch(next)
    } else {
      next()
    }
  }
})

router.onReady(() => {
  // 添加路由钩子函数，用于处理 asyncData.
  // 在初始路由 resolve 后执行
  // 防止我们不会二次预取已有的数据
  // 使用 'router.beforeResolve()'，确保所有的异步组件都 resolve
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)

    // 我们只关心非预渲染的路由组件（通过单页跳转的路由）
    // 对比找出两个匹配列表的差异组件
    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })

    if (!activated.length) {
      return next()
    }

    // 这里有加载指示器就触发

    Promise.all(activated.map(c => {
      if (c.asyncData) {
        return c.asyncData({
          store,
          route: to
        })
      }
    })).then(() => {
      // 停止加载指示器

      next()
    }).catch(next)
  })

  app.$mount('#app')
})