<template>
  <div ref="rootRef" class="gallery-shell">
    <v-card elevation="1" class="gallery-card section-card rounded-xl">
      <div class="gallery-ambient" aria-hidden="true" />
      <v-card-text class="panel-content gallery-content">
        <header class="gallery-header">
          <p class="gallery-eyebrow">Photo Reel</p>
          <h2 class="panel-title">Gallery</h2>
          <p class="muted gallery-intro">
            A few favorites from our engagement session. Tap any photo to open the full set.
          </p>

          <div class="gallery-toolbar">
            <v-btn
              class="text-none gallery-open-btn"
              color="primary"
              variant="elevated"
              rounded="pill"
              @click="openLightbox(0)"
            >
              Open Full Gallery ({{ totalPhotos }})
            </v-btn>
          </div>
        </header>

        <div class="gallery-mosaic">
          <button
            v-for="(photo, index) in mosaicPhotos"
            :key="photo.url"
            type="button"
            class="gallery-tile"
            :class="tileClass(index)"
            :aria-label="`Open ${photoLabel(index)} in gallery`"
            @click="openLightbox(index)"
          >
            <NuxtImg
              :src="encodedPhotoUrl(photo.url)"
              :alt="photoLabel(index)"
              class="gallery-tile-image"
              sizes="(max-width: 960px) 50vw, (max-width: 1360px) 28vw, 24vw"
              :loading="index === 0 ? 'eager' : 'lazy'"
              :fetchpriority="index === 0 ? 'high' : 'auto'"
              decoding="async"
              fit="cover"
              :quality="78"
            />
            <span v-if="index === 0" class="gallery-tile-feature">Featured</span>
            <span class="gallery-tile-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span
              v-if="isLastMosaicTile(index)"
              class="gallery-tile-more"
            >
              +{{ hiddenPhotoCount }} more
            </span>
          </button>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="isLightboxOpen" max-width="1280" scroll-strategy="block">
      <v-card class="gallery-lightbox-shell" elevation="0">
        <div class="gallery-lightbox-topbar">
          <div class="gallery-lightbox-counter">
            {{ String(galleryIndex + 1).padStart(2, '0') }} / {{ String(totalPhotos).padStart(2, '0') }}
          </div>
          <v-btn
            class="text-none"
            color="primary"
            variant="text"
            @click="isLightboxOpen = false"
          >
            Close
          </v-btn>
        </div>

        <div class="gallery-lightbox-main">
          <v-btn
            class="gallery-nav-btn"
            aria-label="Previous photo"
            variant="outlined"
            icon
            @click="prevPhoto"
          >
            <span class="gallery-nav-glyph" aria-hidden="true">‹</span>
          </v-btn>

          <div class="gallery-lightbox-image-wrap">
            <Transition name="gallery-lightbox-fade" mode="out-in">
              <img
                v-if="activePhotoSrc"
                :key="activePhotoSrc"
                :src="activePhotoSrc"
                :alt="photoLabel(galleryIndex)"
                class="gallery-lightbox-image"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              />
            </Transition>
          </div>

          <v-btn
            class="gallery-nav-btn"
            aria-label="Next photo"
            variant="outlined"
            icon
            @click="nextPhoto"
          >
            <span class="gallery-nav-glyph" aria-hidden="true">›</span>
          </v-btn>
        </div>

        <div class="gallery-filmstrip" role="listbox" aria-label="Gallery thumbnails">
          <button
            v-for="(photo, index) in photos"
            :key="`thumb-${photo.url}`"
            type="button"
            class="gallery-thumb"
            :class="{ 'gallery-thumb--active': index === galleryIndex }"
            :aria-label="`View photo ${index + 1}`"
            :aria-selected="index === galleryIndex"
            @mouseenter="warmLightboxPhoto(index)"
            @focus="warmLightboxPhoto(index)"
            @click="selectPhoto(index)"
          >
            <NuxtImg
              :src="encodedPhotoUrl(photo.url)"
              :alt="photoLabel(index)"
              class="gallery-thumb-image"
              width="92"
              height="72"
              loading="lazy"
              decoding="async"
              fit="cover"
              :quality="68"
            />
          </button>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as anime from 'animejs'
