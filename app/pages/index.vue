<template>
  <section ref="pageShellRef" class="page-shell page-shell--snap paper-bg">
    <v-container class="page-sections">
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
          <TravelSection />
        </v-lazy>
      </section>

      <section id="registry" class="landing-section">
        <v-lazy
          v-model="lazyActive.registry"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <RegistrySection />
        </v-lazy>
      </section>

      <section id="gallery" class="landing-section">
        <v-lazy
          v-model="lazyActive.gallery"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <GallerySection />
        </v-lazy>
      </section>

      <section id="footer" class="landing-section landing-section--footer">
        <v-lazy
          v-model="lazyActive.footer"
          :options="{ threshold: 0.2 }"
          transition="fade-transition"
        >
          <FooterSection />
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

const pageShellRef = ref<HTMLElement | null>(null)
const heroFrameRef = ref<HTMLElement | null>(null)
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
  footer: false,
  rsvp: false,
})

const lazySectionIds = Object.keys(lazyActive) as Array<keyof typeof lazyActive>
const scrollableSectionIds = new Set<string>(['hero', ...lazySectionIds])

function activateAllLazySections() {
  for (const id of lazySectionIds) lazyActive[id] = true
}

function normalizeSectionId(rawId: string): string {
  return decodeURIComponent(rawId || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase()
}

function isScrollableSection(id: string): boolean {
  return scrollableSectionIds.has(id)
}

async function scrollToSectionId(
  id: string,
  opts?: { replaceHash?: boolean, behavior?: ScrollBehavior, updateHash?: boolean }
) {
  const normalizedId = normalizeSectionId(id)
  if (!normalizedId || !isScrollableSection(normalizedId)) return

  if (lazySectionIds.includes(normalizedId as keyof typeof lazyActive)) {
    activateAllLazySections()
  }
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  const target = document.getElementById(normalizedId)
  if (!target) return

  const behavior = opts?.behavior
    ?? (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')

  target.scrollIntoView({ behavior, block: 'start' })

  if (opts?.updateHash === false) return

  const nextHash = `#${normalizedId}`
  if (window.location.hash === nextHash) return

  if (opts?.replaceHash) history.replaceState(null, '', nextHash)
  else history.pushState(null, '', nextHash)
}

function onHashChange() {
  const hashSectionId = normalizeSectionId(window.location.hash)
  if (!hashSectionId) return
  void scrollToSectionId(hashSectionId, { updateHash: false })
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
        color: 'rgba(30, 30, 30, 1)',
        textShadow: '0 1px 0 rgba(255, 255, 255, 0.74), 0 0 5px rgba(214, 214, 214, 0.26)',
      },
      {
        color: 'rgba(255, 255, 255, 1)',
        textShadow: '0 1px 0 rgba(255, 255, 255, 0.92), 0 0 16px rgba(232, 232, 232, 0.68)',
      },
      {
        color: 'rgba(48, 48, 48, 1)',
        textShadow: '0 1px 0 rgba(240, 240, 240, 0.56), 0 0 9px rgba(206, 206, 206, 0.36)',
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
  const initialHash = normalizeSectionId(window.location.hash)
  if (initialHash && isScrollableSection(initialHash)) {
    void scrollToSectionId(initialHash, {
      replaceHash: true,
      behavior: 'auto',
      updateHash: false,
    })
  } else {
    pageShellRef.value?.scrollTo({ top: 0, behavior: 'auto' })
  }
  window.addEventListener('hashchange', onHashChange)

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
  window.removeEventListener('hashchange', onHashChange)
  heroAnimation = null
  floatAnimation = null
  heroNameGlitterFallbackAnimation = null
})
</script>
