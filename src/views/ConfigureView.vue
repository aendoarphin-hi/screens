<template>
  <div :id="`${$route.name}-view`" class="route-view__container">
    <!-- help modal -->
    <HelpModalComponent>
      <h5>Screen Configuration</h5>
      <p>Scan the network for available screens. You can then add them to the list of screens.
        Once the screen is added, it will be available for users to manage in the <b>Screens</b> tab.
      </p>
    </HelpModalComponent>

    <!--  header + toolbar  -->
    <div class="route-view__header">
      <!-- heading -->
      <div class="route-view__heading">
        <span>{{ $route.name }}</span>
        <span>
          <HelpCircleOutline data-bs-toggle="modal" data-bs-target="#help-modal" title="Help" class="cursor-pointer" />
        </span>
      </div>
      <!-- toolbar -->
      <div class="route-view__toolbar">
        <button :disabled="scanning" class="btn btn-sm btn-primary" @click="scanDevices">
          <span :class="{ 'animate-flash-infinite': scanning }">{{ scanning ? 'Scanning...' : 'Scan Network' }}</span>
        </button>
      </div>
    </div>

    <!-- main content -->
    <div class="d-flex flex-column gap-3 w-100">
      <h5>Available Devices ({{ availableDevices.length }})</h5>
      <div class="rounded overflow-hidden border">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light sticky-top shadow-sm" style="top: 0; z-index: 1;">
            <tr>
              <th :hidden="availableDevices.length === 0" v-for="(col, i) in [
                'IP',
                'MAC',
              ]" v-bind:key="i">
                {{ col }}
              </th>
              <th class="text-end" scope="col">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="availableDevices.length > 0">
              <tr v-for="(d, i) in sortedDevices" v-bind:key="i" @mouseover="hoverIndex = i"
                @mouseleave="hoverIndex = -1">
                <td>{{ d.ip }}</td>
                <td>
                  <div class="d-flex flex-row align-item">
                    <span>{{ d.mac }}</span>
                    <span
                      class="text-uppercase bg-success-subtle text-success-emphasis rounded-pill badge badge-sm ms-2">
                      <small v-if="screenExists(d.mac)">Added</small>
                    </span>
                  </div>
                </td>
                <td class="text-end">
                  <div :class="{ invisible: hoverIndex !== i }">
                    <button v-if="!screenExists(d.mac)" class="btn btn-sm btn-success cursor-pointer" @click="openAddScreenModal(d)">
                      + Add
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr style="height: 280px;">
                <td colspan="2" class="text-center p-3">
                  Scan the network for available devices.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

    </div>

    <AddDeviceModalComponent @added="scanDevices" ref="addDeviceModal" />
  </div>
</template>

<script>
import AddDeviceModalComponent from '@/components/modals/AddDeviceModalComponent.vue';
import { nextTick } from 'vue';
import HelpCircleOutline from 'vue-material-design-icons/HelpCircleOutline.vue'

export default {
  components: {
    HelpCircleOutline,
    AddDeviceModalComponent,
  },
  data() {
    return {
      initializing: false,
      scanning: false,
      hoverIndex: -1,
      availableDevices: [],
      screens: [],
    }
  },
  async mounted() {
    try {
      this.initializing = true;
      await this.$axios.get(this.$api + '?screens').then(res => {
        this.screens = res.data;
      })
      this.initializing = false;
    } catch (error) {
      console.log(error);
    }
  },
  computed: {
    sortedDevices() {
      return [...this.availableDevices].sort((a, b) => {
        const aParts = a.ip.split(".").map(Number);
        const bParts = b.ip.split(".").map(Number);

        for (let i = 0; i < 4; i++) {
          if (aParts[i] !== bParts[i]) {
            return aParts[i] - bParts[i];
          }
        }

        return 0;
      }).reverse();
    }
  },
  methods: {
    screenExists(mac) {
      return this.screens.some(s => s.mac_address === mac);
    },
    async scanDevices() {
      this.availableDevices = [];
      this.scanning = true;

      try {
        const [devicesRes, screensRes] = await Promise.all([
          this.$axios.get(this.$api + '?screens&networkdevices'),
          this.$axios.get(this.$api + '?screens')
        ]);

        this.availableDevices = devicesRes.data;
        this.screens = screensRes.data;
      } catch (error) {
        console.error(error);
      } finally {
        this.scanning = false;
      }
    },
    openAddScreenModal(device) {
      nextTick(() => {
        this.$refs.addDeviceModal.setDevice(device);

        this.$modal.show('add-device-modal');
      });
    },
  }
}
</script>

<style scoped></style>