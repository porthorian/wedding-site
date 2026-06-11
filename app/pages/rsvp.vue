<template>
  <section class="rsvp-page paper-bg">
    <v-container class="rsvp-page-container">
      <v-card elevation="0" class="rsvp-page-card">
        <div class="rsvp-bg-image" :style="rsvpBgStyle" aria-hidden="true" />
        <v-card-text class="panel-content panel-content--rsvp rsvp-page-content">
          <div class="rsvp-page-topline">
            <v-btn to="/" variant="text" class="text-none rsvp-back-link" prepend-icon="$prev">
              Home
            </v-btn>
            <div class="rsvp-step-label">{{ stepLabel }}</div>
          </div>

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

          <v-window v-model="phaseIndex" class="rsvp-window">
            <v-window-item :value="0">
              <v-form
                id="rsvpLookupForm"
                ref="lookupFormRef"
                validate-on="submit"
                @focusin="onFormFocusIn"
                @submit.prevent.stop="lookupGuest"
              >
                <p class="eyebrow">Kindly reply</p>
                <h1 class="rsvp-page-title">RSVP</h1>
                <p class="rsvp-page-copy">
                  Enter your full name as it <strong>appears on your invitation</strong>.
                </p>

                <v-row density="comfortable" class="rsvp-field-row">
                  <v-col cols="12">
                    <v-text-field
                      v-model="lookupForm.fullName"
                      label="Full name"
                      variant="underlined"
                      density="compact"
                      autocomplete="name"
                      :rules="fullNameRules"
                      required
                    />
                  </v-col>
                  <v-expand-transition>
                    <v-col v-if="zipCodeRequired" cols="12">
                      <v-text-field
                        v-model="lookupForm.zipCode"
                        label="ZIP Code"
                        variant="underlined"
                        density="compact"
                        autocomplete="postal-code"
                        inputmode="numeric"
                        :rules="zipCodeRules"
                        required
                      />
                    </v-col>
                  </v-expand-transition>
                </v-row>

                <div class="rsvp-page-actions">
                  <v-btn
                    type="button"
                    color="primary"
                    class="text-none"
                    variant="elevated"
                    size="large"
                    :loading="lookupSubmitting || recaptchaPreparing"
                    :disabled="lookupSubmitting"
                    @click.prevent="lookupGuest"
                  >
                    Find Invitation
                  </v-btn>
                </div>
              </v-form>
            </v-window-item>

            <v-window-item :value="1">
              <div class="rsvp-faq-step">
                <FaqSection compact />

                <div class="rsvp-page-actions rsvp-page-actions--split">
                  <v-btn type="button" variant="text" class="text-none" @click="returnToLookup">
                    Back
                  </v-btn>
                  <v-btn
                    type="button"
                    color="primary"
                    class="text-none"
                    variant="elevated"
                    size="large"
                    @click="continueToResponse"
                  >
                    Continue
                  </v-btn>
                </div>
              </div>
            </v-window-item>

            <v-window-item :value="2">
              <v-form
                id="rsvpResponseForm"
                ref="responseFormRef"
                validate-on="submit"
                @focusin="onFormFocusIn"
                @submit.prevent.stop="submitRsvp"
              >
                <p class="eyebrow">Welcome</p>
                <h1 class="rsvp-page-title">{{ guestDisplayName }}</h1>
                <p class="rsvp-page-copy">
                  Let us know whether you will be joining us on {{ wedding.hero.dateDisplay }}.
                </p>

                <v-alert
                  v-if="invitationCapacityNotice"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="rsvp-guest-notice"
                >
                  {{ invitationCapacityNotice }}
                </v-alert>

                <div class="field-group rsvp-field-group">
                  <div class="section-label">Will you attend?</div>
                  <v-radio-group
                    v-model="responseForm.willAttend"
                    inline
                    density="comfortable"
                    :rules="willAttendRules"
                    required
                  >
                    <v-radio label="Yes" value="yes" density="compact" />
                    <v-radio label="No" value="no" density="compact" />
                  </v-radio-group>
                </div>

                <v-expand-transition>
                  <div v-if="responseForm.willAttend === 'yes' && totalGuestCapacity > 0" class="rsvp-plus-one">
                    <div class="section-label">Party size</div>
                    <v-select
                      v-model="responseForm.guestsAttending"
                      :items="guestCountOptions"
                      item-title="title"
                      item-value="value"
                      label="Total guests attending"
                      variant="underlined"
                      density="compact"
                      :rules="guestCountRules"
                      required
                    />

                    <v-expand-transition>
                      <div v-if="additionalGuestsAttending > 0" class="rsvp-plus-one-names">
                        <v-text-field
                          v-for="(_, idx) in responseForm.guestNames"
                          :key="`guest-name-${idx}`"
                          v-model="responseForm.guestNames[idx]"
                          :label="additionalGuestLabel(idx)"
                          variant="underlined"
                          density="compact"
                          autocomplete="name"
                          :rules="guestNameRules"
                          required
                        />
                      </div>
                    </v-expand-transition>
                  </div>
                </v-expand-transition>

                <p
                  v-if="responseForm.willAttend === 'yes' && matchedGuest && extraGuestsAllowed === 0"
                  class="rsvp-page-note muted"
                >
                  Your invitation is reserved for the named guest{{ namedGuestsCount === 1 ? '' : 's' }}.
                </p>

                <div class="rsvp-page-actions rsvp-page-actions--split">
                  <v-btn type="button" variant="text" class="text-none" :disabled="rsvpSubmitting" @click="returnToFaq">
                    Back
                  </v-btn>
                  <v-btn
                    type="button"
                    color="primary"
                    class="text-none"
                    variant="elevated"
                    size="large"
                    :loading="rsvpSubmitting || recaptchaPreparing"
                    :disabled="rsvpSubmitting"
                    @click.prevent="submitRsvp"
                  >
                    Send RSVP
                  </v-btn>
                </div>
              </v-form>
            </v-window-item>

            <v-window-item :value="3">
              <div class="rsvp-success">
                <p class="eyebrow">Received</p>
                <h1 class="rsvp-page-title">Thank you</h1>
                <p class="rsvp-page-copy">
                  We received your RSVP for {{ guestDisplayName }}.
                </p>
                <Vine2Divider />
                <div class="rsvp-page-actions">
                  <v-btn to="/" color="primary" class="text-none" variant="elevated" size="large">
                    Return Home
                  </v-btn>
                </div>
              </div>
            </v-window-item>
          </v-window>

          <div v-if="!recaptchaBypass" class="rsvp-disclaimer muted">
            This site is protected by reCAPTCHA and the Google
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            and
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
            apply.
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useHead, useRuntimeConfig } from '#imports'
import { wedding } from '~/data/wedding'

type Grecaptcha = {
  ready: (cb: () => void) => void
  execute: (siteKey: string, opts: { action: string }) => Promise<string>
}

type WillAttend = 'yes' | 'no'

type RsvpGuest = {
  firstName: string
  lastName: string
  displayName: string
  namedGuestsCount: number
  extraGuestsAllowed: number
  totalGuestCapacity: number
  willAttend: WillAttend | null
  guestsAttending: number
  guestNames: string[]
}

type LookupResponse = {
  ok: boolean
  guest: RsvpGuest
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

const runtimeConfig = useRuntimeConfig()
const recaptchaSiteKey = computed(() => runtimeConfig.public.recaptchaSiteKey)
const recaptchaBypass = computed(() => runtimeConfig.public.recaptchaBypass === true)

const phaseIndex = ref(0)
const lookupFormRef = ref<any>(null)
const responseFormRef = ref<any>(null)
const lookupSubmitting = ref(false)
const rsvpSubmitting = ref(false)
const rsvpErrors = ref<string[]>([])
const matchedGuest = ref<RsvpGuest | null>(null)
const zipCodeRequired = ref(false)
const recaptchaRequested = ref(false)
const recaptchaReady = ref(false)
const recaptchaPreparing = ref(false)
let recaptchaReadyPromise: Promise<Grecaptcha> | null = null

const lookupForm = reactive({
  fullName: '',
  zipCode: '',
})

const responseForm = reactive({
  willAttend: null as WillAttend | null,
  guestsAttending: 0,
  guestNames: [] as string[],
})

const rsvpPhotoSrc = computed(() => wedding.travel.photo)
const rsvpBgStyle = computed(() => ({
  backgroundImage: rsvpPhotoSrc.value ? `url(${rsvpPhotoSrc.value})` : 'none',
}))
const stepLabel = computed(() => {
  if (phaseIndex.value === 3) return 'Complete'
  return `Step ${phaseIndex.value + 1} of 3`
})
const guestDisplayName = computed(() => matchedGuest.value?.displayName || 'Guest')
const namedGuestsCount = computed(() => matchedGuest.value?.namedGuestsCount ?? 1)
const extraGuestsAllowed = computed(() => matchedGuest.value?.extraGuestsAllowed ?? 0)
const totalGuestCapacity = computed(() => matchedGuest.value?.totalGuestCapacity ?? namedGuestsCount.value)
const additionalGuestsAttending = computed(() =>
  Math.max(0, responseForm.guestsAttending - namedGuestsCount.value)
)
const invitationCapacityNotice = computed(() => {
  if (!matchedGuest.value) return ''

  const total = totalGuestCapacity.value
  const totalCopy = total === 1
    ? 'Your invitation includes space for 1 person total.'
    : `Your invitation includes space for up to ${total} people total.`

  const extra = extraGuestsAllowed.value
  if (extra <= 0) return totalCopy

  const extraCopy = extra === 1
    ? 'This includes space for 1 additional guest.'
    : `This includes space for ${extra} additional guests.`

  return `${totalCopy} ${extraCopy}`
})
const guestCountOptions = computed(() =>
  Array.from({ length: totalGuestCapacity.value }, (_, idx) => {
    const count = idx + 1
    return {
      value: count,
      title: count === 1 ? '1 person' : `${count} people`,
    }
  }))

const fullNameRules = [
  (value: string) => (!!value?.trim() ? true : 'Full name is required'),
  (value: string) => (value?.trim().length <= 160 ? true : 'Full name is too long'),
]
const zipCodeRules = [
  (value: string) => (!zipCodeRequired.value || !!normalizeZipCode(value) ? true : 'ZIP Code is required'),
  (value: string) => (!value?.trim() || normalizeZipCode(value).length === 5 ? true : 'Please enter a 5-digit ZIP Code'),
]
const willAttendRules = [(value: WillAttend | null) => (value === 'yes' || value === 'no' ? true : 'Please choose one')]
const guestCountRules = [
  (value: number) =>
    Number.isSafeInteger(value) && value >= 1 && value <= totalGuestCapacity.value
      ? true
      : 'Please choose a valid number of guests attending',
]
const guestNameRules = [
  (value: string) => (!!value?.trim() ? true : 'Guest name is required'),
  (value: string) => (value?.trim().length <= 120 ? true : 'Guest name is too long'),
]

useHead(() => {
  const siteKey = recaptchaSiteKey.value
  const head = {
    title: 'RSVP | Rosa & Vincent Wedding',
  } as {
    title: string
    script?: Array<{ key: string; src: string; defer: true }>
  }

  if (!recaptchaBypass.value && recaptchaRequested.value && siteKey) {
    head.script = [
      {
        key: 'recaptcha-v3',
        src: `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`,
        defer: true,
      },
    ]
  }

  return head
})

watch(
  () => responseForm.willAttend,
  (willAttend) => {
    if (willAttend === 'no') {
      responseForm.guestsAttending = 0
      responseForm.guestNames = []
      return
    }

    if (willAttend === 'yes') {
      if (responseForm.guestsAttending < 1) {
        responseForm.guestsAttending = Math.min(namedGuestsCount.value, totalGuestCapacity.value)
      } else if (responseForm.guestsAttending > totalGuestCapacity.value) {
        responseForm.guestsAttending = totalGuestCapacity.value
      }
    }
    syncGuestNames()
  }
)

watch(
  () => responseForm.guestsAttending,
  () => {
    syncGuestNames()
  }
)

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

function trimFormValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeZipCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5)
}

