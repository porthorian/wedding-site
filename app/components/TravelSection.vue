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
        <header class="travel-header">
          <h2 class="panel-title">Travel &amp; Accommodations</h2>
          <p class="muted travel-intro">
            Everything in one place for booking your stay and planning your weekend logistics.
          </p>
        </header>

        <article class="travel-hero">
          <v-img
            :src="wedding.travel.photo"
            alt="The TillingHouse sketch"
            class="travel-hero-image"
            cover
          />
          <div class="travel-hero-overlay">
            <div class="travel-hero-meta">
              <span class="travel-hero-kicker">Wedding Weekend Venue</span>
              <span class="travel-hero-date">{{ wedding.hero.dateDisplay }}</span>
            </div>
            <h3 class="travel-hero-title">{{ wedding.location }}</h3>
            <p class="travel-hero-copy">Ceremony and reception destination for the weekend.</p>
            <v-btn
              :href="venueMapUrl"
              target="_blank"
              rel="noreferrer"
              class="text-none travel-hero-map-btn"
              color="primary"
              variant="elevated"
              rounded="pill"
            >
              Open Venue In Maps
            </v-btn>
          </div>
        </article>

        <div class="travel-bottom">
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

          <div class="travel-side-stack">
            <section class="travel-block" v-if="airports.length >= 1">
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

            <section class="travel-block">
              <div class="section-label">Getting Around</div>
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
            </section>
          </div>
        </div>
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
    '.travel-header, .travel-hero, .travel-hotel-card, .travel-airport-item, .travel-note-card'
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
  border: 1px solid rgba(var(--panel-border-rgb), 0.56);
  background: rgba(var(--panel-surface-rgb), 0.92);
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
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vw, 20px);
}

.travel-header {
  display: grid;
  gap: 2px;
}

.travel-intro {
  margin: 0;
  max-width: 62ch;
}

.travel-hero {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.52);
  box-shadow: 0 20px 34px rgba(var(--ink-rgb), 0.15);
  min-height: clamp(260px, 34vw, 380px);
}

.travel-hero-image {
  height: clamp(260px, 34vw, 380px);
}

.travel-hero-image :deep(.v-img__img) {
  filter: saturate(0.9) contrast(0.97);
}

.travel-hero-overlay {
  position: absolute;
  inset: 0;
  padding: clamp(16px, 2.4vw, 24px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  background: linear-gradient(
    180deg,
    rgba(var(--ink-rgb), 0.22) 16%,
    rgba(var(--ink-rgb), 0.84) 84%
  );
  color: #fff;
}

.travel-hero-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.travel-hero-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  font-size: 11px;
  letter-spacing: 0.16em;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: linear-gradient(180deg, rgba(18, 18, 18, 0.82), rgba(18, 18, 18, 0.62));
  color: rgba(255, 255, 255, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 8px 18px rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(2px);
  padding: 6px 12px;
}

.travel-hero-date {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  font-size: 11px;
  letter-spacing: 0.1em;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 999px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.46);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(240, 240, 240, 0.9));
  color: rgba(var(--ink-rgb), 0.95);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 8px 18px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(2px);
  padding: 6px 12px;
}

.travel-hero-title {
  margin: 0;
  font-family: var(--font-title);
  font-size: clamp(28px, 3.3vw, 42px);
  line-height: 0.96;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.42);
}

.travel-hero-copy {
  margin: 0;
  font-size: 14px;
  max-width: 52ch;
  color: rgba(255, 255, 255, 0.9);
}

:deep(.travel-hero-map-btn.v-btn) {
  align-self: flex-start;
  height: 42px;
  font-weight: 700;
  letter-spacing: 0.13em;
  padding-inline: 20px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.6);
  background: rgba(255, 255, 255, 0.96) !important;
  color: rgba(var(--ink-rgb), 0.95) !important;
  box-shadow: 0 14px 24px rgba(0, 0, 0, 0.28);
}

:deep(.travel-hero-map-btn.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.34);
}

:deep(.travel-hero-map-btn .v-btn__overlay) {
  opacity: 0.06;
}

.travel-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 12px;
  align-items: start;
}

.travel-side-stack {
  display: grid;
  gap: 12px;
}

.travel-block {
  border-radius: 16px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.4);
  background: linear-gradient(
    144deg,
    rgba(var(--panel-surface-rgb), 0.92),
    rgba(var(--panel-surface-rgb), 0.78)
  );
  box-shadow: 0 12px 22px rgba(var(--ink-rgb), 0.08);
  padding: 12px;
}

.travel-note-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
  border-radius: 12px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.34);
  background: rgba(var(--panel-surface-strong-rgb), 0.76);
  padding: 10px 12px;
}

.travel-note-index {
  font-family: var(--font-title);
  font-size: 15px;
  line-height: 1;
  color: rgba(var(--ink-muted-rgb), 0.74);
}

.travel-note-text {
  color: var(--paper-ink);
  font-size: 14px;
}

.travel-note-stack {
  display: grid;
  gap: 8px;
}

.travel-hotel-grid {
  display: grid;
  gap: 10px;
}

.travel-hotel-card {
  border-radius: 14px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.4);
  background: rgba(var(--panel-surface-strong-rgb), 0.84);
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

@media (max-width: 1080px) {
  .travel-bottom {
    grid-template-columns: 1fr;
  }
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

  .travel-content {
    gap: 12px;
  }

  .travel-hero-title {
    font-size: clamp(20px, 6vw, 26px);
  }

  :deep(.travel-hero-map-btn.v-btn) {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .travel-block {
    padding: 10px;
  }

  .travel-hotel-name {
    font-size: 20px;
  }
}
</style>
