<template>
  <div class="flex flex-col items-center">
    <div class="text-3xl md:text-5xl font-script mb-2">{{ countdown }}</div>
    <div class="text-sm text-dark/60">until the big day!</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ date: Date }>()
const countdown = ref('')
let interval: any

function updateCountdown() {
  const now = new Date()
  const diff = props.date.getTime() - now.getTime()
  if (diff <= 0) {
    countdown.value = 'Today is the day!'
    clearInterval(interval)
    return
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  countdown.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
}

onMounted(() => {
  updateCountdown()
  interval = setInterval(updateCountdown, 1000)
})
onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.font-script {
  font-family: 'Dancing Script', cursive;
}
</style>
