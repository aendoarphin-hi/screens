<template>
  <div :id="`${$route.name}-view`" class="w-100 p-3">
    <!-- help modal -->
    <HelpModalComponent>
      <h5><strong>Approvals</strong></h5>
      <p>
        Content in <strong>{{ $appname }}</strong> is subject to an approval workflow before it can be shown on
        screens. When a user uploads content it is <em>not</em> immediately available; the upload enters the approval
        queue (<span class="badge bg-warning-subtle text-warning-emphasis">Pending</span>) until an HR reviewer
        decides its outcome.
      </p>
      <h5>Reviewing content</h5>
      <p>
        Accept a pending upload with
        <span class="btn btn-sm btn-success small" style="font-size: 10px;">
          <Check /> Approve
        </span>
        or send it back for revision with
        <span class="btn btn-sm btn-outline-danger small" style="font-size: 10px;">
          <Close /> Reject
        </span>.
        Clear the whole queue at once with
        <span class="btn btn-sm btn-success small" style="font-size: 10px;">
          <CheckAll /> Approve All
        </span>.
      </p>
      <h5>What happens after approval</h5>
      <p>Approved content becomes usable immediately: it appears in the content library (Screens &rarr; Content tab)
        and is ready to be added to a playlist&apos;s play sequence from the screen edit modal. Rejected content stays
        out
        of circulation until it is revised and resubmitted.</p>
      <h5>Group Permissions</h5>
      <small>
        <strong>HR</strong> - Review, approve, and reject content uploads<br />
        <strong>Supervisors</strong> - Upload content, which creates new entries in the approval queue
      </small>
    </HelpModalComponent>

    <!--  header + toolbar  -->
    <div class="hstack align-items-center flex-wrap position-sticky mb-3">
      <!-- header -->
      <div class="fs-5 fw-semibold text-capitalize d-flex align-items-center gap-2">
        <span>{{ $route.name }}</span>
        <span>
          <HelpCircleOutline data-bs-toggle="modal" data-bs-target="#help-modal" title="Help" class="cursor-pointer" />
        </span>
      </div>
      <!-- toolbar -->
      <div class="hstack ms-auto fw-semibold gap-2 text-nowrap flex-wrap">
        <div class="hstack gap-1 align-items-center" title="Filter the queue">
          <Filter class="text-muted" />
          <select v-model="statusFilter" class="form-select form-select-sm text-capitalize" style="width: 150px">
            <option value="">All Statuses</option>
            <option v-for="s in ['pending', 'approved', 'rejected']" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <button class="btn btn-sm btn-success" :disabled="pendingCount === 0" @click="approveAll">
          <CheckAll /> Approve All
        </button>
        <button class="btn btn-sm btn-outline-secondary" title="Restore demo data" @click="resetDemo">
          <Refresh /> Reset
        </button>
      </div>
    </div>

    <!-- workflow reminder -->
    <div class="card shadow-sm border-0 mb-3 d-flex flex-wrap">
      <div class="card-body">
        <div class="row g-3 align-items-stretch text-center">
          <div class="col-12 col-lg-4">
            <div class="hstack justify-content-center gap-2 fw-semibold">
              <UploadBox class="text-primary" />
              <span>1. Content Uploaded</span>
            </div>
            <small class="text-muted d-block mt-1">New uploads land in the approval queue and are <em>not</em> yet
              available for display.</small>
          </div>
          <div class="col-12 col-lg-4">
            <div class="hstack justify-content-center gap-2 fw-semibold">
              <ClipboardCheck class="text-warning" />
              <span>2. HR Review</span>
            </div>
            <small class="text-muted d-block mt-1">HR approves or rejects each pending submission in the queue
              below.</small>
          </div>
          <div class="col-12 col-lg-4">
            <div class="hstack justify-content-center gap-2 fw-semibold">
              <Television class="text-success" />
              <span>3. Approved &amp; Available</span>
            </div>
            <small class="text-muted d-block mt-1">Approved content becomes usable in the content list and play
              sequence editor.</small>
          </div>
        </div>
      </div>
    </div>

    <!-- summary stat cards -->
    <div class="row row-cols-1 row-cols-lg-4 gx-3 gy-3 gy-lg-0 small mb-3">
      <div v-for="s in statCards" :key="s.key" class="stat-card">
        <div role="button" tabindex="0" :title="'Filter: ' + s.label"
          class="card shadow-sm hstack align-items-center p-3 h-100 w-100"
          :style="statusFilter === s.key ? { border: '2px solid var(--bs-primary)' } : {}" @click="statusFilter = s.key"
          @keydown.enter="statusFilter = s.key">
          <span class="p-3 rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
            :class="s.iconClass">
            <component :is="s.icon" />
          </span>
          <span class="d-flex flex-column text-truncate">
            <span class="text-muted text-uppercase small lh-1 text-nowrap">{{ s.label }}</span>
            <span class="fs-3 fw-semibold lh-1">{{ s.value }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- approval queue -->
    <div class="card">
      <div class="col card-header bg-white d-flex justify-content-between align-items-center">
        <h6 class="mb-0 d-flex align-items-center gap-2 fw-semibold text-secondary">
          <span class="mb-1">
            <ClipboardCheck class="fs-5" />
          </span>
          Approval Queue
        </h6>
        <router-link :to="{ name: 'Screens', query: { tab: 'content' } }"
          class="small link-primary text-decoration-none">View content library&nbsp;&#9656;</router-link>
      </div>

      <div class="table-responsive">
        <table v-if="filteredItems.length" class="table table-hover align-middle mb-0">
          <thead class="table-light sticky-top shadow-sm text-nowrap">
            <tr class="text-uppercase">
              <th scope="col">Content</th>
              <th scope="col">Type</th>
              <th scope="col">Submitted By</th>
              <th scope="col">Submitted</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredItems" :key="c.id">
              <td>
                <div class="d-flex align-items-center gap-2 ps-2">
                  <component :is="getTypeIcon(c.type)" class="text-muted" style="font-size: 2rem" />
                  <div class="lh-sm min-w-0">
                    <div class="fw-semibold text-truncate" style="max-width: 380px">{{ c.title }}</div>
                    <small class="text-muted">{{ c.filename }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge text-uppercase" :class="contentTypeBadgeClass(c.type)">{{ c.type }}</span>
              </td>
              <td>
                <div class="lh-sm">
                  <div class="fw-semibold text-nowrap">{{ c.submitted_by }}</div>
                  <small class="text-muted text-nowrap">{{ c.location }}</small>
                </div>
              </td>
              <td>
                <span class="text-muted text-nowrap">{{ new Date(c.created_at).toLocaleString() }}</span>
              </td>
              <td>
                <span class="badge text-capitalize" :class="statusBadgeClass(c.status)">{{ c.status }}</span>
                <div v-if="c.status !== 'pending'" class="small text-muted text-nowrap lh-sm mt-1">
                  <div>{{ c.reviewed_by }} &middot; {{ new Date(c.reviewed_at).toLocaleString() }}</div>
                  <div v-if="c.status === 'rejected' && c.notes" class="text-danger overflow-hidden text-truncate" :title="c.notes" 
                  style="cursor: help; max-width: 300px;">
                    <InformationOutline class="me-1" />{{ c.notes }}
                  </div>
                </div>
              </td>
              <td class="text-end">
                <template v-if="c.status === 'pending'">
                  <div class="d-flex flex-row gap-2 flex-nowrap text-nowrap justify-content-end">
                    <button class="btn btn-sm btn-success" title="Approve content" @click="approve(c)">
                      <Check /> Approve
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Reject content" @click="reject(c)">
                      <Close /> Reject
                    </button>
                  </div>
                </template>
                <span v-else class="text-muted">&mdash;</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- empty state -->
        <div v-else class="py-5 d-flex flex-column align-items-center justify-content-center">
          <ClipboardCheck class="fs-1 text-muted" />
          <p class="text-muted mt-2 mb-0">{{ emptyMessage }}</p>
          <button v-if="statusFilter === '' || statusFilter === 'pending'" class="btn btn-sm btn-outline-secondary mt-3"
            @click="statusFilter = 'rejected'">
            View rejected items
          </button>
        </div>
      </div>

      <div class="card-footer bg-white d-flex align-items-center gap-2 small text-muted border-top">
        <InformationOutline class="flex-shrink-0" />
        <span>
          Static preview. Approved content becomes usable and appears in the content library (Screens &rarr; Content),
          ready for a play sequence in the screen edit modal. Rejected items are returned to the submitter for
          revision.
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import HelpCircleOutline from "vue-material-design-icons/HelpCircleOutline.vue";
import Filter from "vue-material-design-icons/Filter.vue";
import Refresh from "vue-material-design-icons/Refresh.vue";
import ClockOutline from "vue-material-design-icons/ClockOutline.vue";
import CheckCircle from "vue-material-design-icons/CheckCircle.vue";
import CloseCircle from "vue-material-design-icons/CloseCircle.vue";
import ClipboardCheck from "vue-material-design-icons/ClipboardCheck.vue";
import UploadBox from "vue-material-design-icons/UploadBox.vue";
import Television from "vue-material-design-icons/Television.vue";
import Check from "vue-material-design-icons/Check.vue";
import CheckAll from "vue-material-design-icons/CheckAll.vue";
import Close from "vue-material-design-icons/Close.vue";
import Image from "vue-material-design-icons/Image.vue";
import Video from "vue-material-design-icons/Video.vue";
import FilePdfBox from "vue-material-design-icons/FilePdfBox.vue";
import FileDocument from "vue-material-design-icons/FileDocument.vue";
import InformationOutline from "vue-material-design-icons/InformationOutline.vue";
import { store } from "@/common/store";

// static HR reviewer shown on processed items (demo only - no API integration)
const REVIEWER = store.authenticated.name;

export default {
  name: "ApprovalsView",
  components: {
    HelpCircleOutline,
    Filter,
    Refresh,
    ClockOutline,
    CheckCircle,
    CloseCircle,
    ClipboardCheck,
    UploadBox,
    Television,
    Check,
    CheckAll,
    Close,
    Image,
    Video,
    FilePdfBox,
    FileDocument,
    InformationOutline,
  },
  data() {
    // entirely static demo data - mirrors uploaded content awaiting HR review
    const demoApprovals = [
      {
        id: 1,
        title: "Lockout/Tagout Safety Poster",
        filename: "loto-safety-poster_v2.jpg",
        type: "image",
        status: "pending",
        created_at: "2026-09-19T14:41:00",
        submitted_by: "Marcus Webb",
        location: "Maintenance - Plant 2",
      },
      {
        id: 2,
        title: "New Hire Orientation Video v2",
        filename: "orientation-v2.mp4",
        type: "video",
        status: "pending",
        created_at: "2026-09-18T10:12:00",
        submitted_by: "Danielle Cruz",
        location: "Human Resources",
      },
      {
        id: 3,
        title: "Q3 Facilities Newsletter",
        filename: "q3-facilities-newsletter.pdf",
        type: "pdf",
        status: "pending",
        created_at: "2026-09-17T16:05:00",
        submitted_by: "Raymond Ortiz",
        location: "Facilities",
      },
      {
        id: 4,
        title: "Welding PPE Reminder",
        filename: "welding-ppe.jpg",
        type: "image",
        status: "pending",
        created_at: "2026-09-17T09:30:00",
        submitted_by: "Priya Shah",
        location: "EHS / Safety",
      },
      {
        id: 5,
        title: "QA Inspection Quick Guide",
        filename: "qa-inspection-guide.pdf",
        type: "pdf",
        status: "approved",
        created_at: "2026-09-15T15:20:00",
        submitted_by: "Tanya Reed",
        location: "Quality Control",
        reviewed_by: REVIEWER,
        reviewed_at: "2026-09-16T08:40:00",
      },
      {
        id: 6,
        title: "Fall Safety Bingo Cards",
        filename: "fall-bingo-cards.pptx",
        type: "other",
        status: "rejected",
        created_at: "2026-09-14T11:05:00",
        submitted_by: "Jonah Martinez",
        location: "Safety Committee",
        reviewed_by: REVIEWER,
        reviewed_at: "2026-09-15T07:55:00",
        notes: "Please replace the company logo with the current brand asset and resubmit.",
      },
      {
        id: 7,
        title: "QA Inspection Quick Guide",
        filename: "qa-inspection-guide.pdf",
        type: "pdf",
        status: "approved",
        created_at: "2026-09-15T15:20:00",
        submitted_by: "Tanya Reed",
        location: "Quality Control",
        reviewed_by: REVIEWER,
        reviewed_at: "2026-09-16T08:40:00",
      },
    ];

    return {
      statusFilter: "", // "", pending, approved, rejected
      demoApprovals,
      approvals: demoApprovals.map((a) => ({ ...a })), // working copy
    };
  },
  computed: {
    pendingCount() {
      return this.approvals.filter((a) => a.status === "pending").length;
    },
    approvedCount() {
      return this.approvals.filter((a) => a.status === "approved").length;
    },
    rejectedCount() {
      return this.approvals.filter((a) => a.status === "rejected").length;
    },
    statCards() {
      return [
        {
          key: "",
          label: "Total Submissions",
          value: this.approvals.length,
          icon: ClipboardCheck,
          iconClass: "bg-primary-subtle text-primary-emphasis",
        },
        {
          key: "pending",
          label: "Pending Review",
          value: this.pendingCount,
          icon: ClockOutline,
          iconClass: "bg-warning-subtle text-warning-emphasis",
        },
        {
          key: "approved",
          label: "Approved",
          value: this.approvedCount,
          icon: CheckCircle,
          iconClass: "bg-success-subtle text-success-emphasis",
        },
        {
          key: "rejected",
          label: "Rejected",
          value: this.rejectedCount,
          icon: CloseCircle,
          iconClass: "bg-danger-subtle text-danger-emphasis",
        },
      ];
    },
    filteredItems() {
      let result = [...this.approvals];
      if (this.statusFilter) {
        result = result.filter((a) => a.status === this.statusFilter);
      }
      // pending first, then newest uploads first
      return result.sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        if (a.status === "pending") return -1;
        if (b.status === "pending") return 1;
        return 0;
      });
    },
    emptyMessage() {
      switch (this.statusFilter) {
        case "pending":
          return "All caught up! No content is waiting for review.";
        case "approved":
          return "No approved content yet. Approve pending items to see them here.";
        case "rejected":
          return "No rejected content. Nice, clean review record!";
        default:
          return "No approvals match the current filter.";
      }
    },
  },
  methods: {
    approve(a) {
      if (a.status !== "pending") return;
      a.status = "approved";
      a.reviewed_by = REVIEWER;
      a.reviewed_at = new Date().toISOString();
      a.notes = "";
    },
    reject(a) {
      if (a.status !== "pending") return;
      a.status = "rejected";
      a.reviewed_by = REVIEWER;
      a.reviewed_at = new Date().toISOString();
      a.notes = a.notes || "Requested changes. Please revise and resubmit.";
    },
    approveAll() {
      this.approvals.forEach((a) => {
        if (a.status === "pending") {
          this.approve(a);
        }
      });
    },
    resetDemo() {
      // restore the original static data so the demo can be replayed
      this.approvals = this.demoApprovals.map((a) => ({ ...a }));
      this.statusFilter = "";
    },
    statusBadgeClass(status) {
      const map = {
        pending: "bg-warning-subtle text-warning-emphasis",
        approved: "bg-success-subtle text-success-emphasis",
        rejected: "bg-danger-subtle text-danger-emphasis",
      };
      return map[status] || "bg-secondary text-secondary-emphasis";
    },
    contentTypeBadgeClass(type) {
      const map = {
        image: "bg-success-subtle text-success-emphasis",
        video: "bg-primary-subtle text-primary-emphasis",
        pdf: "bg-warning-subtle text-warning-emphasis",
        other: "bg-body-secondary text-muted",
      };
      return map[type] || "bg-body-secondary text-muted";
    },
    getTypeIcon(type) {
      console.log(type);
      switch (type) {
        case "image":
          return Image;
        case "video":
          return Video;
        case "pdf":
          return FilePdfBox;
        default:
          return FileDocument;
      }
    },
  },
};
</script>

<style scoped>
/* constrain scroll area: table rows scroll vertically instead of pushing the whole page */
.table-responsive {
  max-height: 60dvh;
  overflow-y: auto;
}

table tr, table tr .btn {
  font-size: clamp(0.5rem, 1.2vw, .8rem);
}
</style>