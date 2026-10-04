<template>
  <div v-if="userdata" class="d-flex justify-content-center align-items-center">
    <div class="card shadow-sm p-4" style="width: 600px; max-width: 90vw;">

      <!-- heading -->
      <div class="text-center mb-4">
        <AccountCircle class="text-secondary" style="font-size: 90px;" />
        <h3 class="mt-2 mb-0">{{ userdata.name }}</h3>
        <p class="text-muted mb-0">{{ userdata.position || '' }}</p>
      </div>

      <hr />

      <!-- Information -->
      <div class="row g-3">
        <div class="col-6">
          <small class="text-muted">Employee Number</small>
          <div class="fw-semibold">{{ userdata.number }}</div>
        </div>

        <div class="col-6">
          <small class="text-muted">Email</small>
          <div class="fw-semibold">{{ userdata.email }}</div>
        </div>

        <div class="col-6">
          <small class="text-muted">Phone</small>
          <div class="fw-semibold">{{ userdata.phone || 'N/A' }}</div>
        </div>

        <div class="col-6">
          <small class="text-muted">Location</small>
          <div class="fw-semibold">{{ userdata.location || 'N/A' }}</div>
        </div>

        <div class="col-6">
          <small class="text-muted">Group</small>
          <div v-for="group in userdata.groups" :key="group" class="fw-semibold"><template
              v-if="group.includes('HR Comms')">{{ group.split('HR Comms')[1] }}</template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="d-flex justify-content-center align-items-center">
    <LoadingComponent message="Loading profile..." />
  </div>
</template>

<script>
import AccountCircle from 'vue-material-design-icons/AccountCircle.vue';

export default {
  name: 'ProfileView',
  components: {
    AccountCircle
  },
  data() {
    return {
      userdata: null,
    };
  },
  async mounted() {
    try {
      const res = await this.$axios.get(this.$api + '?auth');

      res.data.groups = Object.values(res.data.groups ?? {});

      this.userdata = res.data;
    } catch (error) {
      console.log(error);
    }
  }
};
</script>