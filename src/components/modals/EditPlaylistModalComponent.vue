<template>
  <!-- modal -->
  <div class="modal fade" id="edit-playlist-modal" ref="editPlaylistModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 1000px;">
      <div class="modal-content shadow">

        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <strong class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis">
              Edit Playlist
            </strong>
          </div>
        </div>

        <div class="modal-body">
          <transition enter-active-class="animate__animated animate__fadeIn animate__faster">
            <!-- error message -->
            <div v-if="error" class="mb-2 p-2 small rounded bg-danger-subtle text-danger-emphasis">
              {{ error }}
            </div>
          </transition>

          <div class="d-flex flex-row">
            <!-- playlist info -->
            <div class="pe-3" style="flex: 1 1 0; min-width: 0;">
              <div class="vstack gap-2">
                <label class="small fw-semibold">Name</label>
                <input v-model="form.name" type="text" class="form-control form-control-sm" placeholder="Playlist Name">

                <label class="small fw-semibold">Description</label>
                <textarea v-model="form.description" class="form-control form-control-sm" rows="3"
                  placeholder="Playlist description"></textarea>

                <label class="small fw-semibold mb-0">Created By</label>
                <small>{{ createdByName }}</small>
              </div>
            </div>

            <!-- play sequence -->
            <div class="border-start px-3 d-flex flex-column gap-2" style="flex: 1 1 0; min-width: 0;">
              <label class="small fw-semibold">
                Play Sequence
                <span v-if="contentQueue.length > 0" class="text-muted">({{ contentQueue.length }})</span>
              </label>
              <!-- play sequence list -->
              <div class="content-queue small" @dragover.prevent="onContainerDragOver" @drop.prevent="onContainerDrop">
                <div v-for="(item, i) in queueItems" :key="item.id" class="queue-item"
                  :class="{ dragging: draggedId === item.id, 'drag-over': dragOverId === item.id && draggedId !== item.id }"
                  draggable="true" @dragstart="onDragStart(item, $event)" @dragover.prevent="onDragOver(item)"
                  @dragleave="onDragLeave(item)" @drop.prevent="onDrop(item)" @dragend="onDragEnd">
                  <span class="drag-handle" title="Drag to reorder">
                    <DragVertical />
                  </span>
                  <span class="sequence-badge" :title="i === 0 ? 'Plays first' : `Position ${i + 1}`">{{ i + 1 }}</span>
                  <div class="item-info">
                    <span class="fw-semibold">{{ item.filename }}</span>
                    <small class="text-muted">{{ item.title }}</small>
                  </div>
                  <button type="button" class="btn btn-sm border-0 p-0 shadow-none"
                    title="Remove from play sequence" @click="removeFromQueue(item.id)">
                    <Close class="text-danger" />
                  </button>
                </div>

                <!-- empty state -->
                <div v-if="queueItems.length === 0" class="empty-state">
                  No content in the play sequence yet.<br />
                  Use the plus button in the <em>Existing Content</em> list to add items here.
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
                    <span class="fw-semibold">{{ c.filename }}</span>
                    <small class="text-muted">{{ c.title }}</small>
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
        </div>

        <div class="modal-footer p-2">
          <button type="button" class="btn btn-sm btn-outline-danger me-2" @click="deletePlaylist" title="Delete">
            Delete
          </button>

          <button type="button" class="btn btn-sm btn-danger me-2" data-bs-dismiss="modal" title="Cancel">
            Cancel
          </button>

          <button :disabled="canSubmit" @click="submit" type="button" class="btn btn-sm btn-success"
            title="Save Playlist Changes">
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
import Plus from "vue-material-design-icons/Plus.vue";

