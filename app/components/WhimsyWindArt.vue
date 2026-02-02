<template>
  <div ref="rootRef" class="whimsy-wind-art" aria-hidden="true" v-html="svgMarkup" />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as anime from 'animejs'
import rawSvg from '~/assets/svgs/25563959_7103520.svg?raw'

const props = withDefaults(
  defineProps<{
    draw?: boolean
    sway?: boolean
    flutter?: boolean
    strength?: number
  }>(),
  { draw: true, sway: true, flutter: true, strength: 1 }
)

const rootRef = ref<HTMLElement | null>(null)

const svgMarkup = (() => {
  const idx = rawSvg.indexOf('<svg')
  const markup = idx >= 0 ? rawSvg.slice(idx) : rawSvg

  return markup
    .replace(/<rect[^>]*width="500"[^>]*height="500"[^>]*\/>\s*/m, '')
    .replace(
      '<svg ',
      '<svg preserveAspectRatio="xMidYMid meet" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" '
    )
})()

let swayAnimation: anime.JSAnimation | null = null
let flutterAnimation: anime.JSAnimation | null = null
let drawAnimation: anime.JSAnimation | null = null

function startWindAnimation() {
  if (swayAnimation || flutterAnimation || drawAnimation) return
  const root = rootRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const svg = root.querySelector('svg')
  if (!svg) return

  const strength = Number.isFinite(props.strength) ? Math.max(0.2, props.strength) : 1
  const paths = svg.querySelectorAll<SVGPathElement>('path')

  if (props.draw && paths.length) {
    for (const path of paths) {
      try {
        const length = path.getTotalLength()
        path.style.strokeDasharray = `${length}`
        path.style.strokeDashoffset = `${length}`
        path.style.opacity = '0'
      } catch {
        // ignore
      }
    }

    drawAnimation = anime.animate(paths, {
      strokeDashoffset: 0,
      opacity: [0, 1],
      duration: 1900,
      delay: anime.stagger(70, { from: 'center' }),
      ease: 'outSine',
    })
  }

  if (props.flutter && paths.length) {
    flutterAnimation = anime.animate(paths, {
      keyframes: [
        { rotate: -0.9 * strength, translateX: -1.2 * strength, translateY: 0.6 * strength },
        { rotate: 0.9 * strength, translateX: 1.2 * strength, translateY: -0.6 * strength },
        { rotate: -0.9 * strength, translateX: -1.2 * strength, translateY: 0.6 * strength },
      ],
      duration: 7200,
      delay: anime.stagger(40, { from: 'center' }),
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    })
  }

  if (props.sway) {
    swayAnimation = anime.animate(svg, {
      keyframes: [
        { rotate: -1.6 * strength, translateX: -5 * strength, translateY: 1.6 * strength, scaleX: 0.992, scaleY: 1.008 },
        { rotate: 1.8 * strength, translateX: 5 * strength, translateY: -2.1 * strength, scaleX: 1.008, scaleY: 0.992 },
        { rotate: -1.6 * strength, translateX: -5 * strength, translateY: 1.6 * strength, scaleX: 0.992, scaleY: 1.008 },
      ],
      duration: 9800,
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    })
  }
}

onMounted(async () => {
  await nextTick()
  startWindAnimation()
})

onBeforeUnmount(() => {
  swayAnimation?.pause()
  flutterAnimation?.pause()
  drawAnimation?.pause()
  swayAnimation = null
  flutterAnimation = null
  drawAnimation = null
})
</script>
