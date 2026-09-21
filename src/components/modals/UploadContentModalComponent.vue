<template>
  <div class="modal fade" id="upload-content-modal" ref="uploadContentModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
      <div class="modal-content shadow">
        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <strong class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis">
              Submit Content
            </strong>
          </div>
        </div>
        <div class="modal-body">
          <!-- help description -->
          <p class="lh-sm">Submit (jpg, jpeg, png, pdf) files so they can be added to a playlist and assigned to
            screens.</p>
          <p style="font-size: 8pt;" class="text-muted lh-sm fst-italic small">NOTE: If submitted by a user in
            the 'Supervisors' group, HR will need to approve the files before it becomes available</p>
          <transition enter-active-class="animate__animated animate__fadeIn animate__faster">
            <!-- error message -->
            <div v-if="error" class="mb-2 p-2 small rounded bg-danger-subtle text-danger-emphasis">
              {{ error }}
            </div>
          </transition>

          <!-- file upload -->
          <!-- TODO: add a drag and drop area to upload files -->
          <div class="mb-2">
            <input ref="fileInput" id="upload-content-file" type="file" accept=".jpg,.jpeg,.png,.pdf" multiple
              class="form-control form-control-sm" @change="onFilesSelected" />
            <small class="text-muted d-block">Select one or more .jpg, .jpeg, .png, or .pdf files to submit.</small>
          </div>
          <div class="d-flex flex-wrap mb-2 gap-1">
            <span v-for="s in submittedFiles" :key="s"
              class="badge rounded-pill bg-primary-subtle text-primary-emphasis me-1">{{ s }}</span>
          </div>
        </div>
        <div class="modal-footer p-2">
          <button type="reset" class="btn btn-sm btn-danger me-2" data-bs-dismiss="modal" @click="clearChanges"
            title="Cancel">
            Cancel
          </button>

          <button :disabled="uploading || files.length === 0" @click="upload" type="submit"
            class="btn btn-sm btn-success" title="Upload Content">
            <span v-if="uploading" class="spinner-border spinner-border-sm me-1" role="status"
              aria-hidden="true"></span>
            {{ uploading ? 'Uploading...' : '+ Upload' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clearModalFocus } from '@/common/helpers';

export default {
  components: {
  },
  inject: ["toast", "store"],
  emits: ["uploaded"],
  mounted() {
    clearModalFocus(this.$refs.uploadContentModal);
  },
  data() {
    return {
      error: null,
      files: [],
      uploading: false
    }
  },
  computed: {
    submittedFiles() {
      return this.files?.map(file => file.name) || 'No files selected';
    }
  },
  methods: {
    clearChanges() {
      this.files = [];
      this.error = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },
    onFilesSelected(event) {
      this.files = Array.from(event.target.files ?? []);
      this.error = null;
    },
    getContentType(file) {
      const ext = String(file.name).split('.').pop().toLowerCase();
      return ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? 'image' : 'pdf';
    },
    async upload() {
      // prevent duplicate submissions while a batch is in progress
      if (this.uploading) return;
      this.error = null;

      // verify that at least one file has been selected
      if (this.files.length === 0) {
        this.error = 'No files selected. Please choose at least one file to upload.';
        return;
      }

      this.uploading = true;
      const uploaded = [];
      const failed = [];

      try {
        for (const file of this.files) {
          const formData = new FormData();
          formData.append('action', 'upload');
          formData.append('file', file);
          formData.append('title', file.name);
          formData.append('type', this.getContentType(file));
          formData.append('uploaded_by', parseInt(this.store.authenticated.number));

          try {
            await this.$axios.post(this.$api + 'content', formData);
            uploaded.push(file);
          } catch (error) {
            console.error(error);
            failed.push(file.name);
          }
        }

        if (failed.length === 0) {
          // all files uploaded successfully
          this.toast.show(
            "Content Uploaded",
            `${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded successfully.`,
            "bg-success-subtle text-success-emphasis"
          );
          this.clearChanges();
          this.$modal.hide('upload-content-modal');
          this.$emit('uploaded');
        } else if (uploaded.length === 0) {
          // every upload failed - keep the modal open with an error
          this.error = `Failed to upload: ${failed.join(', ')}. Please try again.`;
          this.toast.show("Upload Failed", "There was an error uploading the selected file(s).", "bg-danger-subtle text-danger-emphasis");
        } else {
          // partial success - keep the modal open so only the failed files remain
          this.files = this.files.filter((file) => !uploaded.includes(file));
          this.error = `Failed to upload: ${failed.join(', ')}. Please try again.`;
          this.toast.show(
            "Partially Uploaded",
            `${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded, ${failed.length} failed.`,
            "bg-warning-subtle text-warning-emphasis"
          );
          // some content was uploaded, so refresh the content list
          this.$emit('uploaded');
        }
      } finally {
        this.uploading = false;
      }
    },
  }
}
</script>