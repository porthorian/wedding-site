<template>
  <div class="countdown-shell">
    <div class="countdown-grid">
      <div v-for="part in parts" :key="part.label" class="countdown-cell">
        <div class="countdown-value">{{ part.value }}</div>
        <div class="countdown-label">{{ part.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ date: Date }>()
const parts = ref([
  { label: 'Days', value: '0' },
  { label: 'Hours', value: '0' },
  { label: 'Minutes', value: '0' },
  { label: 'Seconds', value: '0' },
])
let interval: any

function updateCountdown() {
  const now = new Date()
  const diff = props.date.getTime() - now.getTime()
  if (diff <= 0) {
    parts.value = [
      { label: 'Days', value: '0' },
      { label: 'Hours', value: '0' },
      { label: 'Minutes', value: '0' },
      { label: 'Seconds', value: '0' },
    ]
    clearInterval(interval)
    return
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  parts.value = [
    { label: 'Days', value: `${days}` },
    { label: 'Hours', value: `${hours}` },
    { label: 'Minutes', value: `${minutes}` },
    { label: 'Seconds', value: `${seconds}` },
  ]
}

onMounted(() => {
  updateCountdown()
  interval = setInterval(updateCountdown, 1000)
})
onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.countdown-shell {
  padding: 16px;
}

.countdown-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  text-align: center;
}

.countdown-cell {
  background: rgba(var(--panel-surface-strong-rgb), 0.84);
  border: 1px solid rgba(var(--panel-border-rgb), 0.45);
  border-radius: 12px;
  padding: 12px 8px;
}

.countdown-value {
  font-family: var(--font-title);
  font-size: 20px;
}

.countdown-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--ink-muted-rgb), 0.68);
}

@media (max-width: 560px) {
  .countdown-shell {
    padding: 12px;
  }

  .countdown-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .countdown-cell {
    padding: 10px 6px;
  }

  .countdown-value {
    font-size: 18px;
  }

  .countdown-label {
    font-size: 10px;
    letter-spacing: 0.1em;
  }
}
</style>
