<template>
  <div>
    <p>这是 bar 组件</p>
    <p>{{ item.id }}</p>
  </div>
</template>
<script>
export default {
  name: 'bar',
  asyncData ({ store, route }) {
    // 触发 action 后，会返回 Promise
    return store.dispatch('fetchItem', route.params.id)
  },
  computed: {
    // 从 store 的 state 对象中获取 item
    item () {
      return this.$store.state.items
    }
  }
}
</script>
