<template>
  <section class="max-w-2xl mx-auto py-16 px-4">
    <h2 class="text-4xl font-script text-center mb-8 text-accent">RSVP</h2>
    <form @submit.prevent="submitForm" class="flex flex-col gap-4 bg-white/80 p-8 rounded-xl shadow">
  <input v-model="form.name" required type="text" placeholder="Your Name" class="border border-accent rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-flower transition" />
  <input v-model="form.email" required type="email" placeholder="Email" class="border border-accent rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-flower transition" />
  <select v-model="form.attending" required class="border border-accent rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-flower transition">
        <option value="">Will you attend?</option>
        <option value="yes">Yes, I’ll be there!</option>
        <option value="no">Sorry, can’t make it</option>
      </select>
  <select v-model="form.meal" :disabled="form.attending !== 'yes'" class="border border-accent rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-flower transition">
        <option value="">Meal Choice (if attending)</option>
        <option value="chicken">Chicken</option>
        <option value="beef">Beef</option>
        <option value="vegetarian">Vegetarian</option>
      </select>
      <button type="submit" class="bg-accent text-white px-6 py-3 rounded-lg shadow hover:bg-flower transition">Submit RSVP</button>
      <div v-if="submitted" class="text-green-700 mt-2">Thank you for your RSVP!</div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const form = ref({
  name: '',
  email: '',
  attending: '',
  meal: ''
})
const submitted = ref(false)

function submitForm() {
  // Save to localStorage as a mock backend
  const rsvps = JSON.parse(localStorage.getItem('rsvps') || '[]')
  rsvps.push({ ...form.value, date: new Date().toISOString() })
  localStorage.setItem('rsvps', JSON.stringify(rsvps))
  submitted.value = true
  form.value = { name: '', email: '', attending: '', meal: '' }
}
</script>

<style scoped>
</style>
