<template>
  <!-- modal -->
  <div class="modal px-3 fade" id="edit-content-modal" ref="editContentModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
      <div class="modal-content shadow">

        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <strong class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis">
              {{ inGroup('HR Comms Supervisors') ? 'Properties' : 'Edit Content' }}
            </strong>
          </div>
        </div>

        <div class="modal-body overflow-hidden">
          <transition enter-active-class="animate__animated animate__fadeIn animate__faster">
            <!-- error message -->
            <div v-if="error" class="mb-2 p-2 small rounded bg-danger-subtle text-danger-emphasis">
              {{ error }}
            </div>
          </transition>

          <img :src="form.url" class="img-fluid mb-2" />

          <!-- read-only content info -->
          <div class="d-flex flex-column gap-2">
            <div class="row">
              <div class="col-6">
                <label class="small fw-semibold">Type</label><br />
                <span class="text-capitalize">
                  {{ displayValue(form.type) }}
                </span>
              </div>

              <div class="col-6">
                <label class="small fw-semibold">Title</label><br />
                <span class="small">{{ displayValue(form.title) }}</span>
              </div>
            </div>
            <div class="row">
              <div class="col-6">
                <label class="small fw-semibold d-block">URL</label>
                <small class="text-muted d-block text-truncate" :title="form.url">{{ displayValue(form.url) }}</small>
              </div>

              <div class="col-6">
                <label class="small fw-semibold d-block">Uploaded By</label>
                <span class="small">{{ authorName(form.uploaded_by) }}</span>
              </div>
            </div>
            <div class="row">
              <div class="col-6">
                <label class="small fw-semibold d-block">Created At</label>
                <span class="small">{{ formatTimestamp(form.created_at) }}</span>
              </div>
              <div class="col-6">
                <label class="small fw-semibold d-block">Updated At</label>
                <span class="small">{{ formatTimestamp(form.updated_at) }}</span>
              </div>
            </div>
          </div>

          <template v-if="!inGroup('HR Comms Supervisors')">
            <hr class="my-3" />

            <div class="d-flex flex-column">
              <!-- editable: status -->
              <label for="edit-content-status" class="small fw-semibold mb-1">Status</label>
              <select id="edit-content-status" v-model="form.status"
                class="col form-select form-select-sm text-capitalize">
                <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </template>

        </div>

        <div class="modal-footer p-2">
          <template v-if="inGroup('HR Comms HR') || inGroup('HR Comms System')">
            <button :disabled="!inGroup('HR Comms HR' || 'HR Comms System')" @click="deleteContent" type="button" class="me-auto btn btn-sm btn-danger me-2"
              data-bs-dismiss="modal">
              Delete
            </button>

            <button type="reset" class="btn btn-sm btn-secondary me-2" data-bs-dismiss="modal" title="Cancel">
              Cancel
            </button>

            <button :disabled="saving || !hasChanges" @click="saveChanges" type="submit" class="btn btn-sm btn-success"
              title="Save Status">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </template>
          <span v-else class="text-muted">&nbsp;</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clearModalFocus, inGroup, isOwner } from "@/common/helpers";

export default {
  name: "EditContentModalComponent",
  inject: ["toast", "store"],
  props: {
    content: {
      type: Object,
      default: null,
    },
    employees: {
      type: Array,
      default: null,
    },
  },
  emits: ["updated", "deleted"],
  data() {
    return {
      error: null,
      saving: false,
      form: {
        id: null,
        type: "",
        title: "",
        url: "",
        uploaded_by: "",
        status: "",
        created_at: "",
        updated_at: "",
      },
    };
  },
  computed: {
    statusOptions() {
      // statuses a content item can have in the approval workflow
      return ["inactive", "active", "archived"];
    },
    hasChanges() {
      return !!this.content && this.form.status !== this.content.status;
    },
  },
  watch: {
    content: {
      immediate: true,
      handler() {
        this.resetChanges();
      },
    },
  },
  mounted() {
    clearModalFocus(this.$refs.editContentModal);
  },
  methods: {
    inGroup,
    resetChanges() {
      const c = this.content ?? {};
      this.form = {
        id: c.id ?? null,
        type: c.type ?? "",
        title: c.title ?? "",
        url: c.url ?? "",
        uploaded_by: c.uploaded_by ?? "",
        status: c.status ?? "",
        created_at: c.created_at ?? "",
        updated_at: c.updated_at ?? "",
      };
      this.error = null;
    },
    authorName(empNum) {
      return this.employees.find((e) => e.number === empNum)?.name || "—";
    },
    displayValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      return value;
    },
    formatTimestamp(value) {
      if (!value) return "—";
      return new Date(value).toLocaleString();
    },
    contentTypeBadgeClass(type) {
      const map = {
        image: "bg-success-subtle text-success-emphasis text-capitalize",
        video: "bg-primary-subtle text-primary-emphasis text-capitalize",
        pdf: "bg-warning-subtle text-warning-emphasis text-capitalize",
        other: "bg-body-secondary text-muted text-capitalize",
      };
      return map[type?.toLowerCase()] || "bg-secondary text-secondary-emphasis text-capitalize";
    },
    statusBadgeClass(status) {
      const map = {
        pending: "bg-warning-subtle text-warning-emphasis",
        approved: "bg-success-subtle text-success-emphasis",
        rejected: "bg-danger-subtle text-danger-emphasis",
        active: "bg-success-subtle text-success-emphasis",
        inactive: "bg-danger-subtle text-danger-emphasis",
        archived: "bg-secondary-subtle text-secondary-emphasis",
      };
      return map[status?.toLowerCase()] || "bg-secondary text-secondary-emphasis";
    },
    async saveChanges() {
      // prevent duplicate submissions
      if (this.saving) return;
      this.error = null;

      if (!this.form.id) {
        this.error = "Missing content id. Please try again.";
        return;
      }
      if (!this.form.status) {
        this.error = "Please select a status.";
        return;
      }

      this.saving = true;
      try {
        if (!window.confirm("Are you sure you want to set the status of this content item to " + this.form.status + "?")) return;
        // only the status and id are sent - everything else is read-only
        await this.$axios.post(this.$api + "?content", {
          action: "update",
          id: parseInt(this.form.id),
          status: this.form.status
        });

        this.$emit("updated");
        this.$modal.hide("edit-content-modal");
        this.toast.show(
          "Content Updated",
          `The status of "${this.form.title}" is now "${this.form.status}".`,
          "bg-success-subtle text-success-emphasis"
        );
        this.resetChanges();
      } catch (error) {
        console.error("Error updating content status:", error);
        this.error = "There was an error updating the content status. Please try again.";
        this.toast.show(
          "Update Failed",
          "There was an error updating the content status.",
          "bg-danger-subtle text-danger-emphasis"
        );
      } finally {
        this.saving = false;
      }
    },
    async deleteContent() {
      try {
        if (!window.confirm("This file will be permanently deleted. Click OK to confirm.")) return;
        await this.$axios.post(this.$api + "?content", {
          action: "delete",
          id: parseInt(this.form.id)
        })
        this.$emit("deleted");
        this.$modal.hide("edit-content-modal");
        this.toast.show("Content Deleted", "The content has been successfully deleted.", "bg-info-subtle text-info-emphasis");
      } catch (error) {
        this.error = "There was an error deleting the content. Please try again.";
      }
    },
  },
};
</script>