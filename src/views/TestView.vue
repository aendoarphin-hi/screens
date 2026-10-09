<template>
  <div>
    {{ JSON.stringify(store.authenticated) }}
  </div>
</template>
<script>
export default {
  inject: ['store'],
  data() {
    return {
      store: this.store
    }
  },
}
</script>
<style>
  
</style>