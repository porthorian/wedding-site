<template>
  <footer ref="rootRef" class="site-footer">
    <div class="site-footer-ambient" aria-hidden="true" />
    <div class="site-footer-art" aria-hidden="true" v-html="footerArtSvg" />

    <div class="site-footer-content">
      <p class="site-footer-script display-script">Rosa &amp; Vincent</p>
      <p class="site-footer-note muted">See you on the dance floor.</p>
      <Vine2Divider class="site-footer-vine" />
      <p class="site-footer-copyright">&copy; Vinnie Marone</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as anime from 'animejs'
import footerSvgRaw from '~/assets/svgs/vine2.svg?raw'

const rootRef = ref<HTMLElement | null>(null)
let introAnimation: anime.JSAnimation | null = null
let swayAnimation: anime.JSAnimation | null = null
let pulseAnimation: anime.JSAnimation | null = null

const footerArtSvg = (() => {
  const idx = footerSvgRaw.indexOf('<svg')
  const markup = idx >= 0 ? footerSvgRaw.slice(idx) : footerSvgRaw
  return markup.replace(
    '<svg ',
    '<svg preserveAspectRatio="xMidYMid meet" focusable="false" class="site-footer-svg" ',
  )
})()

function startFooterAnimation() {
  if (introAnimation) return

  const root = rootRef.value
  if (!root) return

  const introNodes = root.querySelectorAll<HTMLElement>('.site-footer-art, .site-footer-content')
  if (!introNodes.length) return

  introAnimation = anime.animate(introNodes, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 900,
    delay: anime.stagger(140, { from: 'first' }),
    ease: 'outCubic',
  })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const svg = root.querySelector<SVGElement>('.site-footer-art svg')
  if (svg) {
    swayAnimation = anime.animate(svg, {
      keyframes: [
        { translateX: -7, translateY: 1, rotate: -0.6 },
        { translateX: 7, translateY: -1, rotate: 0.6 },
        { translateX: -7, translateY: 1, rotate: -0.6 },
      ],
      duration: 12000,
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    })
  }

  const paths = Array.from(root.querySelectorAll<SVGPathElement>('.site-footer-art path'))
  if (paths.length) {
    const stride = Math.max(1, Math.floor(paths.length / 80))
    const sampled = paths.filter((_, index) => index % stride === 0)

    pulseAnimation = anime.animate(sampled, {
      opacity: [0.2, 0.62, 0.2],
      duration: 3400,
      delay: anime.stagger(80, { from: 'center' }),
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    })
  }
}

onMounted(async () => {
  await nextTick()
  startFooterAnimation()
})

onBeforeUnmount(() => {
  introAnimation?.pause()
  swayAnimation?.pause()
  pulseAnimation?.pause()
  introAnimation = null
  swayAnimation = null
  pulseAnimation = null
})
</script>

<style scoped>
.site-footer {
  position: relative;
  width: min(1240px, 100%);
  margin-inline: auto;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(var(--panel-border-rgb), 0.5);
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 247, 221, 0.16), transparent 42%),
    radial-gradient(circle at 90% 8%, rgba(var(--light-magenta-rgb), 0.16), transparent 46%),
    linear-gradient(165deg, rgba(var(--panel-surface-rgb), 0.95) 0%, rgba(var(--panel-surface-rgb), 0.86) 100%);
  box-shadow: 0 22px 36px rgba(var(--ink-rgb), 0.1);
  min-height: clamp(190px, 30svh, 280px);
}

.site-footer-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 70%, rgba(var(--sage-rgb), 0.1), transparent 42%),
    radial-gradient(circle at 86% 72%, rgba(var(--blush-rgb), 0.14), transparent 44%);
}

.site-footer-art {
  position: absolute;
  left: -10%;
  right: -10%;
  top: -6%;
  bottom: -18%;
  color: rgba(var(--sage-rgb), 0.32);
  opacity: 0.58;
  -webkit-mask-image: radial-gradient(
    ellipse 84% 58% at 50% 46%,
    rgba(0, 0, 0, 0) 0 36%,
    rgba(0, 0, 0, 0.76) 62%,
    rgba(0, 0, 0, 1) 100%
  );
  mask-image: radial-gradient(
    ellipse 84% 58% at 50% 46%,
    rgba(0, 0, 0, 0) 0 36%,
    rgba(0, 0, 0, 0.76) 62%,
    rgba(0, 0, 0, 1) 100%
  );
  pointer-events: none;
}

.site-footer-art :deep(svg) {
  width: 122%;
  min-width: 700px;
  height: 100%;
  display: block;
}

.site-footer-art :deep(path) {
  fill: currentColor !important;
}

.site-footer-content {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: clamp(190px, 30svh, 280px);
  width: min(760px, 100%);
  margin-inline: auto;
  padding: clamp(14px, 2vw, 24px);
  padding-bottom: max(clamp(14px, 2vw, 24px), env(safe-area-inset-bottom));
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  gap: 6px;
}

.site-footer-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(var(--ink-muted-rgb), 0.76);
}

.site-footer-script {
  margin: 0;
  font-size: clamp(40px, 6.2vw, 68px);
  line-height: 0.9;
  color: var(--paper-ink);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
}

.site-footer-note {
  margin: 0;
  font-size: 14px;
}

.site-footer-vine {
  width: min(260px, 68%);
  height: 38px;
  opacity: 0.74;
}

.site-footer-copyright {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: rgba(var(--ink-muted-rgb), 0.82);
}

@media (max-width: 760px) {
  .site-footer {
    border-radius: 18px;
    min-height: clamp(170px, 28svh, 220px);
  }

  .site-footer-content {
    min-height: clamp(170px, 28svh, 220px);
    gap: 4px;
    padding-inline: 12px;
  }

  .site-footer-art {
    left: -22%;
    right: -22%;
    top: -12%;
    bottom: -22%;
  }

  .site-footer-script {
    font-size: clamp(34px, 11.2vw, 54px);
    line-height: 0.88;
  }

  .site-footer-vine {
    height: 32px;
    width: min(220px, 74%);
  }

  .site-footer-copyright {
    letter-spacing: 0.08em;
  }
}
</style>
