<template>
  <div ref="rootRef" class="rsvp-vine" aria-hidden="true" v-html="vineSvgMarkup" />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as anime from 'animejs'
import vine2Svg from '~/assets/svgs/vine2.svg?raw'

const rootRef = ref<HTMLElement | null>(null)

const vineSvgMarkup = vine2Svg
  .replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')
  .replace(
    '<path style="fill:#2F2F30;" d="M444.18,201.195',
    '<path class="rsvp-vine-static" style="fill:#2F2F30;" d="M444.18,201.195'
  )
  .replace(
    '<path style="fill:#2F2F30;" d="M57.741,215.305',
    '<path class="rsvp-vine-flow" style="fill:#2F2F30;" d="M57.741,215.305'
  )

let vineFlowAnimation: anime.JSAnimation | null = null
let vineLeafAnimation: anime.JSAnimation | null = null

function startVineAnimation() {
  if (vineFlowAnimation || vineLeafAnimation) return
  const root = rootRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const flow = root.querySelector('path.rsvp-vine-flow')
  const leaves = root.querySelectorAll('path:not(.rsvp-vine-static):not(.rsvp-vine-flow)')

  if (flow) {
    vineFlowAnimation = anime.animate(flow, {
      keyframes: [
        { translateX: -3, translateY: 0.5, rotate: -0.6 },
        { translateX: 3, translateY: -0.5, rotate: 0.6 },
        { translateX: -3, translateY: 0.5, rotate: -0.6 },
      ],
      duration: 8500,
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    })
  }

  if (leaves.length) {
    vineLeafAnimation = anime.animate(leaves, {
      keyframes: [
        { translateX: -2, translateY: 0.5, rotate: -0.8 },
        { translateX: 2, translateY: -0.5, rotate: 0.8 },
        { translateX: -2, translateY: 0.5, rotate: -0.8 },
      ],
      duration: 6800,
      delay: anime.stagger(45, { from: 'center' }),
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    })
  }
}

onMounted(async () => {
  await nextTick()
  startVineAnimation()
})

onBeforeUnmount(() => {
  vineFlowAnimation?.pause()
  vineLeafAnimation?.pause()
  vineFlowAnimation = null
  vineLeafAnimation = null
})
</script>

