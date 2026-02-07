<template>
  <div ref="rootRef" class="schedule-shell">
    <v-card elevation="1" class="schedule-card rounded-xl">
      <div class="schedule-decor" aria-hidden="true">
        <WhimsyWindArt class="schedule-decor-art schedule-decor-art--right" :strength="1.2" />
        <WhimsyWindArt
          class="schedule-decor-art schedule-decor-art--left"
          :draw="false"
          :flutter="false"
          :strength="0.9"
          style="color: rgba(var(--magenta-main-rgb), 0.72)"
        />
      </div>

      <v-card-text class="panel-content schedule-content">
        <div class="schedule-header">
          <h2 class="panel-title">Our Schedule</h2>
          <div class="muted schedule-subtitle">
            {{ wedding.hero.dateDisplay }} • {{ wedding.hero.timeDisplay }}
          </div>
        </div>

      <v-timeline
        direction="horizontal"
        density="compact"
        align="center"
        justify="center"
        line-color="primary"
        class="schedule-timeline"
      >
        <v-timeline-item
          v-for="item in wedding.schedule"
          :key="item.time"
          dot-color="primary"
          size="small"
        >
          <div class="schedule-item">
            <div class="schedule-item-inner">
              <div class="schedule-time">{{ item.time }}</div>
              <div class="schedule-item-title">{{ item.title }}</div>
              <div class="muted schedule-item-detail">{{ item.detail }}</div>
            </div>
          </div>
        </v-timeline-item>
      </v-timeline>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as anime from 'animejs'
import { wedding } from '~/data/wedding'

const rootRef = ref<HTMLElement | null>(null)
let introAnimation: anime.JSAnimation | null = null

function startIntroAnimation() {
  if (introAnimation) return
  const root = rootRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const items = root.querySelectorAll<HTMLElement>('.schedule-item')
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
