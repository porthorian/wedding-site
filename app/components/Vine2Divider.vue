<template>
  <div ref="rootRef" class="rsvp-vine" aria-hidden="true" v-html="vineSvgMarkup" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import vine2Svg from '~/assets/svgs/vine2.svg?raw'

const rootRef = ref<HTMLElement | null>(null)

const vineSvgMarkup = vine2Svg
  .replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')
  .replace(
    '<path style="fill:#2F2F30;" d="M444.18,201.195"',
    '<path class="rsvp-vine-static" style="fill:#2F2F30;" d="M444.18,201.195"'
  )
  .replace(
    '<path style="fill:#2F2F30;" d="M57.741,215.305"',
    '<path class="rsvp-vine-flow" style="fill:#2F2F30;" d="M57.741,215.305"'
  )
</script>

