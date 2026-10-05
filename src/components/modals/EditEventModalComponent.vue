<template>
  <!-- modal -->
  <div class="modal px-3 fade" id="edit-event-modal" ref="editEventModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 700px">
      <div class="modal-content shadow">
        <div class="modal-header">
          <div class="d-flex flex-column w-100 gap-1">
            <strong v-if="!editing" class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis"
              :title="editEvent.title">
              {{ editEvent.title }}
            </strong>
            <input v-else type="text" class="form-control form-control-sm" placeholder="Event Title"
              v-model="editEvent.title" />
            <div v-if="!editing" class="d-flex flex-row gap-2 align-items-center">
              <div v-if="editEvent.type && editEvent.subtype" class="badge rounded-pill text-capitalize border"
                style="width: min-content;" :class="badgeClass(editEvent.type)">
                {{ editEvent.type }} |
                {{ editEvent.subtype }}
              </div>
              <small class="text-muted d-flex gap-1 align-items-center">
                <span v-if="editEvent.location" class="d-inline-flex align-items-center gap-1">
                  <MapMarker /> {{ editEvent.location }}
                  <span class="separator">&middot;</span>
                </span>
                <span class="d-inline-flex align-items-center gap-1">
                  <CalendarRangeOutline />
                  <span v-if="editEvent.allDay">{{ formatDate(editEvent.start) }}</span>
                  <span v-else>{{ formatDate(editEvent.start) }} - {{ formatDate(editEvent.end) }}</span>
                </span>
              </small>
            </div>
            <div v-else class="d-flex flex-row gap-2 align-items-center mt-1">
              <select required class="form-select form-select-sm text-capitalize" v-model="editEvent.type">
                <option value="">Select Type</option>
                <option v-for="t in types" :key="t" :value="t">
                  {{ t }}
                </option>
              </select>
              <select required :disabled="this.editEvent.type.length === 0"
                class="form-select form-select-sm text-capitalize" v-model="editEvent.subtype">
                <option value="">Select Subtype</option>
                <option v-for="st in subtypes" :key="st" :value="st">
                  {{ st }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-body">
          <!-- event description -->
          <p v-if="!editing" class="lh-sm">
            {{ editEvent.description || "No description provided." }}
          </p>
          <!-- event editable fields -->
          <textarea class="form-control form-control-sm mb-2" placeholder="What is this event about?" v-else
            v-model="editEvent.description" style="height: 150px; resize: none;">
          </textarea>
          <!-- employee selection if event type allows it -->
          <label v-if="editEvent.type === 'employee'" for="event-edit-employee-select"
            class="small fw-semibold">Employee</label>
          <select v-if="editEvent.type === 'employee'" :disabled="!editing" id="event-edit-employee-select"
            class="form-select form-select-sm" v-model="editEvent.employee_num">
            <option :value="editEvent.employee_num">{{ employeeName }}</option>
            <option v-for="employee in sortedEmployees" :key="employee.number" :value="employee.number">
              {{ employee.name }}
            </option>
          </select>
          <div class="mb-2 d-flex flex-row gap-2 w-100">
            <!-- date range -->
            <div class="w-100">
              <label for="event-edit-start-date" class="small fw-semibold">Start</label>
              <input type="datetime-local" step="1" class="form-control form-control-sm" :disabled="!editing"
                name="event-edit-start-date" id="event-edit-start-date" v-model="editEvent.start" />
            </div>
            <div class="w-100">
              <label for="event-edit-end-date" class="small fw-semibold">End</label>
              <input type="datetime-local" step="1" class="form-control form-control-sm"
                :disabled="!editing || editEvent.allDay" name="event-edit-end-date" id="event-edit-end-date"
                v-model="editEvent.end" />
            </div>
          </div>

          <!-- location dropdown -->
          <select :disabled="!editing || editEvent.companyWide" id="event-edit-location-select"
            :class="{ disabled: this.editEvent.companyWide !== false }" class="form-select form-select-sm"
            v-model="editEvent.location_id">
            <option :value="null">Select Location</option>
            <option v-for="l in locations" :key="l.name + '-' + l.id" :value="l.id">
              {{ l.name }}
            </option>
          </select>

          <!-- allday and companywide flags -->
          <span v-if="editing" class="hstack gap-2 align-items-center form-control-sm">
            <label for="event-edit-all-day" class="small text-nowrap">One-day Event</label>
            <input type="checkbox" class="form-check-input my-0" id="event-edit-all-day" v-model="editEvent.allDay">
            <label for="event-edit-company-wide" class="small text-nowrap">All Locations</label>
            <input type="checkbox" class="form-check-input my-0" id="event-edit-company-wide"
              v-model="editEvent.companyWide">
          </span>

          <!-- choose a playlist: replaces this event's content with that
               playlist's content (events only store content ids) -->
          <div class="mt-2 d-flex flex-column gap-1">
            <label class="small fw-semibold">
              Playlist
              <span class="text-muted fw-normal">(choose one to replace the content)</span>
            </label>
            <div class="playlist-list small">
              <div v-for="p in sortedPlaylists" :key="p.id" class="playlist-list-item"
                :class="{ selected: matchedPlaylistId === parseInt(p.id), disabled: playlistDisabled(p) }" role="button"
                tabindex="0" :aria-disabled="playlistDisabled(p)" :title="playlistTitle(p)" @click="selectPlaylist(p)"
                @keydown.enter="selectPlaylist(p)">
                <Check v-if="matchedPlaylistId === parseInt(p.id)" class="text-success" />
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
            <small class="text-muted d-block">Selecting a playlist copies its content into this event.</small>
          </div>

          <!-- existing content selection: an event can hold one or more content
               items, stored as a comma-separated list in event.content -->
          <div class="mt-2 d-flex flex-column gap-1">
            <label class="small fw-semibold">
              Content
              <span class="text-muted fw-normal">({{ contentQueue.length }})</span>
            </label>
            <div class="content-list small">
              <div v-for="c in sortedContent" :key="c.id" class="content-list-item"
                :class="{ 'in-queue': contentQueue.includes(parseInt(c.id)) }">
                <div class="item-info">
                  <span class="fw-semibold">{{ c.title }}</span>
                  <small v-if="c.uploaded_by" class="text-muted">Uploaded by {{ authorName(c.uploaded_by) }}</small>
                </div>
                <button type="button" class="btn btn-sm border-0 p-0 shadow-none" :disabled="!editing"
                  :title="contentButtonTitle(c)" @click="toggleContent(c)">
                  <Plus v-if="!contentQueue.includes(parseInt(c.id))" class="text-success" />
                  <Check v-else class="text-success" />
                </button>
              </div>
              <!-- ids attached to the event that are no longer in the active content list -->
              <div v-for="orphan in orphanContentRows" :key="'orphan-' + orphan.id" class="content-list-item in-queue">
                <div class="item-info">
                  <span class="fw-semibold">{{ orphan.title }}</span>
                  <small class="text-muted">No longer in the content library</small>
                </div>
                <button type="button" class="btn btn-sm border-0 p-0 shadow-none" :disabled="!editing"
                  title="Remove from event content" @click="removeQueuedContent(orphan.id)">
                  <Close class="text-danger" />
                </button>
              </div>
              <div v-if="contentQueue.length === 0" class="empty-state">
                No content attached to this event.
              </div>
            </div>
            <small class="text-muted d-block">Select existing content to display during this event. (optional)</small>
          </div>
        </div>
        <!-- confirmation btns before delete-->
        <div v-if="confirmDelete" class="modal-footer p-2">
          <p class="px-2 me-auto btn btn-sm bg-danger-subtle text-danger-emphasis rounded">Are you sure you want to
            delete this event?</p>
          <button class="btn btn-sm btn-danger me-2" @click="confirmDelete = false">No</button>
          <button class="btn btn-sm btn-success" @click="deleteEvent();">Yes</button>
        </div>
        <div v-else class="modal-footer p-2">
          <button data-bs-dismiss="modal" class="btn btn-sm btn-secondary me-2">{{ editing ? 'Cancel' : 'Close'
          }}</button>
          <button v-if="!editing" class="btn btn-sm btn-danger me-2" @click="confirmDelete = true" title="Delete">
            Delete
          </button>
          <button data-bs-dismiss="modal" v-if="editing" :disabled="!hasChanges" class="btn btn-sm btn-secondary me-2"
            title="Discard Changes">
            Discard Changes
          </button>
          <button v-if="!editing" class="btn btn-sm btn-primary me-2" :disabled="editing" @click="startEditing()"
            title="Edit event">
            <Pencil />&nbsp;Edit
          </button>
          <button v-if="editing" :disabled="!hasChanges" @click="saveChanges" class="btn btn-sm btn-success"
            title="Save changes">
            <Floppy />&nbsp;Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Pencil from "vue-material-design-icons/Pencil.vue";
import Floppy from "vue-material-design-icons/Floppy.vue";
import CalendarRangeOutline from "vue-material-design-icons/CalendarRangeOutline.vue";
import MapMarker from "vue-material-design-icons/MapMarker.vue";
import Check from "vue-material-design-icons/Check.vue";
import Plus from "vue-material-design-icons/Plus.vue";
import Close from "vue-material-design-icons/Close.vue";
import BlockHelper from "vue-material-design-icons/BlockHelper.vue";
import PlaylistPlay from "vue-material-design-icons/PlaylistPlay.vue";

import { clearModalFocus, formatDate, formatDateTimeLocal } from "@/common/helpers";
import { eventTypes } from "@/common/constants";

export default {
  components: {
    Pencil,
    Floppy,
    CalendarRangeOutline,
    MapMarker,
    Check,
    Plus,
    Close,
    BlockHelper,
    PlaylistPlay
  },
  props: {
    event: Object, // original event from calendar
  },
  inject: ["toast", "store"],
  emits: ["edited", "deleted"],
  data() {
    return {
      editing: false,
      confirmDelete: false,
      editEvent: {}, // draft event to be updated
      // content ids currently attached to the event (resolved from event.content)
      contentQueue: [],
      employees: [],
      locations: [],
      content: [],
      playlists: [],
    };
  },
  computed: {
    hasChanges() {
      return (
        ((this.editEvent.type === 'employee' && this.editEvent.employee_num !== null) || (this.editEvent.type !== 'employee')) &&
        (eventTypes[this.editEvent.type]?.includes(this.editEvent.subtype)) &&
        (this.editEvent.title !== this.event.title ||
          this.editEvent.type !== this.event.type ||
          this.editEvent.subtype !== this.event.subtype ||
          this.editEvent.description !== this.event.description ||
          this.editEvent.location_id !== this.event.location_id ||
          this.editEvent.start !== this.formatDateTimeLocal(this.event.start) ||
          this.editEvent.end !== this.formatDateTimeLocal(this.event.end) ||
          this.editEvent.allDay !== this.event.allDay ||
          this.editEvent.companyWide !== this.event.companyWide ||
          this.editEvent.employee_num !== this.event.employee_num ||
          this.currentContent !== (this.event.content || null))
      );
    },
    types() {
      return Object.keys(eventTypes);
    },
    subtypes() {
      return eventTypes[this.editEvent.type] ?? [];
    },
    sortedEmployees() {
      return [...this.employees].sort((a, b) => a.name.localeCompare(b.name));
    },
    employeeName() {
      return this.employees.find(e => e.number === this.editEvent.employee_num)?.name;
    },
    sortedContent() {
      return [...this.content].sort((a, b) => {
        if (a.filename === b.filename) return 0;
        return a.filename < b.filename ? -1 : 1
      }).filter((c) => c.status === 'active');
    },
    /**
     * The event's `content` column stores attached content ids as a
     * comma-separated list — returned here in db-ready form.
     */
    currentContent() {
      return this.contentQueue.length > 0 ? this.contentQueue.join(",") : null;
    },
    /**
     * Attached content ids that are no longer in the active content list
     * (e.g. deactivated/archived) — shown separately so view/edit still
     * reflects them.
     */
    orphanContentRows() {
      return this.contentQueue
        .filter((id) => !this.sortedContent.some((c) => Number(c.id) === id))
        .map((id) => {
          const c = this.content.find((rec) => Number(rec.id) === id);
          return { id, title: c?.title ?? `Content #${id}`, filename: c?.filename ?? "" };
        });
    },
    /**
     * The playlist whose content exactly matches the event's current content.
     * Events created from a playlist were stored with that playlist's content
     * ids, so this best-effort match usually pre-highlights the original one.
     */
    matchedPlaylistId() {
      const current = this.currentContent;
      if (!current) return null;
      const match = this.playlists.find(
        (p) => p.content && String(p.content).trim() === current
      );
      return match ? Number(match.id) : null;
    },
    sortedPlaylists() {
      return [...this.playlists].sort((a, b) => {
        if (a.name === b.name) return 0;
        return a.name < b.name ? -1 : 1
      })
    },
  },
  watch: {
    'editEvent.companyWide': {
      handler(newValue) {
        if (newValue === true) {
          this.editEvent.location_id = null;
        } else {
          this.editEvent.location_id = this.locations[0].id;
        }
      },
    },
    'editEvent.start': {
      handler() {
        this.updateAllDay();
      },
    },
    'editEvent.end': {
      handler() {
        this.updateAllDay();
      },
    },
    event(newEvent) {
      this.editEvent = this.formatForEdit(newEvent);
      this.contentQueue = this.parseContentList(newEvent.content);
      this.editing = false;
    },
  },
  async mounted() {
    this.$refs.editEventModal.addEventListener("hidden.bs.modal", () => {
      this.editing = false;
    });

    clearModalFocus(this.$refs.editEventModal);

    // fetch all available locations for the location select dropdown
    this.locations = (await this.$axios.get(this.$api + '?locations')).data;
    this.employees = (await this.$axios.get(this.$api + '?employees')).data;
    this.content = (await this.$axios.get(this.$api + '?content')).data;
    this.playlists = (await this.$axios.get(this.$api + '?playlists')).data;
  },

  methods: {
    formatDate,
    formatDateTimeLocal,
    isMidnight(date) {
      return (
        date.getHours() === 0 &&
        date.getMinutes() === 0 &&
        date.getSeconds() === 0
      );
    },
    updateAllDay() {
      const start = new Date(this.editEvent.start);
      const end = new Date(this.editEvent.end);

      const nextDay = new Date(start);
      nextDay.setDate(nextDay.getDate() + 1);

      this.editEvent.allDay =
        nextDay.toDateString() === end.toDateString() &&
        this.isMidnight(start) &&
        this.isMidnight(end);
    },
    parseContentList(content) {
      if (!content) return [];
      return String(content)
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !Number.isNaN(id));
    },
    toggleContent(c) {
      const id = Number(c.id);
      const i = this.contentQueue.indexOf(id);
      if (i > -1) this.contentQueue.splice(i, 1);
      else this.contentQueue.push(id);
    },
    removeQueuedContent(id) {
      this.contentQueue = this.contentQueue.filter((q) => q !== Number(id));
    },
    selectPlaylist(p) {
      if (!this.editing || this.playlistDisabled(p)) return;
      const id = Number(p.id);
      if (this.matchedPlaylistId === id) {
        // clicking the currently matched playlist removes its content
        this.contentQueue = [];
        return;
      }
      // replace this event's content with the playlist's content ids
      this.contentQueue = this.parseContentList(p.content);
    },
    playlistDisabled(p) {
      return this.playlistItemCount(p) === 0;
    },
    playlistItemCount(p) {
      if (!p.content) return 0;
      return String(p.content).split(",").filter((id) => String(id).trim() !== "").length;
    },
    playlistMeta(p) {
      return this.playlistDisabled(p) ? "No content" : `${this.playlistItemCount(p)} content item(s)`;
    },
    playlistTitle(p) {
      if (this.playlistDisabled(p)) return "This playlist has no content — add content to it first";
      if (!this.editing) return "Click Edit to change this event's playlist";
      return this.matchedPlaylistId === Number(p.id)
        ? "Click to remove this playlist's content from the event"
        : "Replace this event's content with this playlist";
    },
    contentButtonTitle(c) {
      const id = Number(c.id);
      return this.contentQueue.includes(id)
        ? "Remove from event content"
        : "Add to event content (can pick multiple)";
    },
    authorName(empNum) {
      return this.employees.find((e) => e.number === empNum)?.name || "Unknown";
    },
    resetChanges() {
      this.editing = false;
      this.confirmDelete = false;
      this.editEvent = this.formatForEdit(this.event);
      this.contentQueue = this.parseContentList(this.event.content);
    },
    async saveChanges() {
      try {
        // All day?
        if (this.editEvent.allDay) {
          const start = new Date(this.editEvent.start);
          const end = new Date(this.editEvent.end);
          start.setHours(0, 0, 0, 0);
          end.setDate(start.getDate() + 1);
          end.setHours(0, 0, 0, 0);
          this.editEvent.start = start.toISOString().split("T")[0] + "T00:00:00";
          this.editEvent.end = end.toISOString().split("T")[0] + "T00:00:00";
        }
        // Parse IDs
        if (this.editEvent.id) this.editEvent.id = parseInt(this.editEvent.id);
        if (this.editEvent.location_id) this.editEvent.location_id = parseInt(this.editEvent.location_id);
        if (this.editEvent.employee_num) this.editEvent.employee_num = parseInt(this.editEvent.employee_num);
        // persist the attached content as a comma-separated list (event.content column)
        this.editEvent.content = this.currentContent;
        // Company wide?
        if (this.editEvent.companyWide) {
          this.editEvent.location_id = null;
        }
        // If new type changed from employee to non-employee, reset employee_num
        if (this.editEvent.type !== "employee" && this.editEvent.employee_num !== null) {
          this.editEvent.employee_num = null;
        }
        // if location_id is null, set companyWide to true
        if (!this.editEvent.location_id) {
          this.editEvent.companyWide = true;
        }
        const toEdit = {
          ...this.editEvent
        }

        // if (!window.confirm("Do you want to save these changes?\n\n" + JSON.stringify(toEdit, null, 2))) return;
        await this.$axios.post(this.$api + "?events&update", toEdit);
        // log activity
        await this.$axios.post(this.$api + "?activity&new", {
          enum: parseInt(this.store.authenticated.number),
          action: "update",
          entity_type: "event",
          entity_json: JSON.stringify(toEdit),
        })

        this.$emit("edited");
        this.$modal.hide('edit-event-modal');
        this.toast.show("Event Updated", "The event has been successfully updated.", "bg-info-subtle text-info-emphasis");
      } catch (error) {
        console.error("Error saving changes:", error);
        this.toast.show("Error: ", error, "bg-info-subtle text-info-emphasis");
      } finally {
        this.resetChanges();
      }
    },
    formatForEdit(event) { // format dates for form inputs
      const updated = structuredClone(event);
      updated.start = this.formatDateTimeLocal(event.start);
      updated.end = this.formatDateTimeLocal(event.end);
      return updated;
    },
    async deleteEvent() {
      try {
        // capture the event for logging
        const toDelete = (await this.$axios.get(this.$api + "?events&id=" + this.editEvent.id)).data[0];
        // delete the event
        await this.$axios.post(this.$api + "?events&delete", {
          id: this.editEvent.id
        });
        this.resetChanges();
        this.$emit("deleted")
        this.$modal.hide('edit-event-modal');
        this.toast.show("Event Deleted", "The event has been successfully deleted.", "bg-info-subtle text-info-emphasis");
        // log activity
        await this.$axios.post(this.$api + "?activity&new", {
          enum: parseInt(this.store.authenticated.number),
          action: "delete",
          entity_type: "event",
          entity_json: JSON.stringify(toDelete)
        })
      } catch (error) {
        console.error(error);
      }
    },
    startEditing() {
      this.editing = true;
    },
    badgeClass(type) {
      switch (type) {
        case "employee":
          return "bg-warning-subtle text-warning-emphasis";

        case "company":
          return "bg-info-subtle text-info-emphasis";

        case "announcement":
          return "bg-danger-subtle text-danger-emphasis";

        default:
          return "bg-secondary";
      }
    },
  },
};
</script>

<style scoped>
.content-list {
  flex: 1 1 auto;
  min-height: 100px;
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

.playlist-list {
  flex: 1 1 auto;
  min-height: 100px;
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
