<template>
  <!-- main content -->
  <div class="d-flex flex-row bg-light" style="height: 100vh; overflow: auto;" :class="border ? 'borderized' : ''">
    <SidebarComponent v-if="$route.name !== 'Slideshow'" />
    <router-view v-if="$route.name === 'Slideshow'" id="router-view" class="container">
      <SlideshowComponent />
    </router-view>
    <router-view v-else id="router-view" class="container" v-slot="{ Component }">
      <transition enter-active-class="animate__animated animate__fadeIn animate__faster"
        leave-active-class="animate__animated animate__fadeOut animate__faster" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </transition>
    </router-view>
  </div>
  <ToastComponent ref="toast" />
</template>

<script>
import SidebarComponent from "@/components/SidebarComponent.vue";
import AuthView from "@/views/AuthView.vue";
import ToastComponent from "@/components/ToastComponent.vue";
import SlideshowComponent from "@/components/SlideshowComponent.vue";
import { store } from "@/common/store";

export default {
  components: {
    SlideshowComponent,
    SidebarComponent,
    AuthView,
    ToastComponent,
  },
  provide() {
    return {
      toast: {
        show: (title, message, classList) => {
          this.$refs.toast.showToast(title, message, classList);
        }
      },
      store: store
    };
  },
  data() {
    return {
      border: false,
      loading: false,
    };
  },
  async mounted() {
    this.loading = true
    try {
      // do stuff
    } catch (error) {
      if (error.response.status === 401) {
        this.$router.push({ name: "Auth" });
      }
    }
    this.loading = false
  },
};
</script>

<style>
</style>
