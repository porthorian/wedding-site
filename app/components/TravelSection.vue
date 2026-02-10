<template>
  <div ref="rootRef" class="travel-shell">
    <v-card elevation="1" class="travel-card section-card rounded-xl">
      <div class="travel-decor" aria-hidden="true">
        <WhimsyWindArt class="travel-decor-art travel-decor-art--top" :strength="1.1" />
        <WhimsyWindArt
          class="travel-decor-art travel-decor-art--bottom"
          :draw="false"
          :flutter="false"
          :strength="0.8"
        />
      </div>

      <v-card-text class="panel-content travel-content">
        <div class="travel-header">
          <h2 class="panel-title">Travel &amp; Accommodations</h2>
          <p class="muted travel-intro">
            Everything in one place for booking your stay and planning your weekend logistics.
          </p>
        </div>

        <v-row class="travel-layout" dense>
          <v-col cols="12" md="5">
            <div class="travel-venue-card">
              <v-img :src="wedding.travel.photo" alt="Venue area illustration" class="travel-venue-image" height="300" cover />
              <div class="travel-venue-overlay">
                <div class="travel-venue-kicker">Wedding Weekend</div>
                <div class="travel-venue-title">{{ wedding.location }}</div>
                <v-btn
                  :href="venueMapUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="text-none travel-venue-map-btn"
                  color="primary"
                  variant="elevated"
                  size="small"
                  rounded="pill"
                >
                  Open Venue In Maps
                </v-btn>
              </div>
            </div>

            <div class="travel-note-stack">
              <article
                v-for="(note, index) in wedding.travel.gettingAround"
                :key="note"
                class="travel-note-card"
              >
                <span class="travel-note-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="travel-note-text">{{ note }}</span>
              </article>
            </div>
          </v-col>

          <v-col cols="12" md="7">
            <section class="travel-block">
              <div class="section-label">Hotels</div>
              <div class="travel-hotel-grid">
                <article
                  v-for="hotel in wedding.travel.hotels"
                  :key="hotel.name"
                  class="travel-hotel-card"
                >
                  <h3 class="travel-hotel-name">{{ hotel.name }}</h3>
                  <p class="muted travel-hotel-note">{{ hotel.note }}</p>

                  <div class="travel-hotel-actions">
                    <v-btn
                      :href="hotel.url"
                      target="_blank"
                      rel="noreferrer"
                      class="text-none"
                      color="primary"
                      variant="elevated"
                      size="small"
                    >
                      Book
                    </v-btn>
                    <v-btn
                      :href="getMapSearchUrl(hotel.name)"
                      target="_blank"
                      rel="noreferrer"
                      class="text-none"
                      variant="outlined"
                      size="small"
                    >
                      Map
                    </v-btn>
                  </div>
                </article>
              </div>
            </section>

            <section class="travel-block">
              <div class="section-label">Airports</div>
              <div v-if="airports.length" class="travel-airport-list">
                <article
                  v-for="airport in airports"
                  :key="`${airport.code}-${airport.name}`"
                  class="travel-airport-item"
                >
                  <div class="travel-airport-code">{{ airport.code }}</div>
                  <div class="travel-airport-copy">
                    <div class="travel-airport-name">{{ airport.name }}</div>
                    <div class="muted travel-airport-note">{{ airport.note }}</div>
                  </div>
                </article>
              </div>
              <p v-else class="muted travel-airport-empty">
                Newark Liberty (EWR) is typically the easiest option for this area.
              </p>
            </section>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as anime from 'animejs'
import { wedding } from '~/data/wedding'

const rootRef = ref<HTMLElement | null>(null)
let introAnimation: anime.JSAnimation | null = null

const venueMapUrl = computed(
  () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.location)}`
)

const airports = computed(() => {
  return (wedding.travel.airports || [])
    .map((entry: any) => ({
      code: String(entry?.code || '').trim().toUpperCase(),
      name: String(entry?.name || '').trim(),
      note: String(entry?.note || '').trim(),
    }))
    .filter((entry) => entry.code && entry.name)
})

function getMapSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function startIntroAnimation() {
  if (introAnimation) return
  const root = rootRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const cards = root.querySelectorAll<HTMLElement>(
    '.travel-venue-card, .travel-note-card, .travel-hotel-card, .travel-airport-item'
  )
  if (!cards.length) return

  introAnimation = anime.animate(cards, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 900,
    delay: anime.stagger(80, { from: 'first' }),
    ease: 'outCubic',
  })
}

onMounted(async () => {
  await nextTick()
  startIntroAnimation()
})

onBeforeUnmount(() => {
  introAnimation?.pause()
  introAnimation = null
})
</script>

<style scoped>
.travel-shell {
  width: 100%;
}

.travel-card {
  position: relative;
  overflow: hidden;
}

.travel-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.travel-decor-art {
  position: absolute;
  color: rgba(var(--sage-rgb), 0.34);
}

.travel-decor-art--top {
  top: -160px;
  right: -140px;
  width: min(620px, 62vw);
}

.travel-decor-art--bottom {
  bottom: -200px;
  left: -220px;
  width: min(560px, 54vw);
  opacity: 0.46;
}

.travel-content {
  position: relative;
  z-index: 1;
}

.travel-header {
  margin-bottom: 12px;
}

.travel-intro {
  margin: 0;
  max-width: 60ch;
}

.travel-layout {
  align-items: stretch;
}

.travel-venue-card {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.44);
  box-shadow: 0 16px 30px rgba(var(--ink-rgb), 0.12);
}

.travel-venue-image {
  filter: saturate(0.88) contrast(0.95);
}

.travel-venue-overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: 14px;
  background: linear-gradient(
    to top,
    rgba(var(--ink-rgb), 0.78),
    rgba(var(--ink-rgb), 0.12)
  );
  color: #fff;
  display: grid;
  gap: 8px;
}

.travel-venue-kicker {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.88;
}

.travel-venue-title {
  font-family: var(--font-title);
  font-size: 22px;
  line-height: 1.1;
}

:deep(.travel-venue-map-btn.v-btn) {
  font-weight: 600;
  letter-spacing: 0.08em;
  padding-inline: 14px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.34);
}

:deep(.travel-venue-map-btn.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.4);
}

:deep(.travel-venue-map-btn .v-btn__overlay) {
  opacity: 0.1;
}

.travel-note-stack {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.travel-note-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: baseline;
  border-radius: 12px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.36);
  background: rgba(var(--panel-surface-strong-rgb), 0.8);
  padding: 10px 12px;
}

.travel-note-index {
  font-family: var(--font-title);
  font-size: 14px;
  color: rgba(var(--ink-muted-rgb), 0.74);
}

.travel-note-text {
  color: var(--paper-ink);
  font-size: 14px;
}

.travel-block + .travel-block {
  margin-top: 14px;
}

.travel-hotel-grid {
  display: grid;
  gap: 10px;
}

.travel-hotel-card {
  border-radius: 14px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.4);
  background: rgba(var(--panel-surface-strong-rgb), 0.82);
  padding: 12px;
  box-shadow: 0 12px 24px rgba(var(--ink-rgb), 0.08);
}

.travel-hotel-name {
  margin: 0;
  font-family: var(--font-title);
  font-size: 22px;
  line-height: 1;
  color: var(--paper-ink);
}

.travel-hotel-note {
  margin: 8px 0 0;
}

.travel-hotel-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.travel-airport-list {
  display: grid;
  gap: 8px;
}

.travel-airport-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  border-radius: 12px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.34);
  background: rgba(var(--panel-surface-rgb), 0.72);
  padding: 10px 12px;
}

.travel-airport-code {
  font-family: var(--font-title);
  font-size: 22px;
  line-height: 1;
  color: var(--paper-ink);
  min-width: 2.8ch;
}

.travel-airport-name {
  color: var(--paper-ink);
  font-weight: 600;
}

.travel-airport-note {
  margin-top: 2px;
}

.travel-airport-empty {
  margin: 0;
}

@media (max-width: 960px) {
  .travel-decor-art--top {
    top: -120px;
    right: -180px;
    width: min(560px, 110vw);
  }

  .travel-decor-art--bottom {
    bottom: -180px;
    left: -250px;
    width: min(520px, 108vw);
  }

  .travel-venue-title {
    font-size: clamp(20px, 6vw, 26px);
  }
}
</style>