import { wedding } from '~/data/wedding'

const rootRef = ref<HTMLElement | null>(null)
const galleryIndex = ref(0)
const isLightboxOpen = ref(false)
let introAnimation: anime.JSAnimation | null = null

const tilePattern = [
  'gallery-tile--hero',
  'gallery-tile--tall',
  'gallery-tile--small',
  'gallery-tile--wide',
  'gallery-tile--small',
  'gallery-tile--small',
  'gallery-tile--tall',
  'gallery-tile--wide',
  'gallery-tile--small',
  'gallery-tile--small',
  'gallery-tile--tall',
  'gallery-tile--wide',
] as const

const photos = computed(() => wedding.gallery ?? [])
const totalPhotos = computed(() => photos.value.length)
const mosaicPhotos = computed(() => photos.value.slice(0, Math.min(9, photos.value.length)))
const hiddenPhotoCount = computed(() => Math.max(0, totalPhotos.value - mosaicPhotos.value.length))
const activePhoto = computed(() => photos.value[galleryIndex.value] ?? null)
const activePhotoSrc = computed(() => {
  if (!activePhoto.value) return ''
  return encodedPhotoUrl(activePhoto.value.url)
})
const photoLabels = computed(() => photos.value.map((photo, index) => formatPhotoLabel(photo.url, index)))
const preloadedLightboxSources = new Set<string>()
const lightboxPreloadQueue = new Map<string, Promise<void>>()
let preloadAllTimer: number | null = null

function tileClass(index: number): string {
  return tilePattern[index % tilePattern.length] ?? 'gallery-tile--small'
}

function formatPhotoLabel(url: string, index: number): string {
  const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
  const normalized = fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim()
  return normalized || `Photo ${index + 1}`
}

function photoLabel(index: number): string {
  return photoLabels.value[index] ?? `Photo ${index + 1}`
}

function encodedPhotoUrl(url: string): string {
  return encodeURI(url)
}

function toCircularIndex(index: number): number {
  if (!totalPhotos.value) return 0
  return (index % totalPhotos.value + totalPhotos.value) % totalPhotos.value
}

function lightboxSrcAt(index: number): string {
  if (!totalPhotos.value) return ''
  const normalizedIndex = toCircularIndex(index)
  const entry = photos.value[normalizedIndex]
  if (!entry) return ''
  return encodedPhotoUrl(entry.url)
}

function preloadLightboxSource(source: string): Promise<void> {
  if (!source || preloadedLightboxSources.has(source)) return Promise.resolve()
  const queued = lightboxPreloadQueue.get(source)
  if (queued) return queued

  const preloadPromise = new Promise<void>((resolve) => {
    const image = new Image()
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      preloadedLightboxSources.add(source)
      lightboxPreloadQueue.delete(source)
      resolve()
    }

    image.onload = finish
    image.onerror = finish
    image.decoding = 'async'
    image.src = source

    if (image.complete) {
      finish()
      return
    }

    if (typeof image.decode === 'function') {
      void image.decode().then(finish).catch(() => {})
    }
  })

  lightboxPreloadQueue.set(source, preloadPromise)
  return preloadPromise
}

function preloadAround(index: number, radius = 2) {
  if (!totalPhotos.value) return
  for (let offset = -radius; offset <= radius; offset += 1) {
    const source = lightboxSrcAt(index + offset)
    if (!source) continue
    void preloadLightboxSource(source)
  }
}

function preloadAllLightboxImages() {
  for (let index = 0; index < totalPhotos.value; index += 1) {
    const source = lightboxSrcAt(index)
    if (!source) continue
    void preloadLightboxSource(source)
  }
}

function schedulePreloadAll() {
  if (preloadAllTimer !== null) window.clearTimeout(preloadAllTimer)
  preloadAllTimer = window.setTimeout(() => {
    preloadAllTimer = null
    preloadAllLightboxImages()
  }, 260)
}

