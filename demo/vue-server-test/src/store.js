import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

function fetchData (id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 'qinyf',
        age: 24
      })
    }, 1000)
  })
}

export function createStore () {
  return new Vuex.Store({
    state: {
      item: {}
    },
    actions: {
      fetchItem ({ commit }, id) {
        // 'store.dispatch()'会返回 Promise
        // 以便我们知道数据在何时更新
        return fetchData(id).then(item => {
          commit('setItem', { id, item })
        })
      }
    },
    mutations: {
      setItem(state, { id, item }) {
        Vue.set(state.items, id, item)
      }
    }
  })
}