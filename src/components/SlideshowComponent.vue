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
        :src="slides[currentIndex]"
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
    // how long each slide is shown, in milliseconds (default 10 seconds)
    interval: {
      type: Number,
      default: 10000
    },
    // the image sources to cycle through, in display order.
    // defaults to the presentation slides bundled in /public/images
    slides: {
      type: Array,
      default: () => [
        `${process.env.BASE_URL}images/hayden_slide_1.jpg`,
        `${process.env.BASE_URL}images/hayden_slide_2.jpg`,
        `${process.env.BASE_URL}images/hayden_slide_3.jpg`,
        `${process.env.BASE_URL}images/hayden_slide_4.jpg`
      ]
    }
  },
  data() {
    return {
      // index of the currently visible slide
      currentIndex: 0,
      timer: null
    }
  },
  computed: {
    slideCount() {
      return this.slides.length
    }
  },
  mounted() {
    this.startSlideshow()
  },
  beforeUnmount() {
    this.stopSlideshow()
  },
  methods: {
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