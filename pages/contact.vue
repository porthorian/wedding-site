<template>
  <section class="max-w-2xl mx-auto py-16 px-4 text-center">
    <h2 class="text-4xl font-script mb-8 text-accent">Contact & Closing</h2>
  <p class="text-lg text-dark/80 mb-4">For questions, email us at <a href="mailto:wedding@rosaandvinnie.com" class="underline text-accent">wedding@rosaandvinnie.com</a></p>
    <p class="text-lg text-dark/80 mb-8">Thank you for being part of our special day. We can’t wait to celebrate with you!</p>
  <Countdown :date="new Date('2026-08-07T15:00:00')" />
  </section>
</template>

<script setup lang="ts">
import Countdown from '~/components/Countdown.vue'
</script>