function warmLightboxPhoto(index: number) {
  const source = lightboxSrcAt(index)
  if (!source) return
  void preloadLightboxSource(source)
}

function openLightbox(index: number) {
  if (!totalPhotos.value) return
  galleryIndex.value = Math.min(Math.max(index, 0), totalPhotos.value - 1)
  isLightboxOpen.value = true
  warmLightboxPhoto(galleryIndex.value)
  preloadAround(galleryIndex.value, 3)
  schedulePreloadAll()
}

function selectPhoto(index: number) {
  if (!totalPhotos.value) return
  const nextIndex = Math.min(Math.max(index, 0), totalPhotos.value - 1)
  warmLightboxPhoto(nextIndex)
  galleryIndex.value = nextIndex
  preloadAround(galleryIndex.value, 3)
}

function nextPhoto() {
  if (!totalPhotos.value) return
  const nextIndex = (galleryIndex.value + 1) % totalPhotos.value
  warmLightboxPhoto(nextIndex)
  galleryIndex.value = nextIndex
}

function prevPhoto() {
  if (!totalPhotos.value) return
  const prevIndex = (galleryIndex.value - 1 + totalPhotos.value) % totalPhotos.value
  warmLightboxPhoto(prevIndex)
  galleryIndex.value = prevIndex
}

function isLastMosaicTile(index: number): boolean {
  return hiddenPhotoCount.value > 0 && index === mosaicPhotos.value.length - 1
}

function onWindowKeydown(event: KeyboardEvent) {
  if (!isLightboxOpen.value) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    nextPhoto()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prevPhoto()
  } else if (event.key === 'Escape') {
    isLightboxOpen.value = false
  }
}

function startIntroAnimation() {
  if (introAnimation) return
  const root = rootRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const nodes = root.querySelectorAll<HTMLElement>('.gallery-header, .gallery-tile')
  if (!nodes.length) return

  introAnimation = anime.animate(nodes, {
    opacity: [0, 1],
    translateY: [14, 0],
    duration: 880,
    delay: anime.stagger(45, { from: 'first' }),
    ease: 'outCubic',
  })
}

watch(isLightboxOpen, (open) => {
  if (!open) return
  preloadAround(galleryIndex.value, 3)
  schedulePreloadAll()
})

watch(galleryIndex, (index) => {
  if (!isLightboxOpen.value) return
  preloadAround(index, 3)
})

onMounted(async () => {
  await nextTick()
  startIntroAnimation()
  window.addEventListener('keydown', onWindowKeydown)
})

onBeforeUnmount(() => {
  introAnimation?.pause()
  introAnimation = null
  if (preloadAllTimer !== null) {
    window.clearTimeout(preloadAllTimer)
    preloadAllTimer = null
  }
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>

<style scoped>
.gallery-shell {
  width: 100%;
}

.gallery-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--panel-border-rgb), 0.56);
  background: rgba(var(--panel-surface-rgb), 0.9);
}

.gallery-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 8% 10%, rgba(var(--sage-rgb), 0.22), transparent 40%),
    radial-gradient(circle at 88% 12%, rgba(var(--blush-rgb), 0.2), transparent 46%),
    radial-gradient(circle at 52% 92%, rgba(var(--light-magenta-rgb), 0.18), transparent 50%);
}

.gallery-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gallery-header {
  max-width: 70ch;
  display: grid;
  gap: 8px;
}

.gallery-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.72);
}

.gallery-intro {
  margin: 0;
}

.gallery-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.gallery-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gallery-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.4);
  background:
    linear-gradient(180deg, rgba(var(--panel-surface-rgb), 0.96), rgba(var(--panel-surface-rgb), 0.82));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 8px 16px rgba(var(--ink-rgb), 0.1);
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.88);
}

:deep(.gallery-open-btn.v-btn) {
  height: 40px;
  letter-spacing: 0.1em;
  font-weight: 700;
  padding-inline: 16px;
}

.gallery-mosaic {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 56px;
  gap: 10px;
}

