<template>
  <!-- modal -->
  <div class="modal fade" id="add-device-modal" ref="addDeviceModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
      <div class="modal-content shadow">

        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <strong class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis">
              Add Screen
            </strong>
          </div>
        </div>

        <div class="modal-body">
          <transition enter-active-class="animate__animated animate__fadeIn animate__faster">
            <!-- error message -->
            <div v-if="error.length > 0" class="mb-2 p-2 small rounded bg-danger-subtle text-danger-emphasis">
              {{ error }}
            </div>
          </transition>
          <p class="lh-sm small">Add details to the new screen. Once added, the screen will be visible and available for
            users to manage.</p>
          <div class="vstack gap-2">
            <input v-model="screen.title" type="text" class="form-control form-control-sm" placeholder="Screen Name">
            <select v-model="screen.location_id" class="form-select form-select-sm">
              <option :value="null">Select Location</option>
              <option v-for="l in locations" :key="l.name + '-' + l.id" :value="l.id">
                {{ l.name }}
              </option>
            </select>
            <select v-model="screen.status" class="form-select form-select-sm">
              <option :value="null">Select Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="disabled">Disabled</option>
            </select>
            <div class="hstack gap-2">
              <input disabled type="text" class="form-control form-control-sm" :value="screen.ip_address"
                style="width: 50%">
              <input disabled type="text" class="form-control form-control-sm" :value="screen.mac_address"
                style="width: 50%">
            </div>
          </div>
        </div>

        <div class="modal-footer p-2">
          <button @click="clearChanges" type="button" class="btn btn-sm btn-danger me-2" data-bs-dismiss="modal"
            title="Cancel">
            Cancel
          </button>

          <button :disabled="isSubmitDisabled" @click="submit" type="button" class="btn btn-sm btn-success"
            title="Add Screen">
            + Add
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { clearModalFocus } from '@/common/helpers';

export default {
  inject: ['toast'],
  emits: ['added'],
  data() {
    return {
      locations: [],
      screen: {
        title: null,
        location_id: null,
        status: null,
        mac_address: null,
        ip_address: null
      },
      error: ''
    }
  },
  methods: {
    setDevice(device) {
      this.clearChanges();

      this.screen.mac_address = device?.mac ?? null;
      this.screen.ip_address = device?.ip ?? null;
    },
    async submit() {
      try {
        this.error = '';
        // if (!window.confirm('Are you sure you want to add this screen?\n\n' + JSON.stringify(this.screen, null, 2))) return;
        const res = await this.$axios.post(this.$api + 'screens?new', this.screen);
        // warn that screen already exists
        if (res.data.success === false && res.data.code === 200) {
          this.error = res.data.message
        } else {
          this.$modal.hide('add-device-modal');
          this.toast.show("Screen Added", "The screen has been added.", "bg-success-subtle text-success-emphasis");
          this.clearChanges();
          this.$emit('added');
        }
      } catch (e) {
        this.error = e
        console.error(e);
      }
    },
    clearChanges() {
      this.screen = {
        title: null,
        location_id: null,
        status: null,
        mac_address: null,
        ip_address: null
      }
      this.error = '';
    }
  },
  computed: {
    isSubmitDisabled() {
      return !this.screen.title ||
        !this.screen.location_id ||
        !this.screen.status ||
        !this.screen.mac_address ||
        !this.screen.ip_address
    }
  },
  async mounted() {
    clearModalFocus(this.$refs.addDeviceModal);
    this.locations = (await this.$axios.get(this.$api + 'locations?all')).data
  },
}
</script>