import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      { path: '/bar', component: () => import('./components/bar.vue') },
      { path: '/baz', component: () => import('./components/baz.vue') },
      { path: '/foo', component: () => import('./components/foo.vue') },
    ]
  })
}
