<template>
  <div v-if="!initializing" :id="`${$route.name}-view`" class="w-100 p-3">
    <!-- help modal -->
    <HelpModalComponent>
      <p>
        The calendar is used <strong>ONLY</strong> to schedule screen content for a specific date and time.
        Below is a list of possible event types and subtypes.
      </p>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light sticky-top shadow-sm">
            <tr class="small text-uppercase">
              <th scope="col">Types</th>
              <th scope="col">Subtypes</th>
            </tr>
          </thead>
          <tbody class="table-group-divider text-capitalize">
            <tr v-for="t in Object.keys(eventTypes)" :key="t">
              <td>{{ t }}</td>
              <td>{{ eventTypes[t].join(', ') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </HelpModalComponent>
    <!--  header + toolbar  -->
    <div class="hstack align-items-center flex-wrap position-sticky">
      <!-- header -->
      <div class="fs-5 fw-semibold text-capitalize d-flex align-items-center gap-2">
        <span>{{ $route.name }}</span>
        <span>
          <HelpCircleOutline data-bs-toggle="modal" data-bs-target="#help-modal" title="Help" class="cursor-pointer" />
        </span>
      </div>
      <!-- toolbar -->
      <div class="hstack ms-auto fw-semibold gap-2 text-nowrap flex-wrap">
        <div class="btn btn-sm btn-success" @click="openCreateEvent">
          + Create Event
        </div>
      </div>
    </div>
    <!-- filters -->
    <div class="card p-3 mt-3">
      <div class="hstack gap-2 small align-items-center">
        <!-- mdi filter icon-->
        <span class="hstack align-items-center"><span class="me-1">
            <Filter class="cursor-pointer" />
          </span><span>Filters</span></span>
        <select class="form-select form-select-sm text-capitalize" v-model="filters.events.type">
          <option value="">All Types</option>
          <option v-for="t in typeFilters" :key="t" :value="t">{{ t }}</option>
        </select>
        <select :disabled="filters.events.type.length === 0" class="form-select form-select-sm text-capitalize"
          v-model="filters.events.subtype">
          <option value="">All Subtypes</option>
          <option v-for="st in availableSubtypes" :key="st" :value="st">
            {{ st }}
          </option>
        </select>
        <button :disabled="filters.events.type.length === 0 && filters.events.subtype.length === 0"
          @click="clearFilters" class="btn btn-outline-secondary btn-sm" title="Clear Filters">
          <FilterOffOutline />
        </button>
      </div>
    </div>
    <!--  calendar  -->
    <div id="calendar-container" class="card p-3 mt-3">
      <FullCalendar ref="calendar" :range="selectedDateRange" :options="calendarOptions" />
    </div>
    <!--  modals  -->
    <EditEventModalComponent :event="selectedEvent" @edited="refreshCalendar" @deleted="refreshCalendar" />
    <CreateEventModalComponent :range="selectedDateRange" @created="refreshCalendar" />
    <!-- pop over create button on date drag -->
    <div :hidden="!showPopover" @click="openCreateEvent" class="btn btn-sm btn-success small text-nowrap"
      id="create-event-popover"
      :style="{ left: dragged.style.left, top: dragged.style.top, position: 'absolute', zIndex: 999 }">
      + New Event
    </div>
  </div>
  <div v-else class="d-flex justify-content-center align-items-center">
    <LoadingComponent message="Loading calendar..." />
  </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'

import themePlugin from '@fullcalendar/vue3/themes/breezy'
import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import timeGridPlugin from '@fullcalendar/vue3/timegrid'
import listPlugin from '@fullcalendar/vue3/list'
import interactionPlugin from '@fullcalendar/vue3/interaction'

// Styles
import '@fullcalendar/vue3/skeleton.css'
import '@fullcalendar/vue3/themes/breezy/theme.css'
import '@/assets/styles/hayden.css'
import EditEventModalComponent from '@/components/modals/EditEventModalComponent.vue'
import CreateEventModalComponent from '@/components/modals/CreateEventModalComponent.vue'
import { nextTick } from 'vue'
import HelpCircleOutline from 'vue-material-design-icons/HelpCircleOutline.vue'
import Filter from "vue-material-design-icons/Filter.vue"
import FilterOffOutline from "vue-material-design-icons/FilterOffOutline.vue"
import { eventTypes } from '@/common/constants'

export default {
  name: 'CalendarView',

  components: {
    FullCalendar,
    EditEventModalComponent,
    CreateEventModalComponent,

    HelpCircleOutline,
    Filter,
    FilterOffOutline
  },

  data() {
    return {
      events: [], // raw api events
      selectedEvent: {},
      subtypeColors: {
        // employee
        birthday: '#D9B84C',
        anniversary: '#C9A83E',
        promotion: '#E0C15A',
        "new hire": '#BFA13A',

        // company
        general: '#1b75bc',
        holiday: '#1b75bc',
        training: '#1b75bc',
        meeting: '#1b75bc',

        // announcements
        urgent: '#dc3545',
        safety: '#fd7e14',
        maintenance: '#6f42c1',
        production: '#198754',
        weather: '#0dcaf0'
      },
      initializing: false,
      initDate: new Date(), // used to persist calendar page
      dragged: {
        style: {
          left: 0,
          top: 0
        }
      },
      selectedDateRange: null,
      showPopover: false,
      allEvents: [],
      filters: {
        events: {
          type: this.$route.query.type ?? "",
          subtype: ""
        }
      },
      /* fullcalendar calendar options  */
      calendarOptions: {
        plugins: [ // available calendar views
          themePlugin,
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin
        ],
        selectable: true, // enable drag select for new event creation
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        views: {
          dayGridMonth: {
            dayMaxEventRows: 4
          },
          timeGridWeek: {
            eventMaxStack: 2
          },
          timeGridDay: {
            eventMaxStack: 6
          }
        },
        height: "100%",
        events: [],
        select: (info) => {
          this.selectedDateRange = {
            start: info.start,
            end: info.end
          }
          this.showAtMousPos(info)
          // console.log(JSON.stringify(this.selectedDateRange, null, 2));
        },
        unselect: () => {
          this.showPopover = false
        },
        eventClick: (info) => {
          this.selectedEvent = {
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            allDay: info.event.allDay,
            ...info.event.extendedProps,
            companyWide: this.isCompanyWide(info.event.extendedProps.location_id)
          }
          this.initDate = info.event.start
          nextTick(() => {
            this.$modal.show('edit-event-modal')
          })
          console.log('Raw event: ' + JSON.stringify(this.selectedEvent, null, 2))
        }
      },
    }
  },
  methods: {
    isAllDay(s, e) {
      const start = new Date(s)
      const end = new Date(e)
      return start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0 &&
        (end.getDate() - start.getDate() === 1)
    },
    showAtMousPos(info) {
      this.dragged.style.left = info.jsEvent.clientX - 60 + "px";
      this.dragged.style.top = info.jsEvent.clientY + 40 + "px";
      this.showPopover = true;
    },
    openCreateEvent() {
      nextTick(() => {
        this.$modal.show('create-event-modal')
      })
    },
    isCompanyWide(locationId) {
      if (locationId) {
        return false
      } else {
        return true
      }
    },
    async refreshCalendar() {
      try {
        const res = await this.$axios.get(this.$api + "events?all")

        this.events = res.data
        this.processRawEvents(this.events)
      } catch (e) {
        console.error(e)
      }
    },
    processRawEvents(events) {
      // Process raw event data for calendar display
      const processedEvents = events.map(e => {
        const event = { ...e }

        // format date for calendar
        event.start = new Date(e.start).toISOString()
        event.end = new Date(e.end).toISOString()
        // set fullcalendar allDay flag
        if (this.isAllDay(event.start, event.end)) {
          event.allDay = true
        }
        // color code by event type/subtypes
        event.color = this.subtypeColors[event.subtype] ?? 'gray'

        return event
      })

      if (this.initDate) { // persist calendar page for edit and create
        this.calendarOptions.initialDate = this.initDate
      }

      // unfiltered copy
      this.allEvents = processedEvents

      // inject into calendar
      this.calendarOptions.events = processedEvents
    },
    clearFilters() {
      this.filters.events.type = ""
      this.filters.events.subtype = ""
      this.$refs.calendar.getApi().gotoDate(new Date())
    },
  },
  computed: {
    eventTypes() {
      return eventTypes
    },
    typeFilters() {
      return Object.keys(eventTypes)
    },
    subtypeFilters() {
      return Object.values(eventTypes).flat()
    },
    availableSubtypes() {
      const { type } = this.filters.events
      return Object.values(eventTypes[type] ?? [])
    },
  },
  async mounted() {
    try {
      this.initializing = true;
      // initializes event data
      this.events = (await this.$axios.get(this.$api + "events?all")).data;
      this.processRawEvents(this.events);
      this.initializing = false;
    } catch (e) {
      console.log(e.message);
    }
  },
  watch: {
    'filters.events.type': {
      handler() {
        this.filters.events.subtype = ""
      }
    },
    'filters.events': {
      handler() {
        const { type, subtype } = this.filters.events
        this.calendarOptions.events = this.allEvents.filter(e => {
          const typeMatch = type === "" || e.type === type
          const subtypeMatch = subtype === "" || e.subtype === subtype

          return typeMatch && subtypeMatch
        })
      },
      deep: true
    }
  }
}
</script>

<style>
#calendar-container {
  width: 100%;
  height: 80dvh;
  overflow: auto;
}
</style>