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
          <v-btn
            class="text-none"
            color="primary"
            variant="elevated"
            @click="openLightbox(0)"
          >
            Open Full Gallery ({{ totalPhotos }})
          </v-btn>
        </header>

        <div class="gallery-mosaic">
          <button
            v-for="(photo, index) in mosaicPhotos"
            :key="photo.url"
            type="button"
            class="gallery-tile"
            :class="tileClass(index)"
            :aria-label="`Open ${photoLabel(photo.url, index)} in gallery`"
            @click="openLightbox(index)"
          >
            <v-img
              :src="photo.url"
              :alt="photoLabel(photo.url, index)"
              class="gallery-tile-image"
              cover
              height="100%"
            />
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
          <button type="button" class="gallery-nav-btn" aria-label="Previous photo" @click="prevPhoto">
            ‹
          </button>

          <div class="gallery-lightbox-image-wrap">
            <v-img
              v-if="activePhoto"
              :src="activePhoto.url"
              :alt="photoLabel(activePhoto.url, galleryIndex)"
              class="gallery-lightbox-image"
              contain
              height="70vh"
            />
          </div>

          <button type="button" class="gallery-nav-btn" aria-label="Next photo" @click="nextPhoto">
            ›
          </button>
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
            @click="galleryIndex = index"
          >
            <v-img :src="photo.url" :alt="photoLabel(photo.url, index)" cover height="72" />
          </button>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as anime from 'animejs'
import { wedding } from '~/data/wedding'

const rootRef = ref<HTMLElement | null>(null)
const galleryIndex = ref(0)
const isLightboxOpen = ref(false)
let introAnimation: anime.JSAnimation | null = null

const photos = computed(() => wedding.gallery ?? [])
const totalPhotos = computed(() => photos.value.length)
const mosaicPhotos = computed(() => photos.value.slice(0, Math.min(12, photos.value.length)))
const hiddenPhotoCount = computed(() => Math.max(0, totalPhotos.value - mosaicPhotos.value.length))
const activePhoto = computed(() => photos.value[galleryIndex.value] ?? null)

function tileClass(index: number): string {
  const pattern = [
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
  ]
  return pattern[index % pattern.length]
}

function photoLabel(url: string, index: number): string {
  const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
  const normalized = fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim()
  return normalized || `Photo ${index + 1}`
}

function openLightbox(index: number) {
  if (!totalPhotos.value) return
  galleryIndex.value = Math.min(Math.max(index, 0), totalPhotos.value - 1)
  isLightboxOpen.value = true
}

function nextPhoto() {
  if (!totalPhotos.value) return
  galleryIndex.value = (galleryIndex.value + 1) % totalPhotos.value
}

function prevPhoto() {
  if (!totalPhotos.value) return
  galleryIndex.value = (galleryIndex.value - 1 + totalPhotos.value) % totalPhotos.value
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

onMounted(async () => {
  await nextTick()
  startIntroAnimation()
  window.addEventListener('keydown', onWindowKeydown)
})

onBeforeUnmount(() => {
  introAnimation?.pause()
  introAnimation = null
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

.gallery-mosaic {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 56px;
  gap: 10px;
}

.gallery-tile {
  position: relative;
  overflow: hidden;
  border: 0;
  padding: 0;
  cursor: zoom-in;
  border-radius: 12px;
  box-shadow: 0 12px 20px rgba(var(--ink-rgb), 0.12);
  transition: transform 230ms ease, box-shadow 230ms ease;
}

.gallery-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 30px rgba(var(--ink-rgb), 0.16);
}

.gallery-tile-image {
  width: 100%;
  height: 100%;
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
  min-width: 0;
}

.gallery-nav-btn {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.32);
  background: rgba(var(--panel-surface-rgb), 0.8);
  font-size: 28px;
  line-height: 1;
  color: var(--paper-ink);
  cursor: pointer;
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

.gallery-thumb--active {
  opacity: 1;
  border-color: rgba(var(--v-theme-primary), 0.7);
}

@media (max-width: 960px) {
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
