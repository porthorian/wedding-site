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

          <div class="runshow-meta" role="list" aria-label="Schedule details">
            <span class="runshow-pill" role="listitem">{{ wedding.hero.dateDisplay }}</span>
            <span class="runshow-pill" role="listitem">{{ startTimeLabel }}</span>
            <v-btn
              class="runshow-pill runshow-pill--location"
              role="listitem"
              variant="tonal"
              color="primary"
              size="small"
              :href="venueMapUrl"
              target="_blank"
              rel="noopener"
            >
              {{ locationLabel }}
            </v-btn>
          </div>
        </header>

        <div class="runshow-board">
          <aside class="runshow-side">
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
                <span class="runshow-fact-value">{{ firstScheduleItem?.time ?? wedding.hero.timeDisplay }}</span>
              </div>
              <div class="runshow-fact">
                <span class="runshow-fact-label">Ends</span>
                <span class="runshow-fact-value">{{ lastScheduleItem?.time ?? '--:--' }}</span>
              </div>
            </div>
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
const rootRef = ref<HTMLElement | null>(null)
const weddingDate = new Date(wedding.dateISO)
const firstScheduleItem = computed(() => wedding.schedule[0])
const lastScheduleItem = computed(() => wedding.schedule[wedding.schedule.length - 1])
const startTimeLabel = computed(() =>
  firstScheduleItem.value?.time ? `Starts ${firstScheduleItem.value.time}` : wedding.hero.timeDisplay
)
const locationLabel = computed(() => {
  const parts = wedding.location.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`
  return wedding.location
})
let introAnimation: anime.JSAnimation | null = null

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
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.runshow-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.52);
  background: linear-gradient(
    180deg,
    rgba(var(--panel-surface-rgb), 0.96),
    rgba(var(--panel-surface-rgb), 0.84)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 10px 18px rgba(var(--ink-rgb), 0.12);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.88);
  white-space: nowrap;
}

.runshow-pill--location {
  max-width: min(340px, 100%);
  text-overflow: ellipsis;
  overflow: hidden;
}

:deep(.runshow-pill--location .v-btn__content) {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
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
    justify-content: flex-start;
  }

  .runshow-pill--location {
    max-width: 100%;
  }

  .runshow-board {
    grid-template-columns: 1fr;
  }

  .runshow-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .runshow-countdown-card {
    grid-column: 1 / -1;
  }

  .runshow-facts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .runshow-content {
    gap: 14px;
  }

  .runshow-meta {
    gap: 6px;
  }

  .runshow-pill {
    padding: 7px 10px;
    font-size: 10px;
    letter-spacing: 0.08em;
  }

  .runshow-board {
    gap: 12px;
  }

  .runshow-side {
    grid-template-columns: 1fr;
  }

  .runshow-facts {
    grid-template-columns: 1fr;
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

  .runshow-pill {
    max-width: 100%;
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
