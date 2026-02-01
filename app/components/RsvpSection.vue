<template>
  <v-card elevation="0" class="rsvp-card">
    <div class="rsvp-bg-image" :style="rsvpBgStyle" aria-hidden="true" />
    <v-card-text class="panel-content panel-content--rsvp">
      <h2 class="panel-title">RSVP &amp; Song Request</h2>
      <v-form
        id="rsvpForm"
        ref="rsvpFormRef"
        validate-on="submit"
        @focusin="onFormFocusIn"
        @submit.prevent.stop="submitRsvp"
      >
        <v-alert
          v-if="rsvpErrors.length"
          type="error"
          variant="tonal"
          density="compact"
          class="rsvp-form-alert"
        >
          <div class="rsvp-alert-title">Please fix the following:</div>
          <ul class="rsvp-error-list">
            <li v-for="(err, idx) in rsvpErrors" :key="idx">{{ err }}</li>
          </ul>
        </v-alert>
        <v-alert
          v-else-if="rsvpSubmitted"
          type="success"
          variant="tonal"
          density="compact"
          class="rsvp-form-alert"
        >
          Thanks! We received your RSVP.
        </v-alert>

        <div class="section-label">Required</div>
        <v-row dense>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="rsvpForm.name"
              label="Name"
              variant="underlined"
              density="compact"
              hide-details
              autocomplete="name"
              :rules="nameRules"
              required
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="rsvpForm.numberOfGuests"
              label="Guests"
              variant="underlined"
              density="compact"
              hide-details
              type="number"
              min="0"
              max="20"
              inputmode="numeric"
              placeholder="0–20"
              :rules="guestRules"
              required
            />
          </v-col>
          <v-col cols="12">
            <div class="field-group rsvp-field-group">
              <div class="section-label">Will you attend?</div>
              <v-radio-group
                v-model="rsvpForm.willAttend"
                inline
                density="compact"
                hide-details
                :rules="willAttendRules"
                required
              >
                <v-radio label="Yes" value="yes" density="compact" />
                <v-radio label="No" value="no" density="compact" />
              </v-radio-group>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <div class="section-label">Optional</div>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="rsvpForm.email"
              label="Email Address"
              variant="underlined"
              density="compact"
              hide-details
              type="email"
              autocomplete="email"
              inputmode="email"
              :rules="emailRules"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="rsvpForm.address"
              label="Address"
              variant="underlined"
              density="compact"
              hide-details
              autocomplete="street-address"
              :rules="addressRules"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="rsvpForm.dietaryRestrictions"
              label="Dietary Restrictions"
              variant="underlined"
              density="compact"
              hide-details
              :rules="dietaryRules"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="rsvpForm.songRequest"
              label="Song Request"
              variant="underlined"
              density="compact"
              hide-details
              :rules="songRules"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="rsvpForm.message"
              label="Message"
              variant="underlined"
              density="compact"
              hide-details
              rows="2"
              auto-grow
              max-rows="4"
              :rules="messageRules"
            />
          </v-col>
        </v-row>

        <div class="rsvp-footer">
          <div ref="rsvpVineRef" class="rsvp-vine" aria-hidden="true" v-html="rsvpVineSvgMarkup" />
          <v-btn
            type="button"
            color="primary"
            class="text-none"
            variant="elevated"
            :loading="rsvpSubmitting || recaptchaPreparing"
            :disabled="rsvpSubmitting"
            @click.prevent="submitRsvp"
          >
            Send RSVP
          </v-btn>
          <div v-if="!recaptchaBypass" class="rsvp-disclaimer muted">
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
          </div>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import * as anime from 'animejs'
import { useHead, useRuntimeConfig } from '#imports'
import { wedding } from '~/data/wedding'
import rsvpVineSvg from '~/assets/svgs/vine2.svg?raw'

type Grecaptcha = {
  ready: (cb: () => void) => void
  execute: (siteKey: string, opts: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

const runtimeConfig = useRuntimeConfig()
const recaptchaSiteKey = computed(() => runtimeConfig.public.recaptchaSiteKey)
const recaptchaBypass = computed(() => runtimeConfig.public.recaptchaBypass === true)

const recaptchaRequested = ref(false)
const recaptchaReady = ref(false)
const recaptchaPreparing = ref(false)
let recaptchaReadyPromise: Promise<Grecaptcha> | null = null

useHead(() => {
  const siteKey = recaptchaSiteKey.value
  if (recaptchaBypass.value || !recaptchaRequested.value || !siteKey) return {}

  return {
    script: [
      {
        key: 'recaptcha-v3',
        src: `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`,
        defer: true,
      },
    ],
  }
})

function onFormFocusIn() {
  if (recaptchaBypass.value) return
  recaptchaRequested.value = true
  void ensureRecaptchaReady().catch(() => {})
}

async function waitForGrecaptcha(timeoutMs = 10_000): Promise<Grecaptcha> {
  const startedAt = Date.now()

  while (true) {
    const grecaptcha = window.grecaptcha
    if (grecaptcha?.ready && grecaptcha.execute) {
      await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()))
      return grecaptcha
    }

    if (Date.now() - startedAt >= timeoutMs) throw new Error('reCAPTCHA failed to load')
    await new Promise<void>((resolve) => setTimeout(resolve, 50))
  }
}

async function ensureRecaptchaReady(): Promise<Grecaptcha> {
  if (recaptchaBypass.value) throw new Error('reCAPTCHA bypass is enabled')

  const siteKey = recaptchaSiteKey.value
  if (!siteKey) throw new Error('reCAPTCHA site key is not configured')

  recaptchaRequested.value = true
  await nextTick()

  const existing = window.grecaptcha
  if (recaptchaReady.value && existing?.ready && existing.execute) return existing
  if (recaptchaReadyPromise) return recaptchaReadyPromise

  recaptchaPreparing.value = true
  recaptchaReadyPromise = waitForGrecaptcha()
    .then((grecaptcha) => {
      recaptchaReady.value = true
      return grecaptcha
    })
    .catch((err) => {
      recaptchaReady.value = false
      recaptchaReadyPromise = null
      throw err
    })
    .finally(() => {
      recaptchaPreparing.value = false
    })

  return recaptchaReadyPromise
}

async function getRecaptchaToken(action: string): Promise<string> {
  const siteKey = recaptchaSiteKey.value
  if (!siteKey) throw new Error('reCAPTCHA site key is not configured')
  const grecaptcha = await ensureRecaptchaReady()
  return grecaptcha.execute(siteKey, { action })
}

type WillAttend = 'yes' | 'no' | null

const rsvpFormRef = ref<any>(null)
const rsvpSubmitting = ref(false)
const rsvpSubmitted = ref(false)
const rsvpErrors = ref<string[]>([])
const rsvpPhotoSrc = computed(() => wedding.travel.photo)
const rsvpBgStyle = computed(() => ({
  backgroundImage: rsvpPhotoSrc.value ? `url(${rsvpPhotoSrc.value})` : 'none',
}))
const rsvpOptionalPanel = ref<number | null>(null)
const rsvpVineRef = ref<HTMLElement | null>(null)

const rsvpForm = reactive({
  name: '',
  email: '',
  willAttend: null as WillAttend,
  address: '',
  numberOfGuests: 1,
  dietaryRestrictions: '',
  songRequest: '',
  message: '',
})

const nameRules = [
  (value: string) => (!!value?.trim() ? true : 'Name is required'),
  (value: string) => (value?.trim().length <= 120 ? true : 'Name is too long'),
]

const emailRules = [
  (value: string) => {
    const trimmed = value?.trim()
    if (!trimmed) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? true : 'Enter a valid email address'
  },
]

const addressRules = [(value: string) => (value?.trim().length <= 300 ? true : 'Address is too long')]

const willAttendRules = [(value: WillAttend) => (value === 'yes' || value === 'no' ? true : 'Please choose one')]

const guestRules = [
  (value: unknown) => {
    const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    if (!Number.isFinite(numberValue)) return 'Enter number of guests'
    const normalized = Math.trunc(numberValue)
    if (normalized < 0 || normalized > 20) return 'Guests must be between 0 and 20'
    return true
  },
]

const dietaryRules = [(value: string) => (value?.trim().length <= 500 ? true : 'Too long')]
const songRules = [(value: string) => (value?.trim().length <= 200 ? true : 'Too long')]
const messageRules = [(value: string) => (value?.trim().length <= 2000 ? true : 'Too long')]

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function hasValidationError(err: unknown): err is string {
  return typeof err === 'string' && err.trim().length > 0
}

function validateRsvpFormValues(): { errors: string[]; hasOptionalErrors: boolean } {
  const errors: string[] = []
  let hasOptionalErrors = false

  const name = rsvpForm.name.trim()
  if (!name) errors.push('Name is required.')
  else if (name.length > 120) errors.push('Name is too long.')

  if (rsvpForm.willAttend !== 'yes' && rsvpForm.willAttend !== 'no') {
    errors.push('Please choose whether you will attend.')
  }

  const guests = Number(rsvpForm.numberOfGuests)
  if (!Number.isFinite(guests)) errors.push('Number of guests is required.')
  else if (Math.trunc(guests) < 0 || Math.trunc(guests) > 20) errors.push('Guests must be between 0 and 20.')

  const email = rsvpForm.email.trim()
  if (email) {
    hasOptionalErrors = true
    if (email.length > 254) errors.push('Email address is too long.')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.')
  }

  const address = rsvpForm.address.trim()
  if (address) {
    hasOptionalErrors = true
    if (address.length > 300) errors.push('Address is too long.')
  }

  const dietary = rsvpForm.dietaryRestrictions.trim()
  if (dietary) {
    hasOptionalErrors = true
    if (dietary.length > 500) errors.push('Dietary restrictions are too long.')
  }

  const song = rsvpForm.songRequest.trim()
  if (song) {
    hasOptionalErrors = true
    if (song.length > 200) errors.push('Song request is too long.')
  }

  const message = rsvpForm.message.trim()
  if (message) {
    hasOptionalErrors = true
    if (message.length > 2000) errors.push('Message is too long.')
  }

  return { errors, hasOptionalErrors }
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const maybeAny = err as any
    const statusMessage = maybeAny?.data?.statusMessage || maybeAny?.statusMessage
    if (typeof statusMessage === 'string' && statusMessage.trim()) return statusMessage
    const message = maybeAny?.data?.message || maybeAny?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'Something went wrong. Please try again.'
}

function setRsvpErrors(errors: string[]) {
  const unique = Array.from(new Set(errors.map((e) => e.trim()).filter(hasValidationError)))
  rsvpErrors.value = unique
}

async function submitRsvp() {
  rsvpSubmitted.value = false
  setRsvpErrors([])

  await rsvpFormRef.value?.validate?.()

  const validation = validateRsvpFormValues()
  if (validation.errors.length) {
    setRsvpErrors(validation.errors)
    if (validation.hasOptionalErrors) rsvpOptionalPanel.value = 0
    return
  }

  rsvpSubmitting.value = true
  try {
    let captchaToken: string | undefined
    if (!recaptchaBypass.value) {
      captchaToken = await getRecaptchaToken('rsvp_submit')
    }

    await $fetch('/api/rsvp', {
      method: 'POST',
      body: {
        name: rsvpForm.name.trim(),
        email: trimOrUndefined(rsvpForm.email),
        willAttend: rsvpForm.willAttend,
        address: trimOrUndefined(rsvpForm.address),
        numberOfGuests: rsvpForm.numberOfGuests,
        dietaryRestrictions: trimOrUndefined(rsvpForm.dietaryRestrictions),
        songRequest: trimOrUndefined(rsvpForm.songRequest),
        message: trimOrUndefined(rsvpForm.message),
        captchaToken,
      },
    })

    rsvpSubmitted.value = true
    setRsvpErrors([])
    rsvpForm.name = ''
    rsvpForm.email = ''
    rsvpForm.willAttend = null
    rsvpForm.address = ''
    rsvpForm.numberOfGuests = 1
    rsvpForm.dietaryRestrictions = ''
    rsvpForm.songRequest = ''
    rsvpForm.message = ''
    rsvpFormRef.value?.resetValidation?.()
    rsvpOptionalPanel.value = null
  } catch (err) {
    setRsvpErrors([getErrorMessage(err)])
  } finally {
    rsvpSubmitting.value = false
  }
}

const rsvpVineSvgMarkup = rsvpVineSvg
  .replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')
  .replace(
    '<path style="fill:#2F2F30;" d="M444.18,201.195',
    '<path class="rsvp-vine-static" style="fill:#2F2F30;" d="M444.18,201.195'
  )
  .replace(
    '<path style="fill:#2F2F30;" d="M57.741,215.305',
    '<path class="rsvp-vine-flow" style="fill:#2F2F30;" d="M57.741,215.305'
  )

let rsvpVineFlowAnimation: anime.JSAnimation | null = null
let rsvpVineLeafAnimation: anime.JSAnimation | null = null

function startRsvpVineAnimation() {
  if (rsvpVineFlowAnimation || rsvpVineLeafAnimation) return
  const root = rsvpVineRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const flow = root.querySelector('path.rsvp-vine-flow')
  const leaves = root.querySelectorAll('path:not(.rsvp-vine-static):not(.rsvp-vine-flow)')

  if (flow) {
    rsvpVineFlowAnimation = anime.animate(flow, {
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
    rsvpVineLeafAnimation = anime.animate(leaves, {
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
  startRsvpVineAnimation()
})

onBeforeUnmount(() => {
  rsvpVineFlowAnimation?.pause()
  rsvpVineLeafAnimation?.pause()
  rsvpVineFlowAnimation = null
  rsvpVineLeafAnimation = null
})
</script>
