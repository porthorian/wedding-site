<template>
  <v-card elevation="0" class="rsvp-card rsvp-card--cta">
    <div class="rsvp-bg-image" :style="rsvpBgStyle" aria-hidden="true" />
    <v-card-text class="panel-content panel-content--rsvp rsvp-cta">
      <p class="eyebrow">Kindly reply</p>
      <h2 class="panel-title">RSVP</h2>
      <p class="rsvp-cta-copy">
        Please enter the name on your invitation to let us know whether you will be joining us.
      </p>
      <p class="rsvp-cta-deadline">
        Kindly reply by <strong>July 17, 2026</strong>.
      </p>
      <Vine2Divider />
      <v-btn to="/rsvp" color="primary" class="text-none rsvp-cta-button" variant="elevated" size="large">
        Open RSVP
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { wedding } from '~/data/wedding'

const rsvpPhotoSrc = computed(() => wedding.travel.photo)
const rsvpBgStyle = computed(() => ({
  backgroundImage: rsvpPhotoSrc.value ? `url(${rsvpPhotoSrc.value})` : 'none',
}))
</script>
