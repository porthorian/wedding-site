<template>
  <div>
    <nav class="fixed top-0 left-0 w-full bg-white/80 shadow z-50 flex justify-center py-3">
      <ul class="flex gap-6 text-lg font-serif">
        <li><NuxtLink to="/" class="px-2 py-1 rounded hover:bg-accent/20 transition">Home</NuxtLink></li>
        <li><NuxtLink to="/our-story" class="px-2 py-1 rounded hover:bg-accent/20 transition">Our Story</NuxtLink></li>
        <li><NuxtLink to="/event-details" class="px-2 py-1 rounded hover:bg-accent/20 transition">Event Details</NuxtLink></li>
        <li><NuxtLink to="/travel-stay" class="px-2 py-1 rounded hover:bg-accent/20 transition">Travel & Stay</NuxtLink></li>
        <li><NuxtLink to="/wedding-party" class="px-2 py-1 rounded hover:bg-accent/20 transition">Wedding Party</NuxtLink></li>
        <li><NuxtLink to="/registry" class="px-2 py-1 rounded hover:bg-accent/20 transition">Registry</NuxtLink></li>
        <li><NuxtLink to="/rsvp" class="px-2 py-1 rounded hover:bg-accent/20 transition">RSVP</NuxtLink></li>
        <li><NuxtLink to="/faq" class="px-2 py-1 rounded hover:bg-accent/20 transition">FAQ</NuxtLink></li>
        <li><NuxtLink to="/gallery" class="px-2 py-1 rounded hover:bg-accent/20 transition">Gallery</NuxtLink></li>
        <li><NuxtLink to="/contact" class="px-2 py-1 rounded hover:bg-accent/20 transition">Contact</NuxtLink></li>
      </ul>
    </nav>
    <main class="pt-20">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup>
// No script needed
</script>

<style scoped>
</style>
