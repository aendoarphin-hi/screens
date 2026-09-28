<template>
  <!-- modal -->
  <div class="modal px-3 fade" id="edit-screen-modal" ref="editScreenModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 1000px;">
      <div class="modal-content shadow">

        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <strong class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis">
              Edit Screen
            </strong>
          </div>
        </div>

        <div class="modal-body d-flex flex-column gap-3">
          <!-- <small>{{ JSON.stringify(form, null, 2) }}</small><br /> -->
          <!-- three main columns -->
          <div class="d-flex flex-row">
            <!-- screen info -->
            <div class="pe-3" style="flex: 1 1 0; min-width: 0;">
              <div class="vstack gap-2">
                <label class="small fw-semibold">Title</label>
                <input v-model="form.title" type="text" class="form-control form-control-sm" placeholder="Screen Name">
                <label class="small fw-semibold">Location</label>
                <select v-model="form.location_id" class="form-select form-select-sm">
                  <option :value="null">Select Location</option>
                  <option v-for="l in locations" :key="l.name + '-' + l.id" :value="l.id">
                    {{ l.name }}
                  </option>
                </select>
                <label class="small fw-semibold">Playlist</label>
                <select v-model="form.playlist_id" class="form-select form-select-sm">
                  <option :value="null">Select Playlist</option>
                  <option v-for="p in sortedPlaylists" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
                <small class="text-muted text-center" style="font-size: 10px">
                  IP: {{ form.ip_address }}&nbsp;&nbsp;MAC: {{ form.mac_address }}
                </small>
                <div class="bg-success-subtle rounded p-2">
                  <p class="form-text text-body-secondary animate__animated animate__fadeIn">
                    <InformationOutline /> When a playlist is selected, the play sequence will prefill with the
                    playlist's
                    assigned content.
                    Modify its content and play sequence via edit mode in the <strong>Playlists</strong> tab.
                  </p>
                </div>
              </div>
            </div>
            <!-- screen content management -->
            <div class="border-start px-3 d-flex flex-column gap-2" style="flex: 1 1 0; min-width: 0;">
              <label class="small fw-semibold">Play Sequence</label>
              <!-- play sequence list -->
              <div class="content-queue small" @dragover.prevent="onContainerDragOver" @drop.prevent="onContainerDrop">
                <div v-for="(c, i) in queueItems" :key="c.id" class="queue-item"
                  :class="{ 'opacity-50': form.playlist_id, dragging: draggedId === c.id, 'drag-over': dragOverId === c.id && draggedId !== c.id }"
                  draggable="true" @dragstart="onDragStart(c, $event)" @dragover.prevent="onDragOver(c)"
                  @dragleave="onDragLeave(c)" @drop.prevent="onDrop(c)" @dragend="onDragEnd">
                  <span class="drag-handle" title="Drag to reorder">
                    <DragVertical />
                  </span>
                  <span class="sequence-badge" :title="i === 0 ? 'Plays first' : `Position ${i + 1}`">{{ i + 1 }}</span>
                  <div class="item-info">
                    <span class="fw-semibold">{{ c.title }}</span>
                    <small v-if="c.uploaded_by" class="text-muted">Uploaded by {{ authorName(c.uploaded_by) }}</small>
                  </div>
                  <span v-if="c.isTimed" class="badge text-bg-warning text-nowrap"
                    title="Timed content — only visible during its event window">Timed</span>
                  <button type="button" class="btn btn-sm border-0 p-0 shadow-none"
                    :disabled="form.playlist_id !== null" title="Remove from play sequence"
                    @click="removeFromQueue(c.id)">
                    <Close class="text-danger" />
                  </button>
                </div>

                <!-- empty state -->
                <div v-if="queueItems.length === 0" class="empty-state">
                  No content in the play sequence yet.<br />
                  Use the plus button in the <em>Existing Content</em> list to add items here
                  OR select a playlist to prefill the play sequence.
                </div>
              </div>
            </div>

            <!-- existing content -->
            <div class="border-start ps-3 d-flex flex-column gap-2" style="flex: 1 1 0; min-width: 0;">
              <label class="small fw-semibold">Existing Content</label>
              <div class="content-list small">
                <div v-for="c in sortedContent" :key="c.id" class="content-list-item"
                  :class="{ 'in-queue': contentQueue.includes(parseInt(c.id)) }">
                  <div class="item-info">
                    <span class="fw-semibold">{{ c.title }}</span>
                    <small v-if="c.uploaded_by" class="text-muted">Uploaded by {{ authorName(c.uploaded_by) }}</small>
                  </div>
                  <button type="button" class="btn btn-sm border-0 p-0 shadow-none"
                    :disabled="contentQueue.includes(parseInt(c.id))"
                    :title="contentQueue.includes(parseInt(c.id)) ? 'Already in play sequence' : 'Add to play sequence'"
                    @click="addContentToQueue(c)">
                    <Plus class="text-success" />
                  </button>
                </div>
                <!-- empty state -->
                <div v-if="sortedContent.length === 0" class="empty-state">
                  No existing content available.
                </div>
              </div>
            </div>
          </div>

          <!-- timed content: events with attached content -->
          <div class="d-flex flex-column gap-2">
            <label class="small fw-semibold d-flex align-items-center gap-2">
              Timed Content
              <span class="badge rounded-pill text-bg-secondary">{{ timedContent.length }}</span>
            </label>
            <small class="text-muted">
              Events with attached content. When added to the play sequence, the content is only shown
              during its event's start/end window.
            </small>
            <div class="content-list small">
              <div v-for="e in timedContent" :key="e.id" class="content-list-item"
                :class="{ 'in-queue': contentQueue.includes(e.content_id) }">
                <div class="item-info">
                  <span class="fw-semibold">{{ contentTitle(e.content_id) }}</span>
                  <small class="text-muted">{{ e.title }} &middot; {{ formatEventRange(e.start, e.end) }}</small>
                </div>
                <button type="button" class="btn btn-sm border-0 p-0 shadow-none"
                  :disabled="contentQueue.includes(e.content_id)"
                  :title="contentQueue.includes(e.content_id) ? 'Already in the play sequence' : 'Add timed content to play sequence'"
                  @click="addTimedContentToQueue(e)">
                  <Plus class="text-warning" />
                </button>
              </div>
              <!-- empty state -->
              <div v-if="timedContent.length === 0" class="empty-state">
                No timed content yet. Attach existing content to an event in the Calendar
                and it will appear here for its scheduled window.
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer p-2">
          <button type="button" class="btn btn-sm btn-outline-danger me-2" @click="deleteScreen" title="Delete">
            Delete
          </button>

          <button type="button" class="btn btn-sm btn-danger me-2" @click="clearChanges" title="Cancel">
            Cancel
          </button>

          <button :disabled="canSubmit" @click="submit" type="button" class="btn btn-sm btn-success"
            title="Save Screen Changes">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clearModalFocus } from '@/common/helpers';
import Close from "vue-material-design-icons/Close.vue";
import DragVertical from "vue-material-design-icons/DragVertical.vue";
import InformationOutline from "vue-material-design-icons/InformationOutline.vue";
import Plus from "vue-material-design-icons/Plus.vue";

export default {
  components: {
    Close,
    DragVertical,
    Plus,
    InformationOutline
  },
  props: {
    screen: Object,
    employees: Array
  },
  inject: ['toast'],
  emits: ['updated', 'deleted'],
  data() {
    return {
      locations: [],
      form: {
        id: null,
        title: null,
        location_id: null,
        status: null,
        content: null,
        playlist_id: null,
        mac_address: null,
        ip_address: null
      },
      content: [],
      playlists: [],
      events: [],
      // ordered play sequence of content ids assigned to the screen (index 0 = first slide)
      contentQueue: [],
      // native html drag and drop state
      draggedId: null,
      dragOverId: null,
      search: ''
    }
  },
  methods: {
    authorName(empNum) {
      return this.employees.find((e) => e.number === empNum)?.name || "Unknown";
    },
    async loadContent() {
      this.content = (await this.$axios.get(this.$api + '?content')).data;
    },
    clearChanges() {
      this.form = {
        id: null,
        title: null,
        location_id: null,
        status: null,
        content: null,
        playlist_id: null,
        mac_address: null,
        ip_address: null
      }
      this.contentQueue = [];
      this.$modal.hide('edit-screen-modal');
    },
    async deleteScreen() {
      try {
        if (!window.confirm('Are you sure you want to delete this screen?')) return;
        await this.$axios.post(this.$api + '?screens&delete', {
          id: parseInt(this.form.id)
        });
        this.$emit('deleted');
        this.toast.show("Screen Deleted", "The screen has been successfully deleted.", "bg-info-subtle text-info-emphasis");
      } catch (error) {
        console.error(error);
        this.toast.show("Error", "There was an error deleting the screen.", "bg-danger-subtle text-danger-emphasis");
      } finally {
        this.$modal.hide('edit-screen-modal');
      }
    },
    setScreen(screen) {
      if (!screen) return;
      this.form = {
        id: screen.id,
        title: screen.title,
        location_id: screen.location_id,
        status: screen.status,
        content: screen.content,
        playlist_id: screen.playlist_id,
        mac_address: screen.mac_address,
        ip_address: screen.ip_address
      };
      this.seedContentQueue(screen.content);
    },
    /**
     * Seeds the play sequence from a screen's stored content.
     * The queue holds content ids in display order (index 0 plays first).
     * Accepts a comma-separated string of content ids (the screens.content
     * db column format), an array of content objects, an array of content
     * ids, or no content at all.
     */
    seedContentQueue(content) {
      let ids = [];
      if (Array.isArray(content)) {
        ids = content
          .map((entry) => {
            // entry may be a content object or a plain (string|number) content id
            if (entry && typeof entry === "object" && entry.id !== undefined) return entry.id;
            return entry;
          })
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id));
      } else if (typeof content === "string" && content.trim() !== "") {
        // db column stores a comma-separated list of content ids, e.g. "3,1,7"
        ids = content
          .split(",")
          .map((id) => Number(id.trim()))
          .filter((id) => !Number.isNaN(id));
      }
      this.contentQueue = ids;
    },
    /**
     * Rebuilds the play sequence from the content of the currently selected
     * playlist (when a playlist is selected).
     */
    seedQueueFromSelectedPlaylist() {
      if (!this.form.playlist_id) return;
      const playlist = this.playlists.find(
        (p) => Number(p.id) === Number(this.form.playlist_id)
      );
      if (playlist) {
        this.seedContentQueue(playlist.content);
      }
    },
    addContentToQueue(item) {
      if (!item || item.id === undefined || item.id === null) return;
      const id = Number(item.id);
      if (Number.isNaN(id)) return;
      if (!this.contentQueue.includes(id)) {
        this.contentQueue.push(id);
        // manually editing the play sequence means it is no longer driven by
        // a playlist, so clear the selected playlist
        this.form.playlist_id = null;
      }
    },
    contentTitle(contentId) {
      const c = this.content.find((c) => Number(c.id) === Number(contentId));
      return c?.title ?? `Content #${contentId}`;
    },
    formatEventRange(start, end) {
      const fmt = (v) =>
        new Date(v).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
      return `${fmt(start)} – ${fmt(end)}`;
    },
    /**
     * Adds the content attached to a timed event to the play sequence.
     * The queue stores content ids (not event ids), so an id can only appear once —
     * any untimed entry for that content is automatically superseded by this timed one
     * (the slideshow then decides visibility from the event start/end window).
     */
    addTimedContentToQueue(ev) {
      if (!ev || ev.content_id === null || ev.content_id === undefined) return;
      const id = Number(ev.content_id);
      if (Number.isNaN(id)) return;
      if (!this.contentQueue.includes(id)) {
        this.contentQueue.push(id);
        // manually editing the play sequence deselects the playlist (same as addContentToQueue)
        this.form.playlist_id = null;
      }
    },
    removeFromQueue(id) {
      const nid = Number(id);
      this.contentQueue = this.contentQueue.filter((q) => q !== nid);
      if (Number(this.draggedId) === nid) this.onDragEnd();
    },
    onDragStart(item, event) {
      if (this.form.playlist_id) return;
      this.draggedId = item.id;
      event.dataTransfer.setData("text/plain", String(item.id));
      event.dataTransfer.effectAllowed = "move";
    },
    onDragOver(item) {
      if (this.draggedId && item.id !== this.draggedId) {
        this.dragOverId = item.id;
      }
    },
    onDragLeave(item) {
      if (this.dragOverId === item.id) {
        this.dragOverId = null;
      }
    },
    onDrop(item) {
      if (!this.draggedId || item.id === this.draggedId) {
        this.onDragEnd();
        return;
      }
      const from = this.contentQueue.indexOf(Number(this.draggedId));
      const to = this.contentQueue.indexOf(Number(item.id));
      if (from === -1 || to === -1) {
        this.onDragEnd();
        return;
      }
      this.reorderContent(from, to);
      this.onDragEnd();
    },
    onContainerDragOver() {
      // allows dropping into the empty space below the list (handled by onContainerDrop)
    },
    onContainerDrop() {
      // dropping below the last row appends the dragged item to the end of the sequence
      if (!this.draggedId) return;
      const from = this.contentQueue.indexOf(Number(this.draggedId));
      if (from === -1) {
        this.onDragEnd();
        return;
      }
      this.reorderContent(from, this.contentQueue.length);
      this.onDragEnd();
    },
    onDragEnd() {
      this.draggedId = null;
      this.dragOverId = null;
    },
    // moves the item at index `from` to just before index `to`
    reorderContent(from, to) {
      const [item] = this.contentQueue.splice(from, 1);
      const insertAt = from < to ? to - 1 : to;
      this.contentQueue.splice(insertAt, 0, item);
      console.log(this.contentQueue);
    },
    async submit() {
      try {
        if (this.form.playlist_id) {
          // the screen is driven by the selected playlist: persist the playlist
          // assignment AND snapshot its play sequence into the screen's content
          // column, so the sequence survives the save/reopen round-trip
          const playlist = this.playlists.find(
            (p) => Number(p.id) === Number(this.form.playlist_id)
          );
          this.form.content = playlist?.content ??
            (this.contentQueue.length > 0 ? this.contentQueue.join(",") : null);
        } else {
          // no playlist selected: make sure playlist_id is null, and persist the
          // manual play sequence as a comma-separated string of content ids
          // (index 0 plays first), or null when no content is assigned
          this.form.playlist_id = null;
          this.form.content = this.contentQueue.length > 0 ? this.contentQueue.join(",") : null;
        }
        // send the playlist id as an integer (backend expects a number)
        this.form.playlist_id = this.form.playlist_id ? parseInt(this.form.playlist_id) : null;
        // if (!window.confirm('Are you sure you want to save these changes?\n\n' + JSON.stringify(this.form, null, 2))) return;
        await this.$axios.post(this.$api + '?screens&update', { ...this.form });
        this.$emit('updated');
        this.$modal.hide('edit-screen-modal');
        this.toast.show("Screen Updated", "The screen has been successfully updated.", "bg-success-subtle text-success-emphasis");
      } catch (error) {
        console.error(error);
      }
    }
  },
  computed: {
    /**
     * Resolves the ordered content ids in the queue to their full content
     * records (loaded from the `?content` endpoint) for display.
     * Falls back to a placeholder row if an id is not present in the list.
     */
    queueItems() {
      const timedIds = new Set(this.timedContent.map((e) => e.content_id));
      return this.contentQueue.map((id) => {
        const record = this.content.find((c) => Number(c.id) === id) || {
          id,
          filename: `Content #${id}`,
          title: "Missing from content list",
          type: "unknown"
        };
        return { ...record, isTimed: timedIds.has(Number(id)) };
      });
    },
    sortedContent() {
      return [...this.content].sort((a, b) => {
        if (a.title === b.title) return 0;
        return a.title < b.title ? -1 : 1
      }).filter((c) => c.status === 'active');
    },
    /**
     * All events that have a content file attached — the "Timed Content" source list.
     * Events without a file keep content_id = null and are ignored.
     */
    timedContent() {
      return this.events
        .filter((e) => e.content_id !== null && e.content_id !== undefined && e.content_id !== "")
        .map((e) => ({ ...e, content_id: Number(e.content_id) }))
        .sort((a, b) => new Date(a.start) - new Date(b.start));
    },
    sortedPlaylists() {
      return [...this.playlists].sort((a, b) => {
        if (a.name === b.name) return 0;
        return a.name < b.name ? -1 : 1
      })
    },
    canSubmit() {
      return !this.form.title ||
        !this.form.location_id ||
        !this.form.status ||
        !this.form.mac_address ||
        !this.form.ip_address
    }
  },
  async mounted() {
    clearModalFocus(this.$refs.editScreenModal);

    // refresh the content library whenever the modal opens, so content deleted or
    // uploaded elsewhere shows up
    this.$refs.editScreenModal.addEventListener('show.bs.modal', () => this.loadContent());

    this.loadContent();
    this.playlists = (await this.$axios.get(this.$api + '?playlists')).data;
    this.locations = (await this.$axios.get(this.$api + '?locations')).data;
    this.events = (await this.$axios.get(this.$api + '?events')).data;

    // screen prop watcher can fire before the content/playlist lists finish
    // re-seed the play sequence now that they are available
    if (this.screen) {
      this.seedContentQueue(this.screen.content);
      this.seedQueueFromSelectedPlaylist();
    }
  },
  watch: {
    screen: {
      immediate: true,
      async handler() {
        if (this.screen) {
          this.setScreen(this.screen);
          this.playlists = (await this.$axios.get(this.$api + '?playlists')).data;
          this.events = (await this.$axios.get(this.$api + '?events')).data;
        }
      }
    },
    // a playlist selection rebuilds the play sequence from that playlist's content
    'form.playlist_id': {
      handler(playlistId) {
        if (playlistId !== null && playlistId !== undefined && playlistId !== '') {
          this.seedQueueFromSelectedPlaylist();
        }
        // clearing the playlist selection leaves the current play sequence untouched
      }
    }
  }
}
</script>

<style scoped>
/* content queue */
.content-queue {
  flex: 1 1 auto;
  min-height: 140px;
  max-height: 45dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: var(--bs-border-radius);
  background-color: var(--bs-secondary-bg);
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.queue-item:active {
  cursor: grabbing;
}

.queue-item.dragging {
  opacity: 0.35;
  border-style: dashed;
  background-color: #e9ecef;
}

.queue-item.drag-over {
  background-color: var(--bs-primary-bg-subtle);
  border-style: dashed;
}

.drag-handle {
  display: inline-flex;
  color: var(--bs-secondary-color);
}

.sequence-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  border-radius: var(--bs-border-radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  background-color: var(--bs-primary);
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

/* existing content list */
.content-list {
  flex: 1 1 auto;
  min-height: 140px;
  max-height: 45dvh;
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
</style>