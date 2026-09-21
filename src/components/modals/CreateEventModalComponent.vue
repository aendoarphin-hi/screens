<template>
  <!-- modal -->
  <div class="modal fade" id="create-event-modal" ref="createEventModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
      <div class="modal-content shadow">
        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <strong class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis">
              New Event
            </strong>
          </div>
        </div>
        <!-- help description -->
        <div class="modal-body">
          <transition enter-active-class="animate__animated animate__fadeIn animate__faster">
            <!-- error message -->
            <div v-if="error.length > 0" class="mb-2 p-2 small rounded bg-danger-subtle text-danger-emphasis">
              {{ error }}
            </div>
          </transition>
          <p class="small text-muted">
            Create a scheduled event by filling in the details below.
          </p>
          <!-- event creation fields -->
          <!-- title text -->
          <div class="w-100">
            <input type="text" class="form-control form-control-sm mb-2" placeholder="Event Title"
              id="event-create-title" v-model="newEvent.title" />
          </div>

          <!-- type + subtype dropdown-->
          <div class="mb-2 d-flex flex-row gap-2 w-100">
            <select id="event-create-type" class="form-select form-select-sm text-capitalize" v-model="newEvent.type">
              <option value="">Select Type</option>
              <option class="text-capitalize" v-for="t in types" :key="t" :value="t">
                {{ t }}
              </option>
            </select>

            <select id="event-create-subtype" :disabled="this.newEvent.type.length === 0"
              class="form-select form-select-sm text-capitalize" v-model="newEvent.subtype">
              <option value="">Select Subtype</option>
              <option class="text-capitalize" v-for="st in subtypes" :key="st" :value="st">
                {{ st }}
              </option>
            </select>
          </div>
          <label for="event-create-employee" class="small">Employee events can be tied to a specific employee</label>
          <!-- employee selection if type is employee -->
          <div class="mb-2">
            <select :disabled="newEvent.type !== 'employee'" id="event-create-employee"
              class="form-select form-select-sm" v-model="newEvent.employee_num">
              <option :value="null">Select Employee</option>
              <option v-for="employee in employees.sort((a, b) => a.name.localeCompare(b.name))" :key="employee.number"
                :value="employee.number">
                {{ employee.name }}
              </option>
            </select>
          </div>

          <!-- description text -->
          <div class="mb-2">
            <textarea id="event-create-description" class="form-control form-control-sm"
              style="min-height: 100px; resize: none;" v-model="newEvent.description"
              placeholder="What is this event about? (optional)"></textarea>
          </div>
          <!-- help description -->
          <p class="small text-muted lh-sm mb-0">
            The start and end date/time of the event will determine how long the content will be visible.
          </p>
          <!-- date range -->
          <div class="mb-2 d-flex flex-row gap-2 w-100">
            <div class="col">
              <label for="event-create-start-date" class="small">Start</label>
              <input type="datetime-local" step="1" class="text-uppercase form-control form-control-sm"
                id="event-create-start-date" v-model="newEvent.start" />
            </div>
            <div class="col">
              <label for="event-create-end-date" class="small">End</label>
              <input type="datetime-local" step="1" :disabled="newEvent.allDay"
                class="text-uppercase form-control form-control-sm" id="event-create-end-date" v-model="newEvent.end" />
            </div>
          </div>

          <!-- locations dropdown -->
          <select id="event-create-location" :disabled="newEvent.companyWide" class="form-select form-select-sm mb-2"
            v-model="newEvent.location_id">
            <option :value="null">Select Location</option>
            <option v-for="location in locations" :key="location.name + '-' + location.id" :value="location.id">
              {{ location.name }}
            </option>
          </select>

          <!-- event flags -->
          <span class="hstack gap-2 align-items-center mb-1" :disabled="newEvent.companyWide">
            <label for="event-create-all-day" class="small text-nowrap">One-day Event</label>
            <input type="checkbox" class="form-check-input my-0" id="event-create-all-day" v-model="newEvent.allDay">
            <label for="event-create-company-wide" class="small text-nowrap">All Locations</label>
            <input type="checkbox" class="form-check-input my-0" id="event-create-company-wide"
              v-model="newEvent.companyWide">
          </span>

          <!-- existing content selection -->
          <div>
            <label for="event-create-content" class="small">Content</label>
            <select id="event-create-content" class="form-select form-select-sm" v-model="newEvent.content_id">
              <option :value="null">No Content</option>
              <option v-for="c in sortedContent" :key="c.id" :value="parseInt(c.id)">
                {{ c.filename }}
              </option>
            </select>
            <small class="text-muted d-block">Select existing content to display during this event. (optional)</small>
          </div>
        </div>

        <div class="modal-footer p-2">
          <button type="reset" class="btn btn-sm btn-danger me-2" data-bs-dismiss="modal" @click="clearChanges"
            title="Cancel">
            Cancel
          </button>

          <button type="button" :disabled="!canSave" :class="{ disabled: !canSave}" @click="createEvent" class="btn btn-sm btn-success"
            title="Create Event">
            + Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { eventTypes } from "@/common/constants";