.gallery-tile {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--panel-border-rgb), 0.36);
  padding: 0;
  cursor: zoom-in;
  border-radius: 12px;
  background: rgba(var(--panel-surface-rgb), 0.8);
  box-shadow: 0 12px 20px rgba(var(--ink-rgb), 0.12);
  transition: transform 230ms ease, box-shadow 230ms ease;
}

.gallery-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 34px rgba(var(--ink-rgb), 0.2);
}

.gallery-tile:hover .gallery-tile-image {
  transform: scale(1.06);
}

.gallery-tile-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 420ms ease;
}

.gallery-tile-feature {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(3px);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.95);
}

.gallery-tile::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(var(--ink-rgb), 0.56), rgba(var(--ink-rgb), 0));
  pointer-events: none;
}

.gallery-tile-index {
  position: absolute;
  bottom: 8px;
  left: 10px;
  z-index: 1;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #fff;
}

.gallery-tile-more {
  position: absolute;
  right: 10px;
  bottom: 8px;
  z-index: 1;
  font-size: 12px;
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.4);
}

.gallery-tile--hero {
  grid-column: span 6;
  grid-row: span 6;
}

.gallery-tile--wide {
  grid-column: span 6;
  grid-row: span 4;
}

.gallery-tile--tall {
  grid-column: span 3;
  grid-row: span 6;
}

.gallery-tile--small {
  grid-column: span 3;
  grid-row: span 4;
}

.gallery-lightbox-shell {
  background: rgb(var(--v-theme-surface));
  border-radius: 14px;
  overflow: hidden;
}

.gallery-lightbox-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(var(--panel-border-rgb), 0.2);
}

.gallery-lightbox-counter {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.82);
}

.gallery-lightbox-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 10px;
}

.gallery-lightbox-image-wrap {
  position: relative;
  min-width: 0;
  height: min(70vh, 780px);
  min-height: min(70vh, 780px);
  max-height: min(70vh, 780px);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.gallery-lightbox-image {
  width: 100%;
  height: min(70vh, 780px);
  object-fit: contain;
  display: block;
  will-change: opacity;
}

.gallery-lightbox-fade-enter-active,
.gallery-lightbox-fade-leave-active {
  transition: opacity 140ms ease;
}

.gallery-lightbox-fade-enter-from,
.gallery-lightbox-fade-leave-to {
  opacity: 0;
}

:deep(.gallery-nav-btn.v-btn) {
  min-width: 46px;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.32);
  background: rgba(var(--panel-surface-rgb), 0.8);
  box-shadow: 0 6px 14px rgba(var(--ink-rgb), 0.12);
}

:deep(.gallery-nav-btn.v-btn:hover) {
  background: rgba(var(--panel-surface-rgb), 0.94);
  border-color: rgba(var(--panel-border-rgb), 0.52);
}

:deep(.gallery-nav-btn .v-btn__content) {
  color: rgba(var(--ink-rgb), 0.92);
}

.gallery-nav-glyph {
  display: inline-block;
  font-size: 34px;
  line-height: 1;
  font-weight: 400;
  color: currentColor;
  transform: translateY(-1px);
}

.gallery-filmstrip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 10px 10px;
}

.gallery-thumb {
  flex: 0 0 92px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.3);
  border-radius: 8px;
  overflow: hidden;
  opacity: 0.72;
  cursor: pointer;
  padding: 0;
}

.gallery-thumb-image {
  width: 100%;
  height: 72px;
  object-fit: cover;
  display: block;
}

.gallery-thumb--active {
  opacity: 1;
  border-color: rgba(var(--v-theme-primary), 0.7);
}

@media (max-width: 960px) {
  .gallery-toolbar {
    justify-content: flex-start;
  }

  :deep(.gallery-open-btn.v-btn) {
    width: 100%;
    justify-content: center;
  }

  .gallery-mosaic {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 110px;
  }

  .gallery-tile--hero,
  .gallery-tile--wide,
  .gallery-tile--tall,
  .gallery-tile--small {
    grid-column: span 1;
    grid-row: span 1;
  }

  .gallery-lightbox-main {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .gallery-nav-btn {
    display: none;
  }
}
</style>
