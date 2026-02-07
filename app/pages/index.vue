<template>
  <section class="page-shell paper-bg">
    <v-container class="py-10">
      <section id="hero" class="landing-section landing-section--hero">
        <div class="hero-frame">
          <div ref="heroFrameRef" class="hero-frame-art" aria-hidden="true" v-html="heroFrameSvg" />
          <div class="hero-lockup mb-8">
            <p class="hero-kicker">The Wedding Of</p>
            <h1 class="hero-names-block" :aria-label="wedding.names">
              <span class="hero-name-line">{{ heroNameParts.first }}</span>
              <span v-if="heroNameParts.second" class="hero-name-sep" aria-hidden="true">and</span>
              <span v-if="heroNameParts.second" class="hero-name-line">{{ heroNameParts.second }}</span>
            </h1>
          </div>
          <!-- <v-card class="panel-hero hero-frame-card" elevation="1">
            <v-card-text class="panel-content">
              <p class="eyebrow">{{ wedding.hero.dateDisplay }} • {{ wedding.location }}</p>
              <p class="hero-tagline" v-if="wedding.hero?.tagline != ''">{{ wedding.hero.tagline }}</p>
              <div class="hero-countdown">
                <div class="section-label">Countdown</div>
                <Countdown :date="weddingDate" />
              </div>
              <div class="button-row">
                <v-btn
                  v-for="cta in wedding.hero.ctas"
                  :key="cta.label"
                  :href="cta.href"
                  @click="onHeroCtaClick"
                  class="text-none"
                  color="primary"
                  variant="elevated"
                >
                  {{ cta.label }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card> -->
        </div>
      </section>

      <section id="schedule" class="landing-section">
        <v-lazy
          v-model="lazyActive.schedule"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <ScheduleSection />
        </v-lazy>
      </section>

      <section id="travel" class="landing-section">
        <v-lazy
          v-model="lazyActive.travel"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <v-card class="rounded-xl">
            <v-card-text class="panel-content">
              <h2 class="panel-title">Travel &amp; Accommodations</h2>
              <v-row>
                <v-col cols="12" md="7">
                  <div class="section-block">
                    <div class="section-label">Hotels</div>
                    <div v-for="hotel in wedding.travel.hotels" :key="hotel.name" class="link-row">
                      <a :href="hotel.url" target="_blank" rel="noreferrer">{{ hotel.name }}</a>
                      <span class="muted">{{ hotel.note }}</span>
                    </div>
                  </div>
                  <div class="section-block">
                    <div class="section-label">Local Transport</div>
                    <div v-for="note in wedding.travel.gettingAround" :key="note" class="muted">
                      {{ note }}
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="5">
                  <v-img
                    class="travel-photo"
                    :src="wedding.travel.photo"
                    alt="Travel"
                    height="240"
                    cover
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-lazy>
      </section>

      <section id="registry" class="landing-section">
        <v-lazy
          v-model="lazyActive.registry"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <v-card class="rounded-xl">
            <v-card-text class="panel-content">
            <h2 class="panel-title">Our Registry</h2>
            <v-row>
              <v-col v-for="item in wedding.registry" :key="item.name" cols="12" sm="4">
                <div class="registry-card">
                  <div class="registry-name">{{ item.name }}</div>
                  <v-btn
                    :href="item.url"
                    target="_blank"
                    rel="noreferrer"
                    class="text-none"
                    variant="elevated"
                  >
                    View Registry
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          </v-card>
        </v-lazy>
      </section>

      <section id="gallery" class="landing-section">
        <v-lazy
          v-model="lazyActive.gallery"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <v-card class="rounded-xl">
            <v-card-text class="panel-content">
              <h2 class="panel-title">Photo Gallery</h2>

              <v-carousel
                v-model="galleryIndex"
                height="420"
                hide-delimiter-background
                show-arrows="hover"
                cycle
              >
                <v-carousel-item v-for="(photo, index) in wedding.gallery" :key="photo.url">
                  <v-img
                    :src="photo.url"
                    :alt="photo.url.split('/').pop()?.split('?')[0] ?? ''"
                    class="gallery-slide"
                    height="420"
                    cover
                    role="button"
                    tabindex="0"
                    :aria-label="`Open ${photo.url.split('/').pop()?.split('?')[0] ?? ''} in a larger gallery`"
                    @click="openGalleryLightbox(index)"
                    @keyup.enter="openGalleryLightbox(index)"
                    @keyup.space.prevent="openGalleryLightbox(index)"
                  >
                  </v-img>
                </v-carousel-item>
              </v-carousel>

              <v-dialog
                v-model="isGalleryLightboxOpen"
                max-width="1200"
                scroll-strategy="block"
              >
                <v-card class="gallery-lightbox-card" elevation="0">
                  <v-card-actions class="justify-end pa-2">
                    <v-btn
                      class="text-none"
                      color="white"
                      variant="text"
                      @click="isGalleryLightboxOpen = false"
                    >
                      Close
                    </v-btn>
                  </v-card-actions>

                  <v-carousel
                    v-model="galleryIndex"
                    height="75vh"
                    hide-delimiter-background
                    show-arrows="hover"
                  >
                    <v-carousel-item
                      v-for="photo in wedding.gallery"
                      :key="`lightbox-${photo.url}`"
                    >
                      <v-img :src="photo.url" :alt="photo.url.split('/').pop()?.split('?')[0] ?? ''" height="75vh" contain>
                      </v-img>
                    </v-carousel-item>
                  </v-carousel>
                </v-card>
              </v-dialog>
            </v-card-text>
          </v-card>
        </v-lazy>
      </section>

      <!-- <section id="rsvp" class="landing-section">
        <v-lazy
          v-model="lazyActive.rsvp"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <RsvpSection />
        </v-lazy>
      </section> -->
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import * as anime from 'animejs'
import { wedding } from '~/data/wedding'
import heroFrameSvg from '~/assets/svgs/810543_23257-NV0O8K.svg?raw'

const weddingDate = new Date(wedding.dateISO)
const heroFrameRef = ref<HTMLElement | null>(null)
const galleryIndex = ref(0)
const isGalleryLightboxOpen = ref(false)
const heroNameParts = computed(() => {
  const parts = wedding.names.split('&').map((part) => part.trim()).filter(Boolean)
  if (parts.length <= 1) return { first: wedding.names.trim(), second: '' }

  return {
    first: parts[0],
    second: parts.slice(1).join(' & '),
  }
})
const lazyActive = reactive({
  schedule: false,
  travel: false,
  gallery: false,
  registry: false,
  rsvp: false,
})

const lazySectionIds = Object.keys(lazyActive) as Array<keyof typeof lazyActive>

function activateAllLazySections() {
  for (const id of lazySectionIds) lazyActive[id] = true
}

async function scrollToSectionId(id: string, opts?: { replaceHash?: boolean }) {
  if (!id) return

  activateAllLazySections()
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  const target = document.getElementById(id)
  if (!target) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })

  const nextHash = `#${id}`
  if (opts?.replaceHash) history.replaceState(null, '', nextHash)
  else history.pushState(null, '', nextHash)
}

function onHeroCtaClick(e: MouseEvent) {
  const href = (e.currentTarget as HTMLAnchorElement | null)?.getAttribute('href')
  if (!href?.startsWith('#')) return
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

  e.preventDefault()
  void scrollToSectionId(href.slice(1))
}

function openGalleryLightbox(index: number) {
  galleryIndex.value = index
  isGalleryLightboxOpen.value = true
}

let heroAnimation: anime.JSAnimation | null = null
let floatAnimation: anime.JSAnimation | null = null
let heroNameGlitterFallbackAnimation: anime.JSAnimation | null = null

function supportsTextClipForHeroNames() {
  const cssApi = window.CSS
  if (!cssApi?.supports) return false
  return cssApi.supports('(-webkit-background-clip: text)') || cssApi.supports('(background-clip: text)')
}

function startHeroNameGlitterFallback() {
  if (supportsTextClipForHeroNames()) return

  const nameLines = document.querySelectorAll<HTMLElement>('.hero-name-line')
  if (nameLines.length === 0) return

  heroNameGlitterFallbackAnimation = anime.animate(nameLines, {
    keyframes: [
      {
        color: 'rgba(194, 146, 49, 1)',
        textShadow: '0 1px 0 rgba(255, 239, 188, 0.5), 0 0 5px rgba(255, 219, 133, 0.2)',
      },
      {
        color: 'rgba(255, 233, 159, 1)',
        textShadow: '0 1px 0 rgba(255, 248, 221, 0.78), 0 0 16px rgba(255, 228, 145, 0.6)',
      },
      {
        color: 'rgba(183, 130, 38, 1)',
        textShadow: '0 1px 0 rgba(255, 237, 175, 0.42), 0 0 9px rgba(255, 211, 108, 0.34)',
      },
    ],
    duration: 2800,
    delay: anime.stagger(180),
    ease: 'inOutSine',
    loop: true,
    alternate: true,
  })
}

onMounted(() => {
  const initialHash = window.location.hash?.slice(1)
  if (initialHash && lazySectionIds.includes(initialHash as keyof typeof lazyActive)) {
    void scrollToSectionId(initialHash, { replaceHash: true })
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!prefersReducedMotion) startHeroNameGlitterFallback()

  const root = heroFrameRef.value
  if (!root) return
  if (prefersReducedMotion) return
  const paths = root.querySelectorAll('path')
  if (paths.length === 0) return

  heroAnimation = anime.animate(paths, {
    keyframes: [
      { translateX: -6, translateY: -2, rotate: -2 },
      { translateX: 6, translateY: 2, rotate: 2 },
      { translateX: -6, translateY: -2, rotate: -2 },
    ],
    ease: 'inOutSine',
    duration: 8000,
    delay: anime.stagger(40, { from: 'center' }),
    loop: true,
    alternate: true
  })

  floatAnimation = anime.animate(root, {
    keyframes: [
      { translateX: -6, translateY: -2, rotate: -1.2 },
      { translateX: 6, translateY: 2, rotate: 1.2 },
      { translateX: -6, translateY: -2, rotate: -1.2 },
    ],
    duration: 8000,
    ease: 'inOutSine',
    loop: true,
    alternate: true
  })
})

onBeforeUnmount(() => {
  heroAnimation?.pause()
  floatAnimation?.pause()
  heroNameGlitterFallbackAnimation?.pause()
  heroAnimation = null
  floatAnimation = null
  heroNameGlitterFallbackAnimation = null
})
</script>

<style scoped>
.gallery-slide {
  cursor: zoom-in;
}

.gallery-lightbox-card {
  background:
    rgb(var(--v-theme-surface));
}
</style>
