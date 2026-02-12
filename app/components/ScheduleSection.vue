<template>
  <div ref="rootRef" class="runshow-shell">
    <v-card elevation="1" class="runshow-card section-card rounded-xl">
      <div class="runshow-aura" aria-hidden="true" />
      <v-card-text class="panel-content runshow-content">
        <header class="runshow-header">
          <div class="runshow-heading">
            <p class="runshow-eyebrow">Wedding Day Flow</p>
            <h2 class="panel-title">Our Schedule</h2>
            <p class="muted runshow-intro">
              A smooth guide from ceremony through the last dance.
            </p>
          </div>
        </header>

        <div class="runshow-board">
          <aside class="runshow-side">
            <div class="runshow-date-card" aria-label="Wedding date">
              <span class="runshow-date-label">Wedding Date</span>
              <span class="runshow-date-value">{{ weddingDayLabel }}</span>
            </div>

            <div class="runshow-countdown-card">
              <div class="runshow-countdown-head">
                <div class="section-label runshow-countdown-label">Countdown</div>
                <div class="runshow-countdown-note">Until we say "I do"</div>
              </div>
              <Countdown :date="weddingDate" />
            </div>

            <div class="runshow-facts">
              <div class="runshow-fact">
                <span class="runshow-fact-label">Starts</span>
                <span class="runshow-fact-value">{{ wedding.hero.startsTime }}</span>
              </div>
              <div class="runshow-fact">
                <span class="runshow-fact-label">Ends</span>
                <span class="runshow-fact-value">{{ wedding.hero.endsTime }}</span>
              </div>
            </div>

            <button
              type="button"
              class="runshow-travel-cta"
              @click="scrollToTravelSection"
            >
              <span class="runshow-travel-cta-kicker">Travel &amp; Stay</span>
              <span class="runshow-travel-cta-title">Need Travel or Hotel Details?</span>
              <span class="runshow-travel-cta-copy">
                Jump to travel planning for maps, hotel info, and getting-around notes.
              </span>
              <span class="runshow-travel-cta-action">View Travel Section</span>
            </button>
          </aside>

          <div class="runshow-track" role="list" aria-label="Wedding day schedule">
            <article
              v-for="(item, index) in wedding.schedule"
              :key="`${item.time}-${item.title}`"
              class="runshow-step"
              role="listitem"
            >
              <span class="runshow-step-dot" aria-hidden="true" />
              <div class="runshow-step-card">
                <div class="runshow-step-meta">
                  <span class="runshow-step-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="runshow-step-time">{{ item.time }}</span>
                </div>
                <h3 class="runshow-step-title">{{ item.title }}</h3>
                <p class="muted runshow-step-detail">{{ item.detail }}</p>
              </div>
            </article>
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

const venueMapUrl = computed(
  () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.location)}`
)
const churchMapUrl = computed(
  () =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.churchLocation)}`
)
const rootRef = ref<HTMLElement | null>(null)
const weddingDate = new Date(wedding.dateISO)
const weddingDayLabel = computed(() => {
  const date = new Date(wedding.dateISO)
  if (Number.isNaN(date.getTime())) return 'August 7th'

  const month = date.toLocaleDateString('en-US', { month: 'long' })
  return `${month} ${toOrdinalDay(date.getDate())}`
})
const startTimeLabel = computed(() =>
  `Starts ${wedding.hero.startsTime}`
)
const endTimeLabel = computed(() =>
  `Ends ${wedding.hero.endsTime}`
)
const locationLabel = computed(() => {
  const parts = wedding.location.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`
  return wedding.location
})
const churchLocationLabel = computed(() => {
  const parts = wedding.churchLocation.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`
  return wedding.churchLocation
})
let introAnimation: anime.JSAnimation | null = null

function toOrdinalDay(day: number): string {
  const moduloTen = day % 10
  const moduloHundred = day % 100
  if (moduloTen === 1 && moduloHundred !== 11) return `${day}st`
  if (moduloTen === 2 && moduloHundred !== 12) return `${day}nd`
  if (moduloTen === 3 && moduloHundred !== 13) return `${day}rd`
  return `${day}th`
}

function scrollToTravelSection() {
  const target = document.getElementById('travel')
  if (!target) return

  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'

  target.scrollIntoView({ behavior, block: 'start' })

  if (window.location.hash !== '#travel') {
    history.pushState(null, '', '#travel')
  }
}

function startIntroAnimation() {
  if (introAnimation) return
  const root = rootRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const items = root.querySelectorAll<HTMLElement>(
    '.runshow-heading, .runshow-meta, .runshow-side, .runshow-step',
  )
  if (!items.length) return

  introAnimation = anime.animate(items, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 900,
    delay: anime.stagger(90, { from: 'first' }),
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
.runshow-shell {
  width: 100%;
}

.runshow-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--panel-border-rgb), 0.56);
  background: rgba(var(--panel-surface-rgb), 0.92);
}

.runshow-aura {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 4% 8%, rgba(255, 242, 194, 0.18), transparent 42%),
    radial-gradient(circle at 94% 10%, rgba(var(--light-magenta-rgb), 0.18), transparent 44%),
    radial-gradient(circle at 82% 88%, rgba(var(--sage-rgb), 0.16), transparent 46%);
}

.runshow-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2.3vw, 24px);
}

.runshow-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
}

.runshow-heading {
  max-width: 62ch;
}

.runshow-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.74);
}

.runshow-intro {
  margin: 0;
}

.runshow-meta {
  display: grid;
  gap: 6px;
  justify-items: end;
  max-width: min(560px, 100%);
}

.runshow-meta-line {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 10px;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.78);
}

.runshow-meta-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 14px;
}

.runshow-meta-link {
  font-size: 12px;
  letter-spacing: 0.02em;
  color: rgba(var(--ink-rgb), 0.84);
  text-decoration: none;
  border-bottom: 1px solid rgba(var(--panel-border-rgb), 0.62);
  transition: color 180ms ease, border-color 180ms ease;
}

.runshow-meta-link:hover {
  color: rgba(var(--v-theme-primary), 0.98);
  border-color: rgba(var(--v-theme-primary), 0.56);
}

.runshow-meta-link:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.36);
  outline-offset: 2px;
  color: rgba(var(--v-theme-primary), 0.98);
  border-color: rgba(var(--v-theme-primary), 0.56);
}

.runshow-board {
  display: grid;
  grid-template-columns: minmax(290px, 360px) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.runshow-side {
  display: grid;
  gap: 12px;
}

.runshow-date-card {
  display: grid;
  gap: 3px;
  border-radius: 14px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.4);
  background:
    radial-gradient(circle at 88% 20%, rgba(var(--sage-rgb), 0.16), transparent 42%),
    rgba(var(--panel-surface-rgb), 0.76);
  padding: 10px 12px;
}

.runshow-date-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.76);
}

.runshow-date-value {
  font-family: var(--font-title);
  font-size: clamp(30px, 2.3vw, 36px);
  line-height: 0.9;
  color: var(--paper-ink);
}

.runshow-countdown-card {
  position: relative;
  border-radius: 16px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.48);
  background:
    radial-gradient(circle at 88% 14%, rgba(var(--blush-rgb), 0.22), transparent 48%),
    linear-gradient(148deg, rgba(var(--panel-surface-rgb), 0.96), rgba(var(--panel-surface-rgb), 0.82));
  box-shadow: 0 14px 24px rgba(var(--ink-rgb), 0.1);
}

.runshow-countdown-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 0;
}

.runshow-countdown-label {
  margin-bottom: 0;
}

.runshow-countdown-note {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(var(--ink-muted-rgb), 0.78);
}

.runshow-countdown-card :deep(.countdown-shell) {
  padding: 10px 12px 12px;
}

.runshow-countdown-card :deep(.countdown-grid) {
  gap: 8px;
}

.runshow-countdown-card :deep(.countdown-cell) {
  padding: 10px 6px;
  border-radius: 10px;
  background: rgba(var(--panel-surface-strong-rgb), 0.76);
}

.runshow-countdown-card :deep(.countdown-value) {
  font-size: clamp(18px, 1.45vw, 21px);
}

.runshow-countdown-card :deep(.countdown-label) {
  font-size: 10px;
  letter-spacing: 0.12em;
}

.runshow-facts {
  display: grid;
  gap: 8px;
}

.runshow-fact {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.34);
  background: rgba(var(--panel-surface-rgb), 0.72);
  padding: 8px 11px;
}

.runshow-fact-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.76);
}

.runshow-fact-value {
  font-family: var(--font-title);
  font-size: 20px;
  line-height: 1;
  color: var(--paper-ink);
}

.runshow-travel-cta {
  appearance: none;
  border: 1px solid rgba(var(--panel-border-rgb), 0.46);
  background:
    radial-gradient(circle at 9% 85%, rgba(var(--blush-rgb), 0.2), transparent 52%),
    radial-gradient(circle at 88% 14%, rgba(var(--sage-rgb), 0.18), transparent 44%),
    rgba(var(--panel-surface-rgb), 0.8);
  box-shadow: 0 12px 22px rgba(var(--ink-rgb), 0.1);
  border-radius: 14px;
  width: 100%;
  display: grid;
  gap: 3px;
  text-align: left;
  padding: 12px;
  cursor: pointer;
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.runshow-travel-cta:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--v-theme-primary), 0.38);
  box-shadow: 0 16px 26px rgba(var(--ink-rgb), 0.12);
}

.runshow-travel-cta:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.36);
  outline-offset: 2px;
}

.runshow-travel-cta-kicker {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.76);
}

.runshow-travel-cta-title {
  font-family: var(--font-title);
  font-size: clamp(25px, 1.95vw, 30px);
  line-height: 0.92;
  color: var(--paper-ink);
}

.runshow-travel-cta-copy {
  font-size: 12px;
  letter-spacing: 0.02em;
  color: rgba(var(--ink-muted-rgb), 0.82);
}

.runshow-travel-cta-action {
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-theme-primary), 0.28);
  background: rgba(var(--v-theme-primary), 0.12);
  padding: 5px 10px;
  font-size: 10px;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.9);
}

.runshow-travel-cta-action::after {
  content: '->';
  transition: transform 180ms ease;
}

.runshow-travel-cta:hover .runshow-travel-cta-action::after,
.runshow-travel-cta:focus-visible .runshow-travel-cta-action::after {
  transform: translateX(2px);
}

.runshow-track {
  position: relative;
  display: grid;
  gap: 10px;
  padding-left: 16px;
}

.runshow-track::before {
  content: '';
  position: absolute;
  left: 24px;
  top: 16px;
  bottom: 16px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    rgba(var(--panel-border-rgb), 0.2) 0%,
    rgba(var(--panel-border-rgb), 0.56) 26%,
    rgba(var(--panel-border-rgb), 0.56) 74%,
    rgba(var(--panel-border-rgb), 0.2) 100%
  );
}

.runshow-step {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
}

.runshow-step-dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  margin-top: 18px;
  background: rgb(var(--v-theme-primary));
  border: 2px solid rgba(var(--panel-surface-rgb), 0.96);
  box-shadow: 0 0 0 5px rgba(var(--v-theme-primary), 0.1);
  z-index: 1;
}

.runshow-step-card {
  border-radius: 14px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.46);
  background:
    radial-gradient(circle at 90% 12%, rgba(var(--blush-rgb), 0.2), transparent 46%),
    rgba(var(--panel-surface-rgb), 0.78);
  box-shadow: 0 14px 24px rgba(var(--ink-rgb), 0.1);
  padding: 12px 14px;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.runshow-step-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.38);
  box-shadow: 0 18px 30px rgba(var(--ink-rgb), 0.12);
}

.runshow-step-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.runshow-step-index {
  display: inline-grid;
  place-items: center;
  min-width: 34px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.3);
  background: rgba(var(--panel-surface-rgb), 0.8);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(var(--ink-muted-rgb), 0.8);
}

.runshow-step-time {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  background: rgba(var(--v-theme-primary), 0.12);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.84);
}

.runshow-step-title {
  margin: 0;
  font-family: var(--font-title);
  font-size: clamp(28px, 2.2vw, 34px);
  line-height: 0.95;
  color: var(--paper-ink);
}

.runshow-step-detail {
  margin: 6px 0 0;
}

@media (max-width: 1180px) {
  .runshow-header {
    grid-template-columns: 1fr;
  }

  .runshow-meta {
    justify-items: flex-start;
    max-width: 100%;
  }

  .runshow-meta-line {
    justify-content: flex-start;
  }

  .runshow-meta-links {
    justify-content: flex-start;
  }

  .runshow-board {
    grid-template-columns: 1fr;
  }

  .runshow-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runshow-date-card,
  .runshow-countdown-card {
    grid-column: 1 / -1;
  }

  .runshow-travel-cta {
    grid-column: 1 / -1;
  }

  .runshow-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .runshow-content {
    gap: 14px;
  }

  .runshow-meta {
    gap: 6px;
  }

  .runshow-meta-line {
    font-size: 10px;
    gap: 4px 8px;
  }

  .runshow-meta-links {
    gap: 4px 10px;
  }

  .runshow-meta-link {
    font-size: 11px;
  }

  .runshow-board {
    gap: 12px;
  }

  .runshow-side {
    grid-template-columns: 1fr;
  }

  .runshow-date-value {
    font-size: clamp(24px, 7vw, 30px);
  }

  .runshow-facts {
    grid-template-columns: 1fr;
  }

  .runshow-travel-cta-title {
    font-size: clamp(21px, 7vw, 26px);
  }

  .runshow-travel-cta-copy {
    font-size: 11px;
  }

  .runshow-countdown-card :deep(.countdown-grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runshow-track {
    padding-left: 10px;
  }

  .runshow-track::before {
    left: 18px;
  }

  .runshow-step-title {
    font-size: clamp(22px, 8vw, 28px);
  }

  .runshow-step-dot {
    width: 13px;
    height: 13px;
  }

  .runshow-step-card {
    padding: 10px 12px;
  }
}

@media (max-width: 560px) {
  .runshow-meta {
    width: 100%;
  }

  .runshow-meta-links {
    display: grid;
    justify-items: start;
    gap: 4px;
  }

  .runshow-date-card {
    padding: 9px 10px;
  }

  .runshow-travel-cta {
    padding: 10px;
  }

  .runshow-track {
    padding-left: 6px;
  }

  .runshow-track::before {
    left: 14px;
  }

  .runshow-step {
    gap: 8px;
  }

  .runshow-step-dot {
    margin-top: 16px;
    box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.12);
  }

  .runshow-step-index {
    min-width: 30px;
    height: 24px;
    font-size: 10px;
  }

  .runshow-step-time {
    padding: 4px 8px;
    font-size: 10px;
  }
}
</style>
