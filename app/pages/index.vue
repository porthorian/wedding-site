<template>
  <section ref="pageShellRef" class="page-shell page-shell--snap paper-bg" :class="{ 'page-shell--programmatic-scroll': isProgrammaticScrolling }">
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
            <div class="hero-cta">
              <v-btn color="primary" variant="outlined" class="text-none hero-cta-btn" @click="scrollToSectionId('rsvp')">
                RSVP
              </v-btn>
            </div>
            <nav class="hero-mini-nav" aria-label="Wedding details">
              <v-btn
                v-for="item in heroNavItems"
                :key="item.id"
                variant="text"
                color="primary"
                size="small"
                class="text-none hero-mini-nav-btn"
                @click="scrollToSectionId(item.id)"
              >
                {{ item.label }}
              </v-btn>
            </nav>
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

      <section id="faq" class="landing-section">
        <v-lazy
          v-model="lazyActive.faq"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <FaqSection />
        </v-lazy>
      </section>

      <section id="rsvp" class="landing-section">
        <v-lazy
          v-model="lazyActive.rsvp"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <RsvpSection />
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
const isProgrammaticScrolling = ref(false)
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
  faq: false,
  registry: false,
  footer: false,
  rsvp: false,
})

const lazySectionIds = Object.keys(lazyActive) as Array<keyof typeof lazyActive>
const sectionIdsInOrder = ['hero', 'schedule', 'travel', 'registry', 'gallery', 'faq', 'rsvp', 'footer'] as const
type SectionId = typeof sectionIdsInOrder[number]

const heroNavItems: Array<{ id: SectionId, label: string }> = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'travel', label: 'Travel' },
  { id: 'registry', label: 'Registry' },
  { id: 'gallery', label: 'Photos' },
  { id: 'faq', label: 'FAQ' },
  { id: 'rsvp', label: 'RSVP' },
]

const scrollableSectionIds = new Set<string>(sectionIdsInOrder)
let scrollHashSyncRaf: number | null = null
let suppressScrollHashSync = false
let suppressScrollHashSyncTimer: number | null = null
let programmaticScrollRestoreTimer: number | null = null
let programmaticScrollGeneration = 0
let previousScrollRestoration: ScrollRestoration | null = null

