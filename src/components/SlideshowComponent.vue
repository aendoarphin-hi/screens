<!-- PRESENTATION SLIDESHOW TEMPLATE FOR SCREEN -->
<template>
  <div class="slideshow">
    <!-- crossfade between slides: the leaving slide fades out (animate__fadeOut)
         while the entering slide fades in (animate__fadeIn) -->
    <transition
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
    >
      <img
        v-if="slideCount > 0"
        :key="currentIndex"
        :src="displaySlides[currentIndex]"
        class="slideshow-slide"
        :alt="`Slide ${currentIndex + 1} of ${slideCount}`"
      />
    </transition>
  </div>
</template>

<script>
export default {
  name: "SlideshowComponent",
  props: {
    // how long each slide is shown, in milliseconds (default 3 seconds)
    interval: {
      type: Number,
      default: 3000
    },
    // the image sources to cycle through, in display order.
    // if no slides are found, it will default to the hayden slide
    slides: {
      type: Array,
      default: () => [
        `${process.env.BASE_URL}images/hayden-default.jpg`
      ]
    }
  },
  data() {
    return {
      // index of the currently visible slide
      currentIndex: 0,
      timer: null,
      // periodic check that re-evaluates timed-content windows
      clock: null,
      // screen being previewed (resolved from the ?screenid route query)
      screen: null,
      // content and event records loaded from the api
      content: [],
      events: [],
      // snapshot of the last slide set we displayed (to detect window changes)
      lastSlideSet: []
    }
  },
  computed: {
    // screenid passed via the preview route (/slideshow?screenid=12)
    activeScreenId() {
      const raw = this.$route?.query?.screenid;
      return raw === undefined || raw === null || raw === "" ? null : Number(raw)
    },
    // Ordered, currently-visible image urls resolved from the screen's play sequence.
    // Timed content (a content id linked to an event) is only included while "now" is
    // inside one of that content's event windows; outside the window it is hidden.
    dataSlides() {
      if (!this.screen) return []
      const ids = String(this.screen.content || "")
        .split(",").map((s) => s.trim()).map(Number)
        .filter((n) => !Number.isNaN(n) && n > 0)
      return ids
        .map((id) => this.content.find((c) => Number(c.id) === id))
        .filter((c) => c && (c.url || c.src) && this.isVisibleNow(c))
        .map((c) => c.url || c.src)
    },
    // use parent-provided slides unless we are in the screenid preview with content
    displaySlides() {
      if (this.activeScreenId === null) return this.slides
      const data = this.dataSlides
      return data.length > 0 ? data : this.slides
    },
    slideCount() {
      return this.displaySlides.length
    }
  },
  mounted() {
    this.startSlideshow()
    this.startClock()
    this.loadData()
  },
  beforeUnmount() {
    this.stopSlideshow()
    this.stopClock()
  },
  methods: {
    /**
     * True while the content should be shown right now.
     * Content referenced by at least one event is timed: it is visible only inside
     * any of those events' [start, end] windows. Untimed content is always visible.
     */
    isVisibleNow(c) {
      const windows = this.events.filter(
        (e) => Number(e.content_id) === Number(c.id) && e.start && e.end
      )
      if (windows.length === 0) return true
      const now = Date.now()
      return windows.some(
        (w) => now >= new Date(w.start).getTime() && now <= new Date(w.end).getTime()
      )
    },
    async loadData() {
      if (this.activeScreenId === null) return
      try {
        // fetch the single screen by id, the full content list, and all events
        const [screenRes, contentRes, eventsRes] = await Promise.all([
          this.$axios.get(this.$api + '?screens&id=' + this.activeScreenId),
          this.$axios.get(this.$api + '?content'),
          this.$axios.get(this.$api + '?events')
        ])
        // the api returns a single-element array for ?screens&id= (same as ?events&id=)
        this.screen = Array.isArray(screenRes.data) ? screenRes.data[0] : screenRes.data || null
        this.content = contentRes.data
        this.events = eventsRes.data
      } catch (error) {
        console.error('Slideshow data load error:', error)
      } finally {
        this.lastSlideSet = this.dataSlides
        this.currentIndex = 0
        this.startSlideshow()
      }
    },
    startSlideshow() {
      this.stopSlideshow()
      if (this.slideCount <= 1) return
      this.timer = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.slideCount
      }, this.interval)
    },
    stopSlideshow() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    // every 30s re-evaluate timed windows; when the visible set changes
    // (an event window opened/closed), start the sequence over from slide 1
    startClock() {
      this.stopClock()
      this.clock = setInterval(() => {
        if (this.activeScreenId === null) return
        const current = this.dataSlides
        const changed =
          current.length !== this.lastSlideSet.length ||
          current.some((url, i) => url !== this.lastSlideSet[i])
        if (changed) {
          this.lastSlideSet = current
          this.currentIndex = 0
          this.startSlideshow()
        }
      }, 30000)
    },
    stopClock() {
      if (this.clock) {
        clearInterval(this.clock)
        this.clock = null
      }
    }
  }
}
</script>


<style scoped>
.slideshow {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bs-secondary-bg);
  /* crossfade duration shared by the animate__fadeIn / animate__fadeOut
     enter and leave animations on the slide images */
  --animate-duration: 2s;
}

.slideshow-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
</style>