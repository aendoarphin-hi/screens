<template>
  <div v-if="!loading" :id="`${$route.name}-view`" class="w-100 p-3">
    <!-- help modal -->
    <HelpModalComponent>
      <h5><strong>HAYDEN</strong> {{ $appname }}</h5>
      <p>
        In the dashboard, you can view a summary of recent changes to events and track the status of screens. Each
        section also contains direct links to
        a destination.
        Use the toolbar on the top right to create new announcements, upload content, or issue an emergency alert.
      </p>
    </HelpModalComponent>

    <!--  header + toolbar  -->
    <div class="hstack align-items-center flex-wrap mb-4">
      <!-- header -->
      <div class="fs-5 fw-semibold text-capitalize d-flex align-items-center gap-2">
        <span>{{ $route.name }}</span>
        <span>
          <HelpCircleOutline data-bs-toggle="modal" data-bs-target="#help-modal" title="Help" class="cursor-pointer" />
        </span>
      </div>
      <!-- toolbar -->
      <div class="hstack ms-auto fw-semibold gap-2 text-nowrap flex-wrap">
        <button class="btn btn-sm btn-success" @click="openCreateModal">+ Create Announcement</button>
        <button class="btn btn-sm btn-primary" @click="openUploadModal">
          <UploadBox /> Upload Content
        </button>
        <button class="btn btn-sm btn-danger" @click="open">
          <ExclamationThick /> Issue Emergency Alert
        </button> <!-- not same as events; do something that is immediate -->
      </div>
    </div>

    <!--  KPI stat cards  -->
    <div class="row g-3 mb-4">
      <RouterLink v-for="s in quickStats" :key="s.title"
        :to="s.title === 'approvals' ? 'approvals' : { name: 'Screens', query: { tab: s.title } }"
        class="col-12 col-md-6 col-lg-3 text-decoration-none">
        <div class="card shadow-sm border border-0 hstack h-100">
          <div class="card-body hstack align-items-start">
            <div class="col cursor-pointer">
              <div class="text-muted text-uppercase hstack text-fluid">
                <component :is="s.icon" />&nbsp;&nbsp;{{ s.title }}
              </div>
              <h2 class="fw-semibold lh-1">{{
                s.title === 'screens'
                  ? screens.length
                  : s.title === 'content'
                    ? content.length
                    : s.title === 'playlists'
                      ? playlists.length
                      : s.title === 'approvals'
                        ? approvals.length
                        : 0
              }}</h2>
            </div>
            <div class="text-muted text-fluid gap-1 align-self-start d-flex flex-column my-auto cursor-pointer">
              <div v-for="d in subStats(s.title)" :key="'stat-' + d.label"
                class="badge badge-pill align-items-center justify-content-end rounded d-flex text-uppercase fw-semibold"
                :class="`text-${d.color} bg-${d.bgColor} ${d.value === 0 ? 'd-none' : ''}`"><span class="me-auto">{{
                  d.label }}</span>&nbsp;&nbsp;&nbsp;{{ d.value }}</div>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>

    <!--  main content + sidebar  -->
    <div class="row g-4">

      <!--  main content column  -->
      <div class="col-12 col-lg-8">

        <!--  announcements  -->
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h6 class="mb-0 d-flex align-items-center gap-2 fw-semibold text-secondary">
              <span class="mb-1">
                <Bullhorn class="fs-5" />
              </span>
              Upcoming Announcements
            </h6>
            <router-link :to="{ name: 'Calendar', query: { type: 'announcement' } }"
              class="small link-primary text-decoration-none">More&nbsp;▸</router-link>
          </div>
          <ul v-if="upcomingAnnouncements.length" class="list-group list-group-flush">
            <li v-for="(a, i) in upcomingAnnouncements" :key="i" class="list-group-item small d-flex align-items-center gap-3"
              :class="i === 0 ? 'border-4' : ''">
              <div class="flex-grow-1 min-w-0">
                <div class="fw-semibold text-truncate text-uppercase">{{ a.title }}</div>
                <div class="text-muted small">
                  <span v-if="a.location" class="text-capitalize me-2">
                    <MapMarker /> {{ a.location }}
                  </span>
                  <span v-if="a.start">
                    <Calendar /> {{ new Date(a.start).toDateString() === new Date().toDateString() ? 'Today' : new Date(a.start).toDateString() }}
                  </span>
                </div>
              </div>
              <span class="badge rounded-pill text-capitalize" :class="announcementBadgeClass(a.subtype)">
                {{ a.subtype }}
              </span>
            </li>
          </ul>
          <div v-else class="card-body my-5 d-flex align-items-center justify-content-center text-muted">
            <small>Nothing Scheduled</small>
          </div>
        </div>

        <!--  Recent uploads (media posts)  -->
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h6 class="mb-0 d-flex align-items-center gap-2 fw-semibold text-secondary">
              <span class="mb-1">
                <UploadBox class="fs-5" />
              </span>
              Recent Uploads
            </h6>
            <router-link :to="{ name: 'Screens', query: { tab: 'content' } }"
              class="small link-primary text-decoration-none">More
              &nbsp;▸</router-link>
          </div>
          <div class="card-body" v-if="recentUploads.length">
            <div class="row g-3">
              <template v-if="recentUploads.length > 0">
                <div v-for="(u, i) in recentUploads" :key="i" class="col col-md-6">
                  <div class="d-flex align-items-center gap-3">
                    <div class="upload-icon rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center">
                      📄
                    </div>
                    <div class="overflow-hidden">
                      <div class="fw-semibold text-uppercase text-nowrap text-truncate">{{ u.title }}</div>
                      <div class="text-muted small">{{ u.filename }} &middot; {{ new Date(u.created_at).toDateString()
                      }}</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <div v-else class="card-body my-5 d-flex align-items-center justify-content-center text-muted">
            <small>No Recent Uploads</small>
          </div>
        </div>

      </div>

      <!--  sidebar column  -->
      <div class="col-12 col-lg-4">

        <!--  people (events)  -->
        <div class="card shadow-sm mb-4 border-0">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h6 class="text-secondary card-title mb-0 d-flex align-items-center gap-2 fw-semibold">
              <span class="mb-1">
                <People class="fs-5" />
              </span>
              People
            </h6>
            <router-link to="/calendar" class="small link-primary text-decoration-none">More
              &nbsp;▸</router-link>
          </div>
          <ul v-if="employeeEvents.length" class="list-group list-group-flush"
            style="max-height: 400px; overflow-y: auto">
            <li v-for="(e, i) in employeeEvents" :key="i" class="list-group-item small d-flex align-items-center gap-2">
              <div class="fs-5">
                <span v-if="e.subtype === 'birthday'">🎂</span>
                <span v-else-if="e.subtype === 'anniversary'">🎉</span>
                <span v-else-if="e.subtype === 'promotion'">📈</span>
                <span v-else-if="e.subtype === 'new hire'">💼</span>
              </div>&nbsp;
              <div class="d-flex flex-column text-capitalize">
                <div class="fw-semibold text-uppercase">{{ e.title }}</div>
                <div class="text-muted text-nowrap me-1 small">
                  {{ new Date(e.start).toDateString() }}
                </div>
              </div>
            </li>
          </ul>
          <div v-else class="card-body my-5 d-flex align-items-center justify-content-center text-muted">
            <small>No Employee Events</small>
          </div>
        </div>

        <!--  recent activity  -->
        <div class="card shadow-sm mb-4 border-0">
          <div class="card-header bg-white d-flex align-items-center">
            <h6 class="mb-0 d-flex align-items-center gap-2 fw-semibold text-secondary">
              <span class="mb-1">
                <ClockOutline class="fs-5" />
              </span>
              Recent Activity
            </h6>
          </div>
          <div class="timeline">
            <div v-if="recentActivity.length">
              <div v-for="a in recentActivity" :key="a.id" class="timeline-item">
                <div class="timeline-content p-3">
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="activity-avatar rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-uppercase">
                      {{ a.name[0] }}
                    </span>
                    <div class="lh-sm small">
                      <span class="fw-semibold">{{ a.name }}</span> {{ activityDescription(a) }}
                    </div>
                    <div class="text-muted small text-nowrap ms-auto">{{ formatTimeAgo(a.created_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="card-body my-5 d-flex align-items-center justify-content-center text-muted">
              <small>No Recent Activity</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    <CreateEventModalComponent />
  </div>
  <div v-else class="d-flex justify-content-center align-items-center">
    <LoadingComponent message="Loading dashboard..." />
  </div>
</template>

<script>
import Television from "vue-material-design-icons/Television.vue";
import AccountCircle from "vue-material-design-icons/AccountCircle.vue";
import PlaylistPlay from "vue-material-design-icons/PlaylistPlay.vue";
import Alert from "vue-material-design-icons/Alert.vue";
import UploadBox from "vue-material-design-icons/UploadBox.vue";
import Bullhorn from "vue-material-design-icons/Bullhorn.vue";
import Magnify from "vue-material-design-icons/Magnify.vue";
import MapMarker from "vue-material-design-icons/MapMarker.vue";
import CalendarMonth from "vue-material-design-icons/CalendarMonth.vue";
import ClockOutline from "vue-material-design-icons/ClockOutline.vue";
import People from "vue-material-design-icons/AccountGroup.vue";
import HelpCircleOutline from "vue-material-design-icons/HelpCircleOutline.vue";
import FileDocument from "vue-material-design-icons/FileDocument.vue";
import Calendar from "vue-material-design-icons/Calendar.vue";
import ExclamationThick from "vue-material-design-icons/ExclamationThick.vue";

import CreateEventModalComponent from "@/components/modals/CreateEventModalComponent.vue";

import { markRaw } from "vue";
import { formatTimeAgo } from "@/common/helpers";

export default {
  name: "DashboardView",
  components: {
    Magnify,
    MapMarker,
    CalendarMonth,
    Bullhorn,
    UploadBox,
    Alert,
    PlaylistPlay,
    AccountCircle,
    Television,
    ClockOutline,
    People,
    HelpCircleOutline,
    FileDocument,
    Calendar,
    ExclamationThick,

    CreateEventModalComponent,
  },

  data() {
    return {
      activity: [],
      events: [],
      screens: [],
      playlists: [],
      content: [],
      approvals: [],
      employees: [],

      loading: false,
      quickStats: [],
      needsAttention: [],
    };
  },
  methods: {
    openCreateModal() {
      this.$modal.show('create-event-modal');
    },
    formatTimeAgo,
    setValue() {
      this.store.authenticated = false;
      window.alert(this.store.authenticated);
    },
    handleScroll() {
      const currentScrollY = window.scrollY;
      if (currentScrollY > this.lastScrollY) {
        this.scrollingDown = true;
      } else {
        this.scrollingDown = false;
      }
      this.lastScrollY = currentScrollY;
    },
    announcementBadgeClass(status) {
      return (
        {
          general: "text-primary-emphasis bg-primary-subtle",
          urgent: "text-danger-emphasis bg-danger-subtle",
          maintenance: "text-muted bg-body-secondary",
          production: "text-success-emphasis bg-success-subtle",
          weather: "text-warning-emphasis bg-warning-subtle",
          safety: "text-info-emphasis bg-info-subtle",

        }[status] || "visually-hidden"
      );
    },
    subStats(title) {
      let statSet = [];
      if (title === "screens") {
        statSet = [
          {
            label: 'Online',
            value: this.screens.filter((d) => d.status === 'online').length,
            color: 'success-emphasis',
            bgColor: 'success-subtle'
          },
          {
            label: 'Offline',
            value: this.screens.filter((d) => d.status === 'offline').length,
            color: 'danger-emphasis',
            bgColor: 'danger-subtle'

          },
          {
            label: 'Disabled',
            value: this.screens.filter((d) => d.status === 'disabled').length,
            color: 'muted',
            bgColor: 'body-secondary'

          }
        ];
      } else if (title === "approvals") {
        statSet = [
          {
            label: 'Approved',
            value: this.approvals.filter((a) => a.status === 'approved').length,
            color: 'success-emphasis',
            bgColor: "success-subtle"
          },
          {
            label: 'Pending',
            value: this.approvals.filter((a) => a.status === 'pending').length,
            color: 'warning-emphasis',
            bgColor: "warning-subtle"
          },
          {
            label: 'Rejected',
            value: this.approvals.filter((a) => a.status === 'rejected').length,
            color: 'danger-emphasis',
            bgColor: "danger-subtle"
          }
        ];
      }
      return statSet;
    },
    activityDescription(a) {
      // affected record is stored in the entity_json column in activity table
      const desc = JSON.parse(a.entity_json).title;
      return `${a.action}d ${a.entity_type}: ${desc}`;
    },
    recentEvents() {
      return this.events
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .filter((event) => new Date(event.start) >= new Date());
    },
  },
  computed: {
    recentUploads() {
      return [...this.content]
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 5);
    },
    recentActivity() {
      return this.activity.map((a) => {
        const employee = this.employees.find((e) => parseInt(e.number) === parseInt(a.enum));
        return {
          ...a,
          name: employee ? employee.name : "Unknown",
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    },
    employeeEvents() { // sort by event end date where the upcoming one is first, dont include past events
      return this.events.filter((event) => event.type === "employee" && new Date(event.end) >= new Date())
        .sort((a, b) => new Date(a.end) - new Date(b.end)).slice(0, 4);
    },
    upcomingAnnouncements() {
      return this.events
        .filter((event) => event.type === "announcement" && event.subtype !== "weather" && new Date(event.end) >= new Date())
        .sort((a, b) => new Date(a.end) - new Date(b.end))
        .slice(0, 5);
    },
  },
  async mounted() {
    try {
      this.loading = true;

      const states = [
        "activity",
        "events",
        "screens",
        "playlists",
        "content",
        "approvals",
        "employees"
      ];

      await Promise.all(
        states.map(async d => {
          this[d] = (await this.$axios.get(this.$api + d + "?all")).data;
        })
      );

      this.quickStats = [
        {
          title: "screens",
          icon: markRaw(Television),
          color: "success",
          stat: {},
        },
        {
          title: "content",
          icon: markRaw(FileDocument),
          color: "danger",
          stat: {},
        },
        {
          title: "playlists",
          icon: markRaw(PlaylistPlay),
          color: "secondary",
          stat: {},
        },
        {
          title: "approvals",
          icon: markRaw(ClockOutline),
          color: "primary",
          stat: {},
        }]

      this.quickStats.forEach(({ title, stat: { online, offline, disabled, pending, approved, rejected } }) => {
        if (title === "screens") {
          online = this.screens.filter((d) => d.status === "online").length;
          offline = this.screens.filter((d) => d.status === "offline").length;
          disabled = this.screens.filter((d) => d.status === "disabled").length;
        }
        if (title === "approvals") {
          pending = this.approvals.filter((a) => a.status === "pending").length;
          approved = this.approvals.filter((a) => a.status === "approved").length;
          rejected = this.approvals.filter((a) => a.status === "rejected").length;
        }
      })

      this.loading = false;
    } catch {
      console.log("No events found")
    }
  },

  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
};
</script>

<style scoped>
#dashboard-view {
  min-height: 100%;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.scrollable-list {
  max-height: 340px;
  overflow-y: auto;
}

.list-group-item:nth-child(even) {
  background: var(--bs-light);
}

.list-group-item:nth-child(odd) {
  background: white;
}

/* kpi stat icon */
.stat-icon {
  width: 40px;
  height: 40px;
}

/* upload icon */
.upload-icon {
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
  background: var(--bs-light);
  border: 1px solid var(--bs-border-color, #dee2e6);
}

/* activity bar */
.activity-avatar {
  width: 28px;
  height: 28px;
  font-size: 0.8rem;
  background: var(--bs-secondary-bg-subtle);
}

/* attention dot */
.attention-dot {
  width: 8px;
  height: 8px;
  background: var(--bs-warning);
}

/* timeline styles */
.timeline-item {
  position: relative;
}

.timeline-item:last-child .timeline-content {
  padding-bottom: 0;
}

.timeline-content {
  padding-left: 0.5rem;
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.timeline-item:last-child .timeline-content {
  border-bottom: none;
}
</style>