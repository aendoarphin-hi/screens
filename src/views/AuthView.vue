<template>
  <div class="card border border-primary my-auto p-4" style="max-width: 500px;">
    <div class="d-flex flex-row justify-content-center">
      <img src="@/assets/img/hayden-blue.svg" width="90" alt="Hayden Logo" />&nbsp;&nbsp;
      <span class="fs-1 text-dark text-nowrap"><strong>HAYDEN</strong> <span class="text-primary">{{ $appname
          }}</span></span>
    </div><br />
    <h5 class="text-center">Authentication Required</h5>
    <br />
    <p class="text-center text-muted">
      This application requires an authenticated user.<br />
      Please sign in to continue.
    </p>
    <small v-if="error.length > 0" class="text-danger text-center">{{ error }}</small>
    <br />
    <div>
      <div class="mb-3 text-start gap-2">
        <label for="" class="form-label">Email or Employee #</label>
        <input type="text" class="form-control form-control-sm" name="username" id="username"
          v-model="credentials.username" />
        <label for="" class="form-label">Password</label>
        <input @keydown.enter="login" type="password" class="form-control form-control-sm" name="password" id="password"
          v-model="credentials.password" />
        <a id="forgotpassword" class="form-text text-body-secondary" href="https://haydint.com/ttprod/v3/?forgot">Forgot
          your password?</a>
        <button @click="login" type="button" class="btn btn-primary btn-sm d-block w-100 mt-3">Sign In</button>
        <button v-if="loading" type="button" disabled
          class="d-flex align-items-center gap-2 justify-content-center btn btn-primary btn-sm d-block w-100 mt-3">
          Signing In <span class="spinner-border spinner-border-sm"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import OpenInNew from 'vue-material-design-icons/OpenInNew.vue'

export default {
  inject: ['store'],
  components: {
    OpenInNew
  },
  data() {
    return {
      authStatus: null,
      credentials: {
        username: '',
        password: ''
      },
      loading: false,
      error: ''
    }
  },
  mounted() {
    this.authStatus = this.store.authenticated
  },
  methods: {
    async login() {
      this.loading = true
      try {
        const { success, message } = (await this.$axios.post(this.$api + '?login', this.credentials)).data;
        if (success) {
          this.$router.push('/dashboard')
        } else {
          this.error = message
        }
      } catch (e) {
        console.log(e);
      }
      this.loading = false
    }
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