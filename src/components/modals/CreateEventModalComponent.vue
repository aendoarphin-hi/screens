<template>
  <!-- modal -->
  <div class="modal px-3 fade" id="create-event-modal" ref="createEventModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: max-content;">
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
          <div class="d-flex flex-column flex-md-row gap-3">
            <div class="w-100">
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
                <select id="event-create-type" class="form-select form-select-sm text-capitalize"
                  v-model="newEvent.type">
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
              <label for="event-create-employee" class="small">Employee events can be tied to a specific
                employee</label>
              <!-- employee selection if type is employee -->
              <div class="mb-2">
                <select :disabled="newEvent.type !== 'employee'" id="event-create-employee"
                  class="form-select form-select-sm" v-model="newEvent.employee_num">
                  <option :value="null">Select Employee</option>
                  <option v-for="employee in employees.sort((a, b) => a.name.localeCompare(b.name))"
                    :key="employee.number" :value="employee.number">
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
              <div class="mb-2 d-flex flex-wrap w-100">
                <div class="col">
                  <label for="event-create-start-date" class="small">Start</label>
                  <input type="datetime-local" step="1" class="text-uppercase form-control form-control-sm"
                    id="event-create-start-date" v-model="newEvent.start" />
                </div>
                <div class="col">
                  <label for="event-create-end-date" class="small">End</label>
                  <input type="datetime-local" step="1" :disabled="newEvent.allDay"
                    class="text-uppercase form-control form-control-sm" id="event-create-end-date"
                    v-model="newEvent.end" />
                </div>
              </div>

              <!-- locations dropdown -->
              <select id="event-create-location" :disabled="newEvent.companyWide"
                class="form-select form-select-sm mb-2" v-model="newEvent.location_id">
                <option :value="null">Select Location</option>
                <option v-for="location in locations" :key="location.name + '-' + location.id" :value="location.id">
                  {{ location.name }}
                </option>
              </select>

              <!-- event flags -->
              <span class="hstack gap-2 align-items-center mb-1" :disabled="newEvent.companyWide">
                <label for="event-create-all-day" class="small text-nowrap">One-day Event</label>
                <input type="checkbox" class="form-check-input my-0" id="event-create-all-day"
                  v-model="newEvent.allDay">
                <label for="event-create-company-wide" class="small text-nowrap">All Locations</label>
                <input type="checkbox" class="form-check-input my-0" id="event-create-company-wide"
                  v-model="newEvent.companyWide">
              </span>
            </div>
            <div class="playlist-content-container">
              <!-- choose one playlist -->
              <div class="selector-section">
                <label class="small fw-semibold">
                  Playlist
                  <span class="text-muted fw-normal">(choose one)</span>
                </label>
                <div class="playlist-list small">
                  <div v-for="p in sortedPlaylists" :key="p.id" class="playlist-list-item"
                    :class="{ selected: selectedPlaylistId === parseInt(p.id), disabled: playlistDisabled(p) }"
                    role="button" tabindex="0" :aria-disabled="playlistDisabled(p)" :title="playlistTitle(p)"
                    @click="selectPlaylist(p)" @keydown.enter="selectPlaylist(p)">
                    <Check v-if="selectedPlaylistId === parseInt(p.id)" class="text-success" />
                    <BlockHelper v-else-if="playlistDisabled(p)" class="text-muted" />
                    <PlaylistPlay v-else class="text-muted" />
                    <div class="item-info">
                      <span class="fw-semibold">{{ p.name }}</span>
                      <small class="text-muted">{{ playlistMeta(p) }}</small>
                    </div>
                  </div>
                  <div v-if="sortedPlaylists.length === 0" class="empty-state">
                    No playlists available.
                  </div>
                </div>
              </div>

              <!-- choose multiple content -->
              <div class="selector-section">
                <label class="small fw-semibold">
                  Content
                  <span class="text-muted fw-normal">(choose one or more)</span>
                </label>
                <div class="content-list small">
                  <div v-for="c in sortedContent" :key="c.id" class="content-list-item"
                    :class="{ 'in-queue': contentQueue.includes(parseInt(c.id)) }">
                    <div class="item-info">
                      <span class="fw-semibold">{{ c.title }}</span>
                      <small v-if="c.uploaded_by" class="text-muted">Uploaded by {{ authorName(c.uploaded_by) }}</small>
                    </div>
                    <button type="button" class="btn btn-sm border-0 p-0 shadow-none"
                      :disabled="selectedPlaylistId !== null" :title="contentButtonTitle(c)" @click="toggleContent(c)">
                      <Plus v-if="!contentQueue.includes(parseInt(c.id))" class="text-success" />
                      <Check v-else class="text-success" />
                    </button>
                  </div>
                  <div v-if="sortedContent.length === 0" class="empty-state">
                    No existing content available.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-footer p-2">
          <button type="reset" class="btn btn-sm btn-danger me-2" data-bs-dismiss="modal" @click="clearChanges"
            title="Cancel">
            Cancel
          </button>

          <button type="button" :disabled="!canSave" :class="{ disabled: !canSave }" @click="createEvent"
            class="btn btn-sm btn-success" title="Create Event">
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
import BlockHelper from "vue-material-design-icons/BlockHelper.vue";
import Check from "vue-material-design-icons/Check.vue";
import PlaylistPlay from "vue-material-design-icons/PlaylistPlay.vue";
import Plus from "vue-material-design-icons/Plus.vue";


export default {
  components: {
    Check,
    PlaylistPlay,
    Plus,
    BlockHelper
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
        content: null, // comma-separated content ids (manual picks OR the chosen playlist's ids)
        companyWide: false // optional
      },
      // content ids picked in the Content list
      contentQueue: [],
      // playlist id picked in the Playlist list (UI only — its ids are resolved
      // into newEvent.content when the event is saved)
      selectedPlaylistId: null,
      locations: [],
      employees: [],
      content: [],
      playlists: [],
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

      this.locations = (await this.$axios.get(this.$api + "?locations")).data;
      this.employees = (await this.$axios.get(this.$api + "?employees")).data;
      this.content = (await this.$axios.get(this.$api + "?content")).data;
      this.playlists = (await this.$axios.get(this.$api + "?playlists")).data;
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
      }).filter((c) => c.status === 'active');
    },
    sortedPlaylists() {
      return [...this.playlists].sort((a, b) => {
        if (a.name === b.name) return 0;
        return a.name < b.name ? -1 : 1
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
        content: null, // optional
        companyWide: false // optional
      };
      this.contentQueue = [];
      this.selectedPlaylistId = null;
      this.error = ""
    },
    selectPlaylist(p) {
      // playlists without content are not selectable for an event
      if (this.playlistDisabled(p)) return;
      const id = Number(p.id);
      if (this.selectedPlaylistId === id) {
        // clicking the selected playlist deselects it
        this.selectedPlaylistId = null;
        return;
      }
      // an event can be tied to ONE playlist OR content — never both — so
      // choosing a playlist clears any content picked so far
      this.selectedPlaylistId = id;
      this.contentQueue = [];
      this.newEvent.content = null;
    },
    authorName(empNum) {
      return this.employees.find((e) => e.number === empNum)?.name || 'Unknown';
    },
    playlistDisabled(p) {
      return this.playlistItemCount(p) === 0;
    },
    playlistTitle(p) {
      if (this.playlistDisabled(p)) return "This playlist has no content — add content to it first";
      return this.selectedPlaylistId === parseInt(p.id)
        ? "Click to deselect this playlist"
        : "Choose this playlist for the event";
    },
    playlistMeta(p) {
      return this.playlistDisabled(p) ? "No content" : `${this.playlistItemCount(p)} content item(s)`;
    },
    toggleContent(c) {
      // a selected playlist takes precedence over content
      if (this.selectedPlaylistId !== null) return;
      const id = Number(c.id);
      const i = this.contentQueue.indexOf(id);
      if (i > -1) {
        this.contentQueue.splice(i, 1);
      } else {
        this.contentQueue.push(id);
      }
    },
    contentButtonTitle(c) {
      if (this.selectedPlaylistId !== null) return "Clear the playlist selection first";
      const id = Number(c.id);
      return this.contentQueue.includes(id) ? "Remove from event content" : "Add to event content (can pick multiple)";
    },
    playlistItemCount(p) {
      if (!p.content) return 0;
      return String(p.content).split(",").filter((id) => String(id).trim() !== "").length;
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

        // an event's content is always one comma-separated `content` value:
        // the ids picked in the Content list, or — when a playlist was chosen —
        // the ids that playlist contains (extracted here, at creation time)
        if (this.selectedPlaylistId !== null) {
          const playlist = this.playlists.find((p) => Number(p.id) === Number(this.selectedPlaylistId));
          this.newEvent.content = playlist?.content || null;
        } else {
          this.newEvent.content = this.contentQueue.length > 0 ? this.contentQueue.join(",") : null;
        }

        if (!window.confirm("Do you want to create this event?\n\n" + JSON.stringify({ ...this.newEvent }, null, 2))) return;

        // post
        await this.$axios.post(this.$api + "?events&new", this.newEvent);

        // log activity
        await this.$axios.post(this.$api + "?activity&new", {
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
        const latestEvent = (await this.$axios.get(this.$api + "?events")).data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].id;
        const latestActivity = (await this.$axios.get(this.$api + "?activity")).data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].id;
        window.alert(latestActivity);
        await this.$axios.post(this.$api + "?activity&update", {
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

<style scoped>
.playlist-content-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
  height: 100%;
  width: 100%;
  min-width: 280px;
}

.selector-section {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* playlist list (single select) */
.playlist-list {
  flex: 1 1 auto;
  min-height: 120px;
  max-height: 30dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
}

.playlist-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.35rem;
  background-color: var(--bs-light);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.playlist-list-item:hover {
  border-color: var(--bs-primary);
}

.playlist-list-item.selected {
  background-color: var(--bs-primary-bg-subtle);
  border-color: var(--bs-primary);
}

/* existing content list (multi select) */
.content-list {
  flex: 1 1 auto;
  min-height: 120px;
  max-height: 30dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
}

.content-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.35rem;
  background-color: var(--bs-light);
}

.content-list-item.in-queue {
  opacity: 0.55;
}

.item-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.item-info>span,
.item-info>small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  color: var(--bs-secondary-color);
}

.playlist-list-item.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  user-select: none;
  -webkit-user-select: none;
  background-color: var(--bs-secondary-bg);
}

.playlist-list-item.disabled:hover {
  border-color: rgba(0, 0, 0, 0.15);
}
</style>