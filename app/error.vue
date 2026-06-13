<template>
  <v-app class="page-shell wedding-error-app">
    <v-main>
      <section class="wedding-error paper-bg">
        <v-container class="wedding-error-container">
          <v-card elevation="0" class="wedding-error-card">
            <div class="wedding-error-bg-image" :style="errorBgStyle" aria-hidden="true" />
            <v-card-text class="wedding-error-content">
              <p class="eyebrow">Rosa &amp; Vincent</p>
              <p class="wedding-error-code">{{ statusLabel }}</p>
              <h1 class="wedding-error-title">{{ errorTitle }}</h1>
              <p class="wedding-error-copy">{{ errorCopy }}</p>
              <p v-if="isNotFound" class="wedding-error-path">
                {{ requestedPath }}
              </p>
              <Vine2Divider class="wedding-error-vine" />
              <v-btn
                color="primary"
                class="text-none wedding-error-button"
                variant="elevated"
                size="large"
                @click="returnHome"
              >
                Return Home
              </v-btn>
            </v-card-text>
          </v-card>
        </v-container>
      </section>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NuxtError } from '#app'
import { clearError, useHead, useRequestURL } from '#imports'
import { wedding } from '~/data/wedding'

const props = defineProps<{
  error: NuxtError
}>()

const requestUrl = useRequestURL()
const statusCode = computed(() => Number(props.error.statusCode || props.error.status || 500))
const isNotFound = computed(() => statusCode.value === 404)
const statusLabel = computed(() => String(statusCode.value))
const requestedPath = computed(() => {
  const search = requestUrl.search || ''
  return `${requestUrl.pathname}${search}`
})
const errorTitle = computed(() => (
  isNotFound.value ? 'We could not find that page.' : 'Something went off course.'
))
const errorCopy = computed(() => (
  isNotFound.value
    ? 'The page may have moved, or the address may not be part of our wedding site.'
    : 'Please return home and try again in a moment.'
))
const errorBgStyle = computed(() => ({
  backgroundImage: wedding.travel.photo ? `url(${wedding.travel.photo})` : 'none',
}))

useHead(() => ({
  title: isNotFound.value ? 'Page Not Found | Rosa & Vincent' : 'Error | Rosa & Vincent',
}))

function returnHome() {
  void clearError({ redirect: '/' })
}
</script>
