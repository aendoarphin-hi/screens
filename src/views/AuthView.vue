<template>
  <div class="card border border-primary my-auto p-4" style="max-width: 500px;">
    <div class="d-flex flex-row justify-content-center">
      <img src="@/assets/img/hayden-blue.svg" width="90" alt="Hayden Logo" />&nbsp;&nbsp;
      <span class="fs-1 text-dark text-nowrap"><strong>HAYDEN</strong> {{ $appname }}</span>
    </div><br />
    <h5 class="text-center">Authentication Required</h5>
    <Lock class="text-body-tertiary" style="font-size: 100px;" />
    <br />
    <p class="text-center text-muted">
      This application requires an authenticated user.<br />
      Please sign in to continue.
    </p>
    <div class="text-center">
      <a class="btn btn-primary" :href="$webroot" target="_blank">
        Sign In&nbsp;&nbsp;
        <OpenInNew />
      </a>
    </div>
  </div>
</template>

<script>
import Lock from 'vue-material-design-icons/Lock.vue'
import OpenInNew from 'vue-material-design-icons/OpenInNew.vue'

export default {
  inject: ['store'],
  components: {
    Lock,
    OpenInNew
  },
  data() {
    return {
      authStatus: null
    }
  },
  mounted() {
    this.authStatus = this.store.authenticated
  },
  watch: { // if user's already authenticated, force redirect to dashboard
    authStatus: {
      immediate: true,
      handler() {
        if (this.authStatus) {
          this.$router.push('/dashboard')
        }
      }
    }
  },
}
</script>