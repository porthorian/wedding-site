<template>
  <section class="min-h-screen flex flex-col justify-center items-center bg-primary text-dark font-serif">
    <div class="w-full h-[60vh] bg-cover bg-center flex items-center justify-center" :style="`background-image: url('/hero.jpg')`">
      <div class="bg-white/70 p-8 rounded-xl shadow-lg text-center">
  <h1 class="text-5xl md:text-7xl font-script mb-2">Rosa & Vinnie</h1>
  <p class="text-2xl mb-4">August 7, 2026 &middot; Tinton Falls, NJ @ The Tillinghouse</p>
        <p class="text-lg font-light">Welcome to our wedding website! We’re so glad you’re here to celebrate with us.</p>
      </div>
    </div>
    <div class="mt-8">
      <nuxt-link to="#our-story" class="underline text-accent hover:text-flower transition">Read Our Story ↓</nuxt-link>
    </div>
    <div class="mt-12">
  <Countdown :date="new Date('2026-08-07T15:00:00')" />
    </div>
  </section>
</template>

<script setup lang="ts">
import Countdown from '~/components/Countdown.vue'
</script>

<style scoped>
.font-script {
  font-family: 'Dancing Script', cursive;
}
</style>