import { clearModalFocus } from "@/common/helpers";

export default {
  components: {

  },

  props: {
    range: Object
  },

  inject: ["toast", "store"],

  data() {
    return {
      newEvent: {
        title: "",
        type: "",
        subtype: "",
        start: "",
        end: "",
        description: "", // optional
        location_id: null, // optional
        employee_num: null, // optional
        content_id: null, // optional
        companyWide: false // optional
      },
      locations: [],
      employees: [],
      content: [],
      error: ""
    };
  },
  async mounted() {
    try {
      // in dashboard, user can make announcement event so prefill the type
      if (this.$route.name === "Dashboard") this.newEvent.type = "announcement";

      this.$refs.createEventModal.addEventListener("hidden.bs.modal", () => {
      });

      clearModalFocus(this.$refs.createEventModal);

      this.locations = (await this.$axios.get(this.$api + "locations?all")).data;
      this.employees = (await this.$axios.get(this.$api + "employees?all")).data;
      this.content = (await this.$axios.get(this.$api + "content?all")).data;
    } catch (error) {
      console.log(error);
    }
  },

  emits: ["created"],

  computed: {
    types() {
      return Object.keys(eventTypes);
    },
    subtypes() {
      return eventTypes[this.newEvent.type] ?? [];
    },
    sortedContent() {
      return [...this.content].sort((a, b) => {
        if (a.filename === b.filename) return 0;
        return a.filename < b.filename ? -1 : 1
      })
    },
    canSave() {
      const requiredFieldsFilled =
        this.newEvent.title.trim() &&
        this.newEvent.type &&
        this.newEvent.subtype &&
        this.newEvent.start;

      const employeeValid =
        this.newEvent.type !== "employee" ||
        this.newEvent.employee_num !== null;

      return Boolean(requiredFieldsFilled && employeeValid);
    },
  },

  methods: {
    clearChanges() {
      this.newEvent = {
        title: "",
        type: "",
        subtype: "",
        start: "",
        end: "",
        description: "", // optional
        location_id: null, // optional
        employee_num: null, // optional
        content_id: null, // optional
        companyWide: false // optional
      };
      this.error = ""
    },
    async createEvent() {
      try {
        // is it one-day (allDay)?
        if (this.newEvent.allDay) {
          this.newEvent.start = this.newEvent.start.split('T')[0] + 'T00:00:00';
          // increment end date to next day (from start) and set time to 00:00:00
          const nextDay = new Date(this.newEvent.start).setDate(new Date(this.newEvent.start).getDate() + 1);
          const parsedNextDay = new Date(nextDay).toISOString().split('T')[0] + 'T00:00:00';
          this.newEvent.end = parsedNextDay;
        }
        // is it company-wide?
        if (this.newEvent.companyWide && this.newEvent.location_id) this.newEvent.location_id = null;
        // parse non null string int IDs to int, otherwise default to null for db
        this.newEvent.location_id = this.newEvent.location_id ? parseInt(this.newEvent.location_id) : null;
        this.newEvent.employee_num = this.newEvent.employee_num ? parseInt(this.newEvent.employee_num) : null;
        this.newEvent.content_id = this.newEvent.content_id ? parseInt(this.newEvent.content_id) : null;
        // if (!window.confirm("Do you want to create this event?\n\n" + JSON.stringify({ ...this.newEvent }, null, 2))) return;
        // post
        await this.$axios.post(this.$api + "events?new", this.newEvent);
        // log activity
        await this.$axios.post(this.$api + "activity?new", {
          enum: parseInt(this.store.authenticated.number),
          action: "create",
          entity_type: "event",
          entity_json: JSON.stringify(this.newEvent)
        })
        this.clearChanges();
        this.$modal.hide("create-event-modal");
        this.$emit("created")
        this.toast.show("Event Created", "The event has been successfully created.", "bg-success-subtle text-success-emphasis");
        // update the null entity_id value in the new activity log
        const latestEvent = (await this.$axios.get(this.$api + "events?all")).data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].id;
        const latestActivity = (await this.$axios.get(this.$api + "activity?all")).data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].id;
        await this.$axios.post(this.$api + "activity?update", {
          column: "entity_id",
          value: latestEvent,
          id: latestActivity,
        })
      } catch (error) {
        this.error = "Error creating event: " + error;
        console.error(error);
      }
    },
    formatDateTimeLocal(value) {
      if (!value) return "";
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    validateDates() {
      this.newEvent.allDay = false;

      // user picked one day
      if (!this.newEvent.end && this.newEvent.start) {
        this.newEvent.end = "";
        this.newEvent.allDay = true;
      }
      // user picked multiple days
      if (!this.newEvent.start || !this.newEvent.end) {
        this.error = "";
        return;
      }

      const start = new Date(this.newEvent.start);
      const end = new Date(this.newEvent.end);
      // user picked start date after end date
      if (start > end) {
        this.error = "Start date must be before end date.";
        return;
      }
      // user picked the same date and time for start and end
      if (start.getTime() === end.getTime()) {
        this.error = "Start date and end date must be different.";
        return;
      }
      // user picked dates on the same day but with different times → timed event, not all-day
      if (start.toDateString() === end.toDateString()) {
        this.newEvent.allDay = false;
      }

      this.error = "";
    }
  },
  watch: {
    'newEvent.type': {
      handler(newVal) {
        this.newEvent.subtype = newVal === "employee" ? this.subtypes[0] : "";
        if (newVal === "employee") this.newEvent.employee_num = null
      },
    },
    'newEvent.start': {
      handler(newValue) {
        this.validateDates(newValue);
      },
    },
    'newEvent.end': {
      handler(newValue) {
        this.validateDates(newValue);
      },
    },
    'newEvent.companyWide': {
      handler(newValue) {
        if (newValue === true) {
          this.newEvent.location_id = null;
        } else {
          this.newEvent.location_id = this.locations[0].id;
        }
      },
    },
    range: {
      handler(newValue) {
        const start = new Date(newValue.start);
        const end = new Date(newValue.end);

        const diffMs = end.getTime() - start.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        // update the dates based on the picked range:
        // multi-day > both dates; same-day with different times > timed event
        // (both dates, allDay stays false); otherwise single day > all-day.
        if (diffMs > oneDayMs) {
          this.newEvent.start = this.formatDateTimeLocal(newValue.start);
          this.newEvent.end = this.formatDateTimeLocal(newValue.end);
        } else if (start.toDateString() === end.toDateString() && start.getTime() !== end.getTime()) {
          this.newEvent.start = this.formatDateTimeLocal(newValue.start);
          this.newEvent.end = this.formatDateTimeLocal(newValue.end);
        } else {
          this.newEvent.start = this.formatDateTimeLocal(newValue.start);
        }
      },
    },
  },
};
</script>

<style scoped></style>