function normalizeSectionId(rawId: string): string {
  const cleaned = String(rawId || '')
    .trim()
    .replace(/^#/, '')
  if (!cleaned) return ''

  try {
    return decodeURIComponent(cleaned).trim().toLowerCase()
  } catch {
    return cleaned.toLowerCase()
  }
}

function isScrollableSection(id: string): boolean {
  return scrollableSectionIds.has(id)
}

function activateLazySection(id: string) {
  const normalizedId = normalizeSectionId(id)
  if (!normalizedId) return
  const lazyId = normalizedId as keyof typeof lazyActive
  if (lazySectionIds.includes(lazyId)) lazyActive[lazyId] = true
}

function activateLazySectionsThrough(id: string) {
  const normalizedId = normalizeSectionId(id)
  const targetIndex = sectionIdsInOrder.findIndex((sectionId) => sectionId === normalizedId)
  if (targetIndex === -1) {
    activateLazySection(normalizedId)
    return
  }

  sectionIdsInOrder.slice(0, targetIndex + 1).forEach(activateLazySection)
}

function getMountedSections(): HTMLElement[] {
  return sectionIdsInOrder
    .map((id) => document.getElementById(id))
    .filter((node): node is HTMLElement => Boolean(node))
}

function getUrlWithoutHash(): string {
  return `${window.location.pathname}${window.location.search}`
}

function getDocumentScrollElement(): HTMLElement {
  return (document.scrollingElement as HTMLElement) || document.documentElement
}

function getEffectiveScrollContainer(): HTMLElement {
  const pageShell = pageShellRef.value
  if (pageShell && pageShell.scrollHeight - pageShell.clientHeight > 2) return pageShell
  return getDocumentScrollElement()
}

function suppressHashSyncFor(durationMs: number) {
  suppressScrollHashSync = true
  if (suppressScrollHashSyncTimer !== null) {
    window.clearTimeout(suppressScrollHashSyncTimer)
  }
  suppressScrollHashSyncTimer = window.setTimeout(() => {
    suppressScrollHashSync = false
    suppressScrollHashSyncTimer = null
  }, durationMs)
}

async function waitForLayout(frames = 1) {
  for (let index = 0; index < frames; index += 1) {
    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}

function computeTargetScrollTop(container: HTMLElement, target: HTMLElement): number {
  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  return Math.max(0, container.scrollTop + (targetRect.top - containerRect.top))
}

function beginProgrammaticScroll(): number {
  programmaticScrollGeneration += 1
  isProgrammaticScrolling.value = true
  if (programmaticScrollRestoreTimer !== null) {
    window.clearTimeout(programmaticScrollRestoreTimer)
    programmaticScrollRestoreTimer = null
  }

  return programmaticScrollGeneration
}

function endProgrammaticScroll(scrollGeneration: number, delayMs = 120) {
  if (scrollGeneration !== programmaticScrollGeneration) return

  if (programmaticScrollRestoreTimer !== null) {
    window.clearTimeout(programmaticScrollRestoreTimer)
  }
  programmaticScrollRestoreTimer = window.setTimeout(() => {
    if (scrollGeneration === programmaticScrollGeneration) {
      isProgrammaticScrolling.value = false
    }
    programmaticScrollRestoreTimer = null
  }, delayMs)
}

async function waitForScrollSettle(container: HTMLElement, target: HTMLElement, maxMs: number) {
  const startTime = performance.now()
  let previousTop = container.scrollTop
  let stableFrames = 0

  while (performance.now() - startTime < maxMs) {
    await waitForLayout(1)

    const expectedTop = computeTargetScrollTop(container, target)
    const distance = Math.abs(container.scrollTop - expectedTop)
    const delta = Math.abs(container.scrollTop - previousTop)

    if (distance <= 2 || delta <= 0.5) stableFrames += 1
    else stableFrames = 0

    if (stableFrames >= 3 && (distance <= 2 || performance.now() - startTime > 220)) return

    previousTop = container.scrollTop
  }
}

async function ensureTargetAligned(container: HTMLElement, target: HTMLElement, behavior: ScrollBehavior) {
  if (behavior === 'smooth') await waitForScrollSettle(container, target, 1400)
  else await waitForLayout(2)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const expectedTop = computeTargetScrollTop(container, target)
    const isAligned = Math.abs(container.scrollTop - expectedTop) <= 2
    if (isAligned) return

    container.scrollTo({ top: expectedTop, behavior: 'auto' })
    container.scrollTop = expectedTop
    await waitForLayout(1)
  }
}

function getCurrentSectionIdFromScroll(): string | null {
  const sections = getMountedSections()
  if (!sections.length) return null

  const activationLine = Math.min(window.innerHeight * 0.36, 280)
  let currentId = sections[0]?.id ?? null

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= activationLine) currentId = section.id
    else break
  }

  return currentId
}

function syncHashToCurrentSection() {
  if (suppressScrollHashSync) return

  const currentSectionId = getCurrentSectionIdFromScroll()
  if (!currentSectionId) return

  if (currentSectionId === 'hero') {
    if (window.location.hash) history.replaceState(null, '', getUrlWithoutHash())
    return
  }

  const nextHash = `#${currentSectionId}`
  if (window.location.hash === nextHash) return

  history.replaceState(null, '', nextHash)
}

function onPageShellScroll() {
  if (scrollHashSyncRaf !== null) return
  scrollHashSyncRaf = window.requestAnimationFrame(() => {
    scrollHashSyncRaf = null
    syncHashToCurrentSection()
  })
}

async function scrollToSectionId(
  id: string,
  opts?: { replaceHash?: boolean, behavior?: ScrollBehavior, updateHash?: boolean }
) {
  const normalizedId = normalizeSectionId(id)
  if (!normalizedId || !isScrollableSection(normalizedId)) return false

  activateLazySectionsThrough(normalizedId)
  await waitForLayout(3)

  const target = document.getElementById(normalizedId)
  if (!target) return false

  const behavior = opts?.behavior
    ?? (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')

  const scrollGeneration = beginProgrammaticScroll()
  suppressHashSyncFor(behavior === 'smooth' ? 1800 : 300)

  try {
    const scrollContainer = getEffectiveScrollContainer()
    const targetTop = computeTargetScrollTop(scrollContainer, target)
    scrollContainer.scrollTo({ top: targetTop, behavior })
    if (behavior === 'auto') scrollContainer.scrollTop = targetTop
    await ensureTargetAligned(scrollContainer, target, behavior)
  } finally {
    endProgrammaticScroll(scrollGeneration)
  }

  if (scrollGeneration !== programmaticScrollGeneration) return true

  if (opts?.updateHash === false) return true

  if (normalizedId === 'hero') {
    if (window.location.hash) {
      const nextUrl = getUrlWithoutHash()
      if (opts?.replaceHash) history.replaceState(null, '', nextUrl)
      else history.pushState(null, '', nextUrl)
    }
    return true
  }

  const nextHash = `#${normalizedId}`
  if (window.location.hash === nextHash) return true
  if (opts?.replaceHash) history.replaceState(null, '', nextHash)
  else history.pushState(null, '', nextHash)
  return true
}

async function snapToInitialSection() {
  const initialHash = normalizeSectionId(window.location.hash)
  if (!initialHash || !isScrollableSection(initialHash) || initialHash === 'hero') {
    const scrollContainer = getEffectiveScrollContainer()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await waitForLayout(1)
      scrollContainer.scrollTo({ top: 0, behavior: 'auto' })
      scrollContainer.scrollTop = 0
      if (scrollContainer.scrollTop <= 1) break
    }
    if (window.location.hash) history.replaceState(null, '', getUrlWithoutHash())
    return
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scrolled = await scrollToSectionId(initialHash, {
      replaceHash: true,
      behavior: 'auto',
      updateHash: false,
    })
    if (!scrolled) continue

    const scrollContainer = getEffectiveScrollContainer()
    const target = document.getElementById(initialHash)
    if (!scrollContainer || !target) break

    const expectedTop = computeTargetScrollTop(scrollContainer, target)
    const isAligned = Math.abs(scrollContainer.scrollTop - expectedTop) <= 2
    if (isAligned) break

    await waitForLayout(1)
  }
}

function onHashChange() {
  const hashSectionId = normalizeSectionId(window.location.hash)
  if (!hashSectionId) {
    void scrollToSectionId('hero', { updateHash: false, behavior: 'auto' })
    return
  }
  if (hashSectionId === 'hero') {
    void scrollToSectionId('hero', { updateHash: true, replaceHash: true, behavior: 'auto' })
    return
  }
  void scrollToSectionId(hashSectionId, { updateHash: false, behavior: 'auto' })
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

onMounted(async () => {
  if ('scrollRestoration' in history) {
    previousScrollRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
  }

  await snapToInitialSection()
  await waitForLayout(1)
  syncHashToCurrentSection()

  pageShellRef.value?.addEventListener('scroll', onPageShellScroll, { passive: true })
  window.addEventListener('scroll', onPageShellScroll, { passive: true })
  window.addEventListener('resize', onPageShellScroll, { passive: true })
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
  if (scrollHashSyncRaf !== null) {
    window.cancelAnimationFrame(scrollHashSyncRaf)
    scrollHashSyncRaf = null
  }
  if (suppressScrollHashSyncTimer !== null) {
    window.clearTimeout(suppressScrollHashSyncTimer)
    suppressScrollHashSyncTimer = null
  }
  if (programmaticScrollRestoreTimer !== null) {
    window.clearTimeout(programmaticScrollRestoreTimer)
    programmaticScrollRestoreTimer = null
  }
  suppressScrollHashSync = false
  isProgrammaticScrolling.value = false
  pageShellRef.value?.removeEventListener('scroll', onPageShellScroll)
  window.removeEventListener('scroll', onPageShellScroll)
  window.removeEventListener('resize', onPageShellScroll)
  window.removeEventListener('hashchange', onHashChange)
  if (previousScrollRestoration !== null && 'scrollRestoration' in history) {
    history.scrollRestoration = previousScrollRestoration
    previousScrollRestoration = null
  }
  heroAnimation = null
  floatAnimation = null
  heroNameGlitterFallbackAnimation = null
})
</script>