export default {
  components: {
    Close,
    DragVertical,
    Plus
  },
  props: {
    playlist: Object,
    employees: Array
  },
  inject: ['toast'],
  emits: ['updated', 'deleted'],
  data() {
    return {
      error: '',
      content: [],
      form: {
        id: null,
        name: null,
        description: null,
        content: null,
        created_by: null
      },
      // ordered play sequence of content ids assigned to the playlist (index 0 = first slide)
      contentQueue: [],
      // native html drag and drop state
      draggedId: null,
      dragOverId: null
    }
  },
  methods: {
    async deletePlaylist() {
      try {
        if (!window.confirm('Are you sure you want to delete this playlist?')) return;
        await this.$axios.post(this.$api + 'playlists?delete', {
          id: parseInt(this.form.id)
        });
        this.$emit('deleted');
        this.toast.show("Playlist Deleted", "The playlist has been successfully deleted.", "bg-info-subtle text-info-emphasis");
      } catch (error) {
        console.error(error);
        this.toast.show("Error", "There was an error deleting the playlist.", "bg-danger-subtle text-danger-emphasis");
      } finally {
        this.$modal.hide('edit-playlist-modal');
      }
    },
    setPlaylist(playlist) {
      if (!playlist) return;
      this.form = {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        content: playlist.content,
        created_by: playlist.created_by
      };
      this.seedContentQueue(playlist.content);
    },
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
    addContentToQueue(item) {
      if (!item || item.id === undefined || item.id === null) return;
      const id = Number(item.id);
      if (Number.isNaN(id)) return;
      if (!this.contentQueue.includes(id)) {
        this.contentQueue.push(id);
      }
    },
    removeFromQueue(id) {
      const nid = Number(id);
      this.contentQueue = this.contentQueue.filter((q) => q !== nid);
      if (Number(this.draggedId) === nid) this.onDragEnd();
    },
    onDragStart(item, event) {
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
    },
    async submit() {
      try {
        this.error = '';
        if (!this.form.name || !this.form.name.trim()) return;

        // persist the ordered play sequence as a comma-separated string of content
        // ids (index 0 plays first), or null when no content is assigned
        this.form.content = this.contentQueue.length > 0 ? this.contentQueue.join(",") : null;

        if (!window.confirm('Are you sure you want to save these changes?\n\n' + JSON.stringify(this.form, null, 2))) return;

        await this.$axios.post(this.$api + 'playlists?update', { ...this.form });
        this.$emit('updated');
        this.$modal.hide('edit-playlist-modal');
        this.toast.show("Playlist Updated", "The playlist has been successfully updated.", "bg-success-subtle text-success-emphasis");
      } catch (error) {
        console.error(error);
        this.error = error?.response?.data?.message || error?.message || String(error);
      }
    }
  },
  computed: {
    /**
     * Resolves the ordered content ids in the queue to their full content
     * records (loaded from the `content?all` endpoint) for display.
     * Falls back to a placeholder row if an id is not present in the list.
     */
    queueItems() {
      return this.contentQueue.map((id) => (
        this.content.find((c) => Number(c.id) === id) || {
          id,
          filename: `Content #${id}`,
          title: "Missing from content list",
          type: "unknown"
        }
      ));
    },
    sortedContent() {
      return [...this.content].sort((a, b) => {
        if (a.filename === b.filename) return 0;
        return a.filename < b.filename ? -1 : 1
      })
    },
    createdByName() {
      return this.employees.find((e) => e.number === this.form.created_by)?.name;
    },
    canSubmit() {
      return !this.form.name || !this.form.name.trim();
    }
  },
  async mounted() {
    clearModalFocus(this.$refs.editPlaylistModal);

    this.content = (await this.$axios.get(this.$api + 'content?all')).data;

    // the playlist prop watcher can fire before the content list finishes loading,
    // so re-seed the play sequence now that it is available
    if (this.playlist) {
      this.seedContentQueue(this.playlist.content);
    }
  },
  watch: {
    playlist: {
      immediate: true,
      handler() {
        if (this.playlist) {
          this.setPlaylist(this.playlist);
        }
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

.item-info > span,
.item-info > small {
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