function additionalGuestLabel(idx: number): string {
  return `Additional guest ${idx + 1} name`
}

function syncGuestNames() {
  const count = additionalGuestsAttending.value
  if (responseForm.guestNames.length > count) {
    responseForm.guestNames.splice(count)
  }

  while (responseForm.guestNames.length < count) {
    responseForm.guestNames.push('')
  }
}

function selectedGuestNames(): string[] {
  return responseForm.guestNames.slice(0, additionalGuestsAttending.value).map(trimFormValue)
}

function hasValidationError(err: unknown): err is string {
  return typeof err === 'string' && err.trim().length > 0
}

function setRsvpErrors(errors: string[]) {
  rsvpErrors.value = Array.from(new Set(errors.map((e) => e.trim()).filter(hasValidationError)))
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

function getStatusCode(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null
  const maybeAny = err as any
  const value = maybeAny?.statusCode ?? maybeAny?.status ?? maybeAny?.response?.status ?? maybeAny?.data?.statusCode
  return typeof value === 'number' ? value : null
}

function validateLookupValues(): string[] {
  const errors: string[] = []
  const fullName = trimFormValue(lookupForm.fullName)
  const zipCode = normalizeZipCode(lookupForm.zipCode)

  if (!fullName) errors.push('Full name is required.')
  else if (fullName.length > 160) errors.push('Full name is too long.')

  if (zipCodeRequired.value && !zipCode) errors.push('ZIP Code is required.')
  else if (lookupForm.zipCode.trim() && zipCode.length !== 5) errors.push('Please enter a 5-digit ZIP Code.')

  return errors
}

function validateResponseValues(): string[] {
  const errors: string[] = []

  if (responseForm.willAttend !== 'yes' && responseForm.willAttend !== 'no') {
    errors.push('Please choose whether you will attend.')
  }

  if (responseForm.willAttend === 'yes') {
    const count = responseForm.guestsAttending
    const capacity = totalGuestCapacity.value
    const additionalCount = additionalGuestsAttending.value

    if (!Number.isSafeInteger(count) || count < 1) {
      errors.push('Please choose a valid number of guests attending.')
    } else if (count > capacity) {
      errors.push('That response includes more guests than your invitation allows.')
    }

    if (additionalCount > 0) {
      const names = selectedGuestNames()
      if (names.length !== additionalCount || names.some((name) => !name)) {
        errors.push('Please enter a name for each additional guest.')
      } else if (names.some((name) => name.length > 120)) {
        errors.push('Each additional guest name must be 120 characters or fewer.')
      }
    }
  }

  return errors
}

function applyGuestResponse(guest: RsvpGuest) {
  matchedGuest.value = guest
  responseForm.willAttend = guest.willAttend
  responseForm.guestsAttending = guest.willAttend === 'yes'
    ? Math.min(Math.max(guest.guestsAttending, 1), guest.totalGuestCapacity)
    : 0
  responseForm.guestNames = guest.willAttend === 'yes' ? guest.guestNames.slice(0, additionalGuestsAttending.value) : []
  syncGuestNames()
}

async function lookupGuest() {
  setRsvpErrors([])
  await lookupFormRef.value?.validate?.()

  const validationErrors = validateLookupValues()
  if (validationErrors.length) {
    setRsvpErrors(validationErrors)
    return
  }

  lookupSubmitting.value = true
  try {
    let captchaToken: string | undefined
    if (!recaptchaBypass.value) {
      captchaToken = await getRecaptchaToken('rsvp_submit')
    }

    const response = await $fetch<LookupResponse>('/api/rsvp/lookup', {
      method: 'POST',
      body: {
        fullName: trimFormValue(lookupForm.fullName),
        zipCode: normalizeZipCode(lookupForm.zipCode) || undefined,
        captchaToken,
      },
    })

    applyGuestResponse(response.guest)
    zipCodeRequired.value = !!normalizeZipCode(lookupForm.zipCode)
    setRsvpErrors([])
    phaseIndex.value = 1
  } catch (err) {
    if (getStatusCode(err) === 409) {
      zipCodeRequired.value = true
    }
    setRsvpErrors([getErrorMessage(err)])
  } finally {
    lookupSubmitting.value = false
  }
}

async function submitRsvp() {
  setRsvpErrors([])
  await responseFormRef.value?.validate?.()

  if (!matchedGuest.value) {
    setRsvpErrors(['Please look up your invitation first.'])
    phaseIndex.value = 0
    return
  }

  const validationErrors = validateResponseValues()
  if (validationErrors.length) {
    setRsvpErrors(validationErrors)
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
        fullName: trimFormValue(lookupForm.fullName),
        zipCode: normalizeZipCode(lookupForm.zipCode) || undefined,
        willAttend: responseForm.willAttend,
        guestsAttending: responseForm.willAttend === 'yes' ? responseForm.guestsAttending : 0,
        guestNames: responseForm.willAttend === 'yes' ? selectedGuestNames() : [],
        captchaToken,
      },
    })

    setRsvpErrors([])
    phaseIndex.value = 3
  } catch (err) {
    setRsvpErrors([getErrorMessage(err)])
  } finally {
    rsvpSubmitting.value = false
  }
}

function returnToLookup() {
  setRsvpErrors([])
  phaseIndex.value = 0
}

async function continueToResponse() {
  setRsvpErrors([])
  phaseIndex.value = 2
  await nextTick()
  responseFormRef.value?.resetValidation?.()
}

function returnToFaq() {
  setRsvpErrors([])
  phaseIndex.value = 1
}
</script>
