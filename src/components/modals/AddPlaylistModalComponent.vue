<template>
  <div class="modal fade" id="add-playlist-modal" ref="addPlaylistModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
      <div class="modal-content shadow">
        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <strong class="text-nowrap overflow-hidden me-4" style="text-overflow: ellipsis">
              Create New Playlist
            </strong>
          </div>
        </div>
        <div class="modal-body">
          
        </div>
        <div class="modal-footer p-2">
          <button type="reset" class="btn btn-sm btn-danger me-2" data-bs-dismiss="modal" @click="clearChanges"
            title="Cancel">
            Cancel
          </button>

          <button type="submit" class="btn btn-sm btn-success" title="Add PLaylist">
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
  components: {
  },
  mounted() {
    clearModalFocus(this.$refs.addPlaylistModal);
  },
  data() {
    return {
      error: null,
      files: []
    }
  },
  computed: {
  },
  methods: {
    addPlaylist() {
      window.alert('todo: add playlist');
    },
  }
}
</script>