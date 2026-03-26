<template>
  <div ref="rootRef" class="registry-shell">
    <v-card elevation="1" class="registry-card section-card rounded-xl">
      <div class="registry-aura" aria-hidden="true" />
      <div class="registry-leaf-layer" aria-hidden="true">
        <span
          v-for="leaf in registryLeafSprites"
          :key="leaf.id"
          class="registry-leaf"
          :style="registryLeafStyle(leaf)"
        >
          <img :src="registryLeafSvgUrl" alt="" loading="lazy" decoding="async" />
        </span>
      </div>
      <v-card-text class="panel-content registry-content">
        <header class="registry-header">
          <div class="registry-header-copy">
            <p class="registry-eyebrow">Gift Registry</p>
            <h2 class="panel-title">Our Registry</h2>
            <p class="muted registry-lede">
              Thank you for celebrating with us. Pick whichever store feels easiest for you.
            </p>
          </div>
        </header>

        <div class="registry-meta" role="list" aria-label="Registry highlights">
          <span class="registry-meta-pill" role="listitem">Gifts optional</span>
        </div>

        <v-row class="registry-grid">
          <v-col
            v-for="(item, index) in wedding.registry"
            :key="item.name"
            cols="12"
            md="4"
          >
            <article
              class="registry-store-card"
              :style="{ '--registry-accent': item.accent || 'rgba(150, 150, 150, 0.2)' }"
            >
              <div class="registry-store-topline">
                <span class="registry-store-no">{{ String(index + 1).padStart(2, '0') }}</span>
                <p class="registry-store-tagline">{{ item.tagline }}</p>
              </div>

              <h3 class="registry-store-title">{{ item.name }}</h3>
              <p class="muted registry-store-blurb">{{ item.blurb }}</p>

              <div class="registry-highlight-block">
                <p class="registry-highlight-label">Best for</p>
                <div class="registry-highlight-list">
                  <span
                    v-for="highlight in item.highlights"
                    :key="`${item.name}-${highlight}`"
                    class="registry-highlight-item"
                  >
                    {{ highlight }}
                  </span>
                </div>
              </div>

              <div class="registry-store-actions">
                <v-btn
                  :href="item.url"
                  target="_blank"
                  rel="noreferrer"
                  class="text-none registry-store-btn"
                  color="primary"
                  variant="flat"
                  block
                >
                  Shop {{ item.name }}
                </v-btn>
                <p class="registry-store-note">Opens {{ item.name }} in a new tab.</p>
              </div>
            </article>
          </v-col>
        </v-row>

        <p class="registry-footer muted">
          Your presence means the most. Gifts are always optional.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as anime from 'animejs'
import registryLeafSvgUrl from '~/assets/svgs/3147334_1016.svg'
import { wedding } from '~/data/wedding'

const rootRef = ref<HTMLElement | null>(null)
type RegistryLeafSprite = {
  id: number
  left: string
  top: string
  size: string
  rotate: string
  opacity: string
  delay: string
  duration: string
  driftX: string
  driftY: string
}

const registryLeafSprites: RegistryLeafSprite[] = [
  { id: 1, left: '-4%', top: '2%', size: '148px', rotate: '-24deg', opacity: '0.17', delay: '-2.6s', duration: '11.8s', driftX: '14px', driftY: '-8px' },
  { id: 2, left: '16%', top: '10%', size: '116px', rotate: '18deg', opacity: '0.16', delay: '-5.1s', duration: '10.6s', driftX: '-12px', driftY: '7px' },
  { id: 3, left: '74%', top: '3%', size: '136px', rotate: '24deg', opacity: '0.17', delay: '-1.8s', duration: '11.2s', driftX: '-15px', driftY: '-7px' },
  { id: 4, left: '88%', top: '19%', size: '112px', rotate: '-16deg', opacity: '0.16', delay: '-7.4s', duration: '10.2s', driftX: '10px', driftY: '7px' },
  { id: 5, left: '-3%', top: '58%', size: '142px', rotate: '-34deg', opacity: '0.17', delay: '-3.7s', duration: '12.2s', driftX: '16px', driftY: '-8px' },
  { id: 6, left: '18%', top: '79%', size: '102px', rotate: '20deg', opacity: '0.15', delay: '-6.3s', duration: '9.8s', driftX: '-10px', driftY: '6px' },
  { id: 7, left: '60%', top: '77%', size: '128px', rotate: '26deg', opacity: '0.17', delay: '-2.2s', duration: '11.4s', driftX: '-14px', driftY: '-7px' },
  { id: 8, left: '84%', top: '66%', size: '122px', rotate: '-22deg', opacity: '0.16', delay: '-4.8s', duration: '10.9s', driftX: '13px', driftY: '8px' },
  { id: 9, left: '43%', top: '-3%', size: '110px', rotate: '-8deg', opacity: '0.15', delay: '-8.6s', duration: '10.4s', driftX: '9px', driftY: '-5px' },
]
let introAnimation: anime.JSAnimation | null = null
let leafIntroAnimation: anime.JSAnimation | null = null

function registryLeafStyle(leaf: RegistryLeafSprite): Record<string, string> {
  return {
    '--registry-leaf-left': leaf.left,
    '--registry-leaf-top': leaf.top,
    '--registry-leaf-size': leaf.size,
    '--registry-leaf-rotate': leaf.rotate,
    '--registry-leaf-opacity': leaf.opacity,
    '--registry-leaf-delay': leaf.delay,
    '--registry-leaf-duration': leaf.duration,
    '--registry-leaf-drift-x': leaf.driftX,
    '--registry-leaf-drift-y': leaf.driftY,
  }
}

function startIntroAnimation() {
  if (introAnimation || leafIntroAnimation) return
  const root = rootRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const contentNodes = root.querySelectorAll<HTMLElement>(
    '.registry-header, .registry-meta-pill, .registry-store-card, .registry-footer',
  )
  if (contentNodes.length) {
    introAnimation = anime.animate(contentNodes, {
      translateY: [14, 0],
      duration: 860,
      delay: anime.stagger(90, { from: 'first' }),
      ease: 'outCubic',
    })
  }

  const leafNodes = root.querySelectorAll<HTMLElement>('.registry-leaf')
  if (!leafNodes.length) return

  leafIntroAnimation = anime.animate(leafNodes, {
    translateY: [10, 0],
    scale: [0.94, 1],
    duration: 980,
    delay: anime.stagger(56, { from: 'center' }),
    ease: 'outCubic',
  })
}

onMounted(async () => {
  await nextTick()
  startIntroAnimation()
})

onBeforeUnmount(() => {
  introAnimation?.pause()
  leafIntroAnimation?.pause()
  introAnimation = null
  leafIntroAnimation = null
})
</script>

<style scoped>
.registry-shell {
  width: 100%;
}

.registry-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--panel-border-rgb), 0.56);
  background: rgba(var(--panel-surface-rgb), 0.9);
}

.registry-aura {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 6% 14%, rgba(255, 239, 180, 0.2), transparent 48%),
    radial-gradient(circle at 88% 10%, rgba(255, 226, 160, 0.16), transparent 44%),
    radial-gradient(circle at 66% 90%, rgba(var(--light-magenta-rgb), 0.16), transparent 50%);
}

.registry-leaf-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.registry-leaf {
  position: absolute;
  left: var(--registry-leaf-left);
  top: var(--registry-leaf-top);
  width: var(--registry-leaf-size);
  opacity: var(--registry-leaf-opacity);
  transform-origin: 50% 50%;
  will-change: transform, opacity;
  animation: registry-leaf-breathe var(--registry-leaf-duration) ease-in-out infinite;
  animation-delay: var(--registry-leaf-delay);
}

.registry-leaf img {
  display: block;
  width: 100%;
  height: auto;
  opacity: 0.76;
  filter: grayscale(1) brightness(0.52) contrast(1.04);
  transform-origin: 50% 50%;
  animation: registry-leaf-wobble calc(var(--registry-leaf-duration) * 0.72) ease-in-out infinite alternate;
}

@keyframes registry-leaf-breathe {
  0% {
    transform: translate3d(0, 0, 0) rotate(var(--registry-leaf-rotate)) scale(0.94);
  }

  50% {
    transform: translate3d(var(--registry-leaf-drift-x), var(--registry-leaf-drift-y), 0)
      rotate(calc(var(--registry-leaf-rotate) + 5deg)) scale(1.02);
  }

  100% {
    transform: translate3d(0, 0, 0) rotate(var(--registry-leaf-rotate)) scale(0.94);
  }
}

@keyframes registry-leaf-wobble {
  0% {
    transform: rotate(-3deg) scale(0.992);
  }

  100% {
    transform: rotate(3deg) scale(1.014);
  }
}

.registry-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 2vw, 24px);
}

.registry-header {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(250px, 0.65fr);
  gap: clamp(12px, 2.4vw, 30px);
  align-items: start;
}

.registry-header-copy {
  max-width: 68ch;
}

.registry-header-copy .panel-title {
  margin: 4px 0 10px;
}

.registry-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.72);
}

.registry-lede {
  margin: 0;
  font-size: clamp(15px, 1.35vw, 18px);
  line-height: 1.54;
}

.registry-how {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.32);
  background: linear-gradient(
    150deg,
    rgba(var(--panel-surface-rgb), 0.92) 0%,
    rgba(var(--panel-surface-rgb), 0.74) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 12px 20px rgba(var(--ink-rgb), 0.06);
}

.registry-how-label {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.84);
}

.registry-how-text {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.52;
  color: rgba(var(--ink-muted-rgb), 0.9);
}

.registry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.registry-meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 13px;
  border-radius: 999px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.34);
  background: rgba(var(--panel-surface-rgb), 0.9);
  box-shadow: 0 8px 14px rgba(var(--ink-rgb), 0.07);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.86);
  white-space: nowrap;
}

.registry-grid {
  margin-inline: -6px;
  align-items: flex-start;
}

.registry-grid :deep(.v-col) {
  padding: 6px;
}

.registry-store-card {
  --registry-accent: rgba(130, 130, 130, 0.2);
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.44);
  padding: 18px;
  background:
    radial-gradient(circle at 92% 8%, var(--registry-accent), transparent 50%),
    linear-gradient(
      160deg,
      rgba(var(--panel-surface-rgb), 0.98) 0%,
      rgba(var(--panel-surface-strong-rgb), 0.86) 100%
    );
  box-shadow: 0 16px 28px rgba(var(--ink-rgb), 0.1);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.registry-store-card::after {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 0;
  height: 3px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(
    90deg,
    rgba(var(--ink-rgb), 0.06) 0%,
    rgba(var(--ink-rgb), 0.2) 50%,
    rgba(var(--ink-rgb), 0.06) 100%
  );
  opacity: 0.28;
}

.registry-store-card:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--panel-border-rgb), 0.58);
  box-shadow: 0 24px 34px rgba(var(--ink-rgb), 0.14);
}

.registry-store-topline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.registry-store-no {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-family: var(--font-title);
  font-size: 13px;
  color: rgba(var(--ink-rgb), 0.86);
  border: 1px solid rgba(var(--panel-border-rgb), 0.3);
  background: rgba(var(--panel-surface-rgb), 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.registry-store-tagline {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--ink-muted-rgb), 0.8);
}

.registry-store-title {
  margin: 10px 0 0;
  font-family: var(--font-title);
  font-size: clamp(30px, 2.9vw, 40px);
  line-height: 0.92;
  color: var(--paper-ink);
}

.registry-store-blurb {
  margin: 12px 0 0;
  line-height: 1.5;
}

.registry-highlight-block {
  margin-top: 14px;
}

.registry-highlight-label {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.82);
}

.registry-highlight-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.registry-highlight-item {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.26);
  background: rgba(var(--panel-surface-rgb), 0.9);
  font-size: 12px;
  color: rgba(var(--ink-rgb), 0.84);
}

.registry-store-actions {
  margin-top: 14px;
  display: grid;
  gap: 8px;
}

.registry-store-btn {
  letter-spacing: 0.07em;
}

.registry-store-note {
  margin: 0;
  font-size: 11px;
  color: rgba(var(--ink-muted-rgb), 0.76);
}

.registry-footer {
  margin: 0;
  text-align: center;
  letter-spacing: 0.02em;
}

@media (max-width: 1180px) {
  .registry-header {
    grid-template-columns: 1fr;
  }

  .registry-how {
    max-width: 480px;
  }
}

@media (max-width: 960px) {
  .registry-leaf {
    width: calc(var(--registry-leaf-size) * 0.82);
    opacity: calc(var(--registry-leaf-opacity) * 0.84);
  }

  .registry-leaf:nth-child(n + 8) {
    display: none;
  }

  .registry-content {
    gap: 12px;
  }

  .registry-header {
    gap: 10px;
  }

  .registry-how {
    padding: 12px 14px;
  }

  .registry-meta-pill {
    padding: 7px 10px;
    font-size: 10px;
    letter-spacing: 0.07em;
  }

  .registry-store-card {
    padding: 16px;
  }

  .registry-store-title {
    font-size: clamp(26px, 8vw, 34px);
    line-height: 0.96;
  }

  .registry-meta {
    gap: 8px;
  }

  .registry-meta-pill {
    white-space: normal;
  }
}

@media (max-width: 600px) {
  .registry-leaf {
    width: calc(var(--registry-leaf-size) * 0.7);
  }

  .registry-leaf:nth-child(n + 6) {
    display: none;
  }

  .registry-store-topline {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .registry-highlight-list {
    gap: 6px;
  }

  .registry-highlight-item {
    padding: 5px 8px;
    font-size: 11px;
  }

  .registry-store-actions {
    margin-top: 12px;
  }

  .registry-store-note {
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .registry-leaf,
  .registry-leaf img {
    animation: none !important;
  }

  .registry-leaf {
    transform: translate3d(0, 0, 0) rotate(var(--registry-leaf-rotate)) scale(0.94);
  }
}
</style>
