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
                <p v-if="rsvpClosed" class="rsvp-page-copy">
                  {{ RSVP_CLOSED_MESSAGE }}
                </p>
                <p v-else class="rsvp-page-copy">
                  Enter your name as it <strong>appears on your invitation</strong>, or just your last name.
                  Kindly reply by <strong>{{ RSVP_DEADLINE_DISPLAY }}</strong>.
                </p>

                <v-row v-if="!rsvpClosed" density="comfortable" class="rsvp-field-row">
                  <v-col cols="12">
                    <v-text-field
                      v-model="lookupForm.fullName"
                      label="Name"
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
                  <v-expand-transition>
                    <v-col v-if="lookupMatchOptions.length > 0" cols="12">
                      <div class="field-group rsvp-field-group rsvp-match-selector">
                        <div class="section-label">{{ lookupMatchPrompt }}</div>
                        <v-radio-group
                          v-model="selectedLookupMatchToken"
                          density="comfortable"
                          :rules="lookupMatchRules"
                          required
                        >
                          <v-radio
                            v-for="match in lookupMatchOptions"
                            :key="match.matchToken"
                            :label="match.guest.displayName"
                            :value="match.matchToken"
                            density="compact"
                          />
                        </v-radio-group>
                      </div>
                    </v-col>
                  </v-expand-transition>
                </v-row>

                <div v-if="!rsvpClosed" class="rsvp-page-actions">
                  <v-btn
                    type="button"
                    color="primary"
                    class="text-none"
                    variant="elevated"
                    size="large"
                    data-rybbit-event="lookup_invitation"
                    :loading="lookupSubmitting || recaptchaPreparing"
                    :disabled="lookupSubmitting || recaptchaActionBlocked"
                    @click.prevent="lookupGuest"
                  >
                    {{ lookupMatchOptions.length > 0 ? 'Continue' : 'Find Invitation' }}
                  </v-btn>
                </div>
              </v-form>
            </v-window-item>

            <v-window-item :value="1">
              <div class="rsvp-faq-step">
                <FaqSection compact />

                <div v-if="!rsvpClosed" class="rsvp-page-actions rsvp-page-actions--split">
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
                      <div v-if="showNamedGuestSelector" class="rsvp-named-guest-selector">
                        <div class="section-label">Who will be attending?</div>
                        <v-checkbox
                          v-for="name in parsedNamedGuests"
                          :key="name"
                          v-model="responseForm.attendingNamedGuests"
                          :label="name"
                          :value="name"
                          density="compact"
                          hide-details
                        />
                      </div>
                    </v-expand-transition>

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
                  v-if="responseForm.willAttend === 'yes' && matchedGuest && !isAnonymousParty && extraGuestsAllowed === 0"
                  class="rsvp-page-note muted"
                >
                  Your invitation is reserved for the named guest{{ namedGuestsCount === 1 ? '' : 's' }}.
                </p>

                <div v-if="!rsvpClosed" class="rsvp-page-actions rsvp-page-actions--split">
                  <v-btn type="button" variant="text" class="text-none" :disabled="rsvpSubmitting" @click="returnToFaq">
                    Back
                  </v-btn>
                  <v-btn
                    type="button"
                    color="primary"
                    class="text-none"
                    variant="elevated"
                    size="large"
                    data-rybbit-event="submit_rsvp"
                    :loading="rsvpSubmitting || recaptchaPreparing"
                    :disabled="rsvpSubmitting || recaptchaActionBlocked"
                    @click.prevent="submitRsvp"
                  >
                    Send RSVP
                  </v-btn>
                </div>
              </v-form>
            </v-window-item>

            <v-window-item :value="3">
              <div ref="successRef" class="rsvp-success">
                <div
                  class="rsvp-success-grid"
                  :class="{ 'rsvp-success-grid--simple': !showSuccessCelebration }"
                >
                  <div class="rsvp-success-copy">
                    <div class="rsvp-success-heading">
                      <p class="eyebrow">Received</p>
                      <div class="rsvp-success-flair" aria-hidden="true">
                        <span
                          v-for="idx in 7"
                          :key="idx"
                          class="rsvp-success-spark"
                          :class="`rsvp-success-spark--${idx}`"
                        />
                      </div>
                    </div>
                    <h1 class="rsvp-page-title rsvp-success-title">Thank you</h1>
                    <p class="rsvp-page-copy rsvp-success-message">
                      {{ successMessage }}
                    </p>
                    <p class="rsvp-page-copy rsvp-success-received">
                      We received your RSVP for {{ guestDisplayName }}.
                    </p>

                    <Vine2Divider />

                    <dl class="rsvp-success-summary" aria-label="RSVP confirmation summary">
                      <div v-if="showSuccessGuestRow" class="rsvp-success-summary-row">
                        <dt>Guest</dt>
                        <dd>{{ guestDisplayName }}</dd>
                      </div>
                      <div class="rsvp-success-summary-row">
                        <dt>Response</dt>
                        <dd>{{ successAttendanceLabel }}</dd>
                      </div>
                      <div v-if="successPartyLabel" class="rsvp-success-summary-row">
                        <dt>Party</dt>
                        <dd>{{ successPartyLabel }}</dd>
                      </div>
                      <div v-if="successGuestNames.length" class="rsvp-success-summary-row">
                        <dt>Guests</dt>
                        <dd>
                          <ul class="rsvp-success-guest-list">
                            <li v-for="name in successGuestNames" :key="name">
                              {{ name }}
                            </li>
                          </ul>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <figure v-if="showSuccessCelebration" class="rsvp-success-polaroid">
                    <img
                      src="/images/gallery/JoePalaiaParkEngagementSession134166.jpg"
                      alt="Rosa and Vincent engagement portrait"
                    >
                    <figcaption>See you on the dance floor!</figcaption>
                  </figure>
                </div>

                <div
                  class="rsvp-page-actions rsvp-success-actions"
                  :class="{ 'rsvp-success-actions--simple': !showSuccessCelebration }"
                >
                  <v-btn
                    v-if="showSuccessCelebration"
                    to="/#schedule"
                    color="primary"
                    class="text-none"
                    variant="elevated"
                    size="large"
                  >
                    See Schedule
                  </v-btn>
                  <v-btn
                    v-if="showSuccessCelebration"
                    to="/#travel"
                    color="primary"
                    class="text-none"
                    variant="outlined"
                    size="large"
                  >
                    Travel Details
                  </v-btn>
                  <v-btn
                    to="/"
                    color="primary"
                    class="text-none"
                    :variant="showSuccessCelebration ? 'text' : 'elevated'"
                    size="large"
                  >
                    Return Home
                  </v-btn>
                </div>
              </div>
            </v-window-item>
          </v-window>

          <div v-if="!recaptchaBypass && !rsvpClosed" class="rsvp-disclaimer muted">
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as anime from 'animejs'
import { useHead, useRuntimeConfig } from '#imports'
import { RSVP_CLOSED_MESSAGE, RSVP_CUTOFF_ISO, RSVP_DEADLINE_DISPLAY, isRsvpClosed } from '#shared/rsvpDeadline'
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
  namedGuests: string[]
  namedGuestsCount: number
  extraGuestsAllowed: number
  totalGuestCapacity: number
  willAttend: WillAttend | null
  guestsAttending: number
  guestNames: string[]
}

type RsvpGuestMatch = {
  guest: RsvpGuest
  matchToken: string
}

type LookupResponse =
  | {
      ok: boolean
      guest: RsvpGuest
      matchToken: string
      matches?: never
    }
  | {
      ok: boolean
      matches: RsvpGuestMatch[]
      guest?: never
      matchToken?: never
    }

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
    ___grecaptcha_cfg?: unknown
  }
}

const runtimeConfig = useRuntimeConfig()
const recaptchaSiteKey = computed(() => runtimeConfig.public.recaptchaSiteKey)
const recaptchaBypass = computed(() => runtimeConfig.public.recaptchaBypass === true)

const phaseIndex = ref(0)
const lookupFormRef = ref<any>(null)
const responseFormRef = ref<any>(null)
const successRef = ref<HTMLElement | null>(null)
const lookupSubmitting = ref(false)
const rsvpSubmitting = ref(false)
const rsvpErrors = ref<string[]>([])
const matchedGuest = ref<RsvpGuest | null>(null)
const matchedGuestToken = ref('')
const lookupMatchOptions = ref<RsvpGuestMatch[]>([])
const selectedLookupMatchToken = ref('')
const zipCodeRequired = ref(false)
const recaptchaRequested = ref(false)
const recaptchaReady = ref(false)
const recaptchaPreparing = ref(false)
const currentTimeMs = ref(Date.now())
let recaptchaReadyPromise: Promise<Grecaptcha> | null = null
let recaptchaDisposed = false
let rsvpCutoffTimeout: ReturnType<typeof setTimeout> | null = null
let successAnimation: anime.JSAnimation | null = null

const recaptchaArtifactSelector = [
  'script[src*="google.com/recaptcha/"]',
  'script[src*="gstatic.com/recaptcha/"]',
  'script[src*="recaptcha.net/recaptcha/"]',
  'iframe[src*="google.com/recaptcha/"]',
  'iframe[src*="recaptcha.google.com/recaptcha/"]',
  'iframe[src*="gstatic.com/recaptcha/"]',
  'iframe[src*="recaptcha.net/recaptcha/"]',
  '.grecaptcha-badge',
  'textarea[name="g-recaptcha-response"]',
  'textarea[id^="g-recaptcha-response"]',
].join(', ')

const lookupForm = reactive({
  fullName: '',
  zipCode: '',
})

const responseForm = reactive({
  willAttend: null as WillAttend | null,
  guestsAttending: 0,
  attendingNamedGuests: [] as string[],
  guestNames: [] as string[],
})

const rsvpPhotoSrc = computed(() => wedding.travel.photo)
const rsvpBgStyle = computed(() => ({
  backgroundImage: rsvpPhotoSrc.value ? `url(${rsvpPhotoSrc.value})` : 'none',
}))
const rsvpCutoffTimeoutWindowMs = 10 * 60_000
const rsvpCutoffTimeMs = new Date(RSVP_CUTOFF_ISO).getTime()
const rsvpClosed = computed(() => isRsvpClosed(new Date(currentTimeMs.value)))
const stepLabel = computed(() => {
  if (rsvpClosed.value) return 'RSVP Closed'
  if (phaseIndex.value === 3) return 'Complete'
  return `Step ${phaseIndex.value + 1} of 3`
})
const guestDisplayName = computed(() => matchedGuest.value?.displayName || 'Guest')
const showSuccessCelebration = computed(() => responseForm.willAttend === 'yes')
const successAttendanceLabel = computed(() =>
  responseForm.willAttend === 'no' ? 'Unable to attend' : 'Attending'
)
const successPartyLabel = computed(() => {
  if (responseForm.willAttend !== 'yes') return ''
  const count = responseForm.guestsAttending
  return count === 1 ? '1 person' : `${count} people`
})
const successMessage = computed(() =>
  responseForm.willAttend === 'no'
    ? "We'll miss you, but thank you for letting us know."
    : `Your seat is saved for ${wedding.hero.dateDisplay}.`
)
const selectedLookupMatch = computed(() =>
  lookupMatchOptions.value.find((match) => match.matchToken === selectedLookupMatchToken.value) || null
)
const lookupMatchPrompt = computed(() =>
  lookupMatchOptions.value.length === 1 ? 'Confirm your invitation' : 'Which invitation is yours?'
)
const parsedNamedGuests = computed(() => matchedGuest.value?.namedGuests ?? [])
const namedGuestsCount = computed(() => matchedGuest.value?.namedGuestsCount ?? 1)
const isAnonymousParty = computed(() => matchedGuest.value?.namedGuestsCount === 0)
const successGuestNames = computed(() => {
  if (responseForm.willAttend !== 'yes') return []

  const namedGuestNames = showNamedGuestSelector.value
    ? responseForm.attendingNamedGuests
    : parsedNamedGuests.value.slice(0, Math.min(namedGuestsCount.value, responseForm.guestsAttending))
  const allNames = [...namedGuestNames, ...selectedGuestNames()]
    .map(trimFormValue)
    .filter(Boolean)

  return Array.from(new Set(allNames))
})
const showSuccessGuestRow = computed(() => successGuestNames.value.length === 0)
const showNamedGuestSelector = computed(() =>
  responseForm.willAttend === 'yes' &&
  parsedNamedGuests.value.length > 1 &&
  responseForm.guestsAttending > 0 &&
  responseForm.guestsAttending < namedGuestsCount.value
)
const extraGuestsAllowed = computed(() => matchedGuest.value?.extraGuestsAllowed ?? 0)
const totalGuestCapacity = computed(() => matchedGuest.value?.totalGuestCapacity ?? namedGuestsCount.value)
const defaultGuestsAttending = computed(() =>
  totalGuestCapacity.value > 0 ? Math.min(Math.max(namedGuestsCount.value, 1), totalGuestCapacity.value) : 0
)
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
  if (isAnonymousParty.value || extra <= 0) return totalCopy

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
  (value: string) => (!!value?.trim() ? true : 'Name is required'),
  (value: string) => (value?.trim().length <= 160 ? true : 'Name is too long'),
]
const zipCodeRules = [
  (value: string) => (!zipCodeRequired.value || !!normalizeZipCode(value) ? true : 'ZIP Code is required'),
  (value: string) => (!value?.trim() || normalizeZipCode(value).length === 5 ? true : 'Please enter a 5-digit ZIP Code'),
]
const lookupMatchRules = [
  (value: string) => (lookupMatchOptions.value.length === 0 || !!value ? true : 'Please choose your invitation'),
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
const RECAPTCHA_LOADING_MESSAGE = 'reCAPTCHA is still loading. Please wait a moment and try again.'
const recaptchaActionBlocked = computed(() => !recaptchaBypass.value && recaptchaPreparing.value)
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

function clearRsvpCutoffTimeout() {
  if (!rsvpCutoffTimeout) return
  clearTimeout(rsvpCutoffTimeout)
  rsvpCutoffTimeout = null
}

function refreshRsvpClosedState(): boolean {
  const now = Date.now()
  currentTimeMs.value = now
  return isRsvpClosed(new Date(now))
}

function refreshAndScheduleRsvpCutoff(): boolean {
  const closed = refreshRsvpClosedState()
  if (!closed) scheduleRsvpCutoffTimeout()
  return closed
}

function scheduleRsvpCutoffTimeout() {
  clearRsvpCutoffTimeout()

  const remainingMs = rsvpCutoffTimeMs - currentTimeMs.value
  if (remainingMs <= 0 || remainingMs > rsvpCutoffTimeoutWindowMs) return

  rsvpCutoffTimeout = setTimeout(() => {
    rsvpCutoffTimeout = null
    currentTimeMs.value = Date.now()
  }, remainingMs)
}

onMounted(() => {
  refreshAndScheduleRsvpCutoff()
})

onBeforeUnmount(() => {
  clearRsvpCutoffTimeout()
  successAnimation?.pause()
  successAnimation = null
  cleanupRecaptcha()
})

watch(rsvpClosed, (closed) => {
  if (!closed) return
  clearRsvpCutoffTimeout()
  lookupSubmitting.value = false
  rsvpSubmitting.value = false
  phaseIndex.value = 0
  setRsvpErrors([])
})

watch(
  () => [lookupForm.fullName, lookupForm.zipCode],
  () => {
    lookupMatchOptions.value = []
    selectedLookupMatchToken.value = ''
    matchedGuest.value = null
    matchedGuestToken.value = ''
  }
)

watch(phaseIndex, async (nextPhase) => {
  if (nextPhase !== 3) return
  await nextTick()
  startRsvpSuccessAnimation()
})

watch(
  () => responseForm.willAttend,
  (willAttend) => {
    if (willAttend === 'no') {
      responseForm.guestsAttending = 0
      responseForm.attendingNamedGuests = []
      responseForm.guestNames = []
      return
    }

    if (willAttend === 'yes') {
      if (responseForm.guestsAttending < 1) {
        responseForm.guestsAttending = defaultGuestsAttending.value
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
    responseForm.attendingNamedGuests = []
    syncGuestNames()
  }
)

function startRsvpSuccessAnimation() {
  successAnimation?.pause()
  successAnimation = null

  const root = successRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const revealNodes = root.querySelectorAll<HTMLElement>(
    [
      '.rsvp-success-title',
      '.rsvp-success-message',
      '.rsvp-success-received',
      '.rsvp-vine',
      '.rsvp-success-summary',
      '.rsvp-success-guest-list',
      '.rsvp-success-polaroid',
      '.rsvp-success-actions',
    ].join(', ')
  )
  if (!revealNodes.length) return

  successAnimation = anime.animate(revealNodes, {
    opacity: [0, 1],
    translateY: [14, 0],
    scale: [0.985, 1],
    duration: 900,
    delay: anime.stagger(90),
    ease: 'outCubic',
  })
}

function cleanupRecaptcha() {
  recaptchaDisposed = true
  recaptchaRequested.value = false
  recaptchaReady.value = false
  recaptchaPreparing.value = false
  recaptchaReadyPromise = null

  if (typeof document !== 'undefined') {
    document.querySelectorAll(recaptchaArtifactSelector).forEach((node) => {
      node.remove()
    })
  }

  if (typeof window !== 'undefined') {
    unsetRecaptchaGlobal('grecaptcha')
    unsetRecaptchaGlobal('___grecaptcha_cfg')
  }
}

function unsetRecaptchaGlobal(key: 'grecaptcha' | '___grecaptcha_cfg') {
  try {
    window[key] = undefined
  } catch {
    // Some browser-created globals may be non-writable.
  }
  Reflect.deleteProperty(window, key)
}

function onFormFocusIn() {
  refreshAndScheduleRsvpCutoff()
  if (recaptchaBypass.value) return
  recaptchaRequested.value = true
  void ensureRecaptchaReady().catch(() => {})
}

async function waitForGrecaptcha(timeoutMs = 10_000): Promise<Grecaptcha> {
  const startedAt = Date.now()

  while (true) {
    if (recaptchaDisposed) throw new Error('reCAPTCHA was unloaded')

    const grecaptcha = window.grecaptcha
    if (grecaptcha?.ready && grecaptcha.execute) {
      await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()))
      if (recaptchaDisposed) throw new Error('reCAPTCHA was unloaded')
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

  recaptchaDisposed = false
  recaptchaRequested.value = true
  await nextTick()

  const existing = window.grecaptcha
  if (recaptchaReady.value && existing?.ready && existing.execute) return existing
  if (recaptchaReadyPromise) return recaptchaReadyPromise

  recaptchaPreparing.value = true
  recaptchaReadyPromise = waitForGrecaptcha()
    .then((grecaptcha) => {
      if (recaptchaDisposed) throw new Error('reCAPTCHA was unloaded')
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
  if (isAnonymousParty.value) return `Guest ${idx + 1} name`
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

function isApiResponseError(err: unknown): boolean {
  return getStatusCode(err) !== null
}

function serializeError(err: unknown) {
  if (!err || typeof err !== 'object') {
    return {
      name: 'Error',
      message: typeof err === 'string' ? err : 'Unknown error',
    }
  }

  const maybeAny = err as any
  return {
    name: typeof maybeAny?.name === 'string' ? maybeAny.name : 'Error',
    message: typeof maybeAny?.message === 'string' ? maybeAny.message : getErrorMessage(err),
    stack: typeof maybeAny?.stack === 'string' ? maybeAny.stack : undefined,
    statusCode: getStatusCode(err),
    statusMessage: typeof maybeAny?.statusMessage === 'string'
      ? maybeAny.statusMessage
      : typeof maybeAny?.data?.statusMessage === 'string'
        ? maybeAny.data.statusMessage
        : undefined,
    data: maybeAny?.data,
  }
}

function buildRsvpClientErrorReport(operation: string, err: unknown, visibleMessage: string) {
  return {
    operation,
    endpoint: '/rsvp',
    timestampISO: new Date().toISOString(),
    visibleMessage,
    error: serializeError(err),
    page: {
      phaseIndex: phaseIndex.value,
      stepLabel: stepLabel.value,
      rsvpClosed: rsvpClosed.value,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    },
    recaptcha: {
      bypassed: recaptchaBypass.value,
      requested: recaptchaRequested.value,
      ready: recaptchaReady.value,
      preparing: recaptchaPreparing.value,
    },
    lookupForm: {
      fullName: trimFormValue(lookupForm.fullName),
      zipCode: normalizeZipCode(lookupForm.zipCode) || lookupForm.zipCode.trim(),
      zipCodeRequired: zipCodeRequired.value,
      selectedLookupMatchToken: selectedLookupMatchToken.value ? '[redacted]' : '',
      lookupMatchCount: lookupMatchOptions.value.length,
      lookupMatches: lookupMatchOptions.value.map((match) => ({
        displayName: match.guest.displayName,
        namedGuestsCount: match.guest.namedGuestsCount,
        totalGuestCapacity: match.guest.totalGuestCapacity,
      })),
    },
    matchedGuest: matchedGuest.value
      ? {
          firstName: matchedGuest.value.firstName,
          lastName: matchedGuest.value.lastName,
          displayName: matchedGuest.value.displayName,
          namedGuests: matchedGuest.value.namedGuests,
          namedGuestsCount: matchedGuest.value.namedGuestsCount,
          extraGuestsAllowed: matchedGuest.value.extraGuestsAllowed,
          totalGuestCapacity: matchedGuest.value.totalGuestCapacity,
          willAttend: matchedGuest.value.willAttend,
          guestsAttending: matchedGuest.value.guestsAttending,
          guestNames: matchedGuest.value.guestNames,
          matchToken: matchedGuestToken.value ? '[redacted]' : '',
        }
      : null,
    responseForm: {
      willAttend: responseForm.willAttend,
      guestsAttending: responseForm.guestsAttending,
      attendingNamedGuests: responseForm.attendingNamedGuests,
      guestNames: responseForm.guestNames.map(trimFormValue),
      selectedGuestNames: selectedGuestNames(),
      showNamedGuestSelector: showNamedGuestSelector.value,
      additionalGuestsAttending: additionalGuestsAttending.value,
    },
  }
}

async function reportRsvpClientError(operation: string, err: unknown, visibleMessage: string) {
  try {
    await $fetch('/api/rsvp/error', {
      method: 'POST',
      body: buildRsvpClientErrorReport(operation, err, visibleMessage),
    })
  } catch (reportErr) {
    console.error('[rsvp] failed to report client error:', reportErr)
  }
}

async function validateLookupFormOrReport(): Promise<boolean> {
  try {
    await lookupFormRef.value?.validate?.()
    return true
  } catch (err) {
    const message = getErrorMessage(err)
    setRsvpErrors([message])
    void reportRsvpClientError('lookup-form-validation', err, message)
    return false
  }
}

async function validateResponseFormOrReport(): Promise<boolean> {
  try {
    await responseFormRef.value?.validate?.()
    return true
  } catch (err) {
    const message = getErrorMessage(err)
    setRsvpErrors([message])
    void reportRsvpClientError('response-form-validation', err, message)
    return false
  }
}

function validateLookupValues(): string[] {
  const errors: string[] = []
  const fullName = trimFormValue(lookupForm.fullName)
  const zipCode = normalizeZipCode(lookupForm.zipCode)

  if (!fullName) errors.push('Name is required.')
  else if (fullName.length > 160) errors.push('Name is too long.')

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

    if (showNamedGuestSelector.value) {
      const selected = responseForm.attendingNamedGuests
      if (selected.length !== responseForm.guestsAttending) {
        errors.push('Please select which guests will be attending.')
      }
    }

    if (additionalCount > 0) {
      const names = selectedGuestNames()
      if (names.length !== additionalCount || names.some((name) => !name)) {
        errors.push(isAnonymousParty.value
          ? 'Please enter a name for each guest.'
          : 'Please enter a name for each additional guest.')
      } else if (names.some((name) => name.length > 120)) {
        errors.push(isAnonymousParty.value
          ? 'Each guest name must be 120 characters or fewer.'
          : 'Each additional guest name must be 120 characters or fewer.')
      }
    }
  }

  return errors
}

function applyGuestResponse(guest: RsvpGuest, matchToken: string) {
  matchedGuest.value = guest
  matchedGuestToken.value = matchToken
  responseForm.willAttend = guest.willAttend
  responseForm.guestsAttending = guest.willAttend === 'yes'
    ? Math.min(Math.max(guest.guestsAttending, 1), guest.totalGuestCapacity)
    : 0
  responseForm.attendingNamedGuests = []
  responseForm.guestNames = guest.willAttend === 'yes' ? guest.guestNames.slice(0, additionalGuestsAttending.value) : []
  syncGuestNames()
}

async function lookupGuest() {
  setRsvpErrors([])

  if (refreshAndScheduleRsvpCutoff()) {
    setRsvpErrors([RSVP_CLOSED_MESSAGE])
    phaseIndex.value = 0
    return
  }

  if (recaptchaActionBlocked.value) {
    setRsvpErrors([RECAPTCHA_LOADING_MESSAGE])
    return
  }

  if (!(await validateLookupFormOrReport())) return

  const validationErrors = validateLookupValues()
  if (validationErrors.length) {
    setRsvpErrors(validationErrors)
    return
  }

  if (lookupMatchOptions.value.length > 0) {
    if (!selectedLookupMatch.value) {
      setRsvpErrors(['Please choose your invitation.'])
      return
    }

    applyGuestResponse(selectedLookupMatch.value.guest, selectedLookupMatch.value.matchToken)
    setRsvpErrors([])
    phaseIndex.value = 1
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

    if (response.matches?.length) {
      lookupMatchOptions.value = response.matches
      selectedLookupMatchToken.value = ''
      zipCodeRequired.value = response.matches.length > 1 || !!normalizeZipCode(lookupForm.zipCode)
      setRsvpErrors([])
      return
    }

    applyGuestResponse(response.guest, response.matchToken)
    lookupMatchOptions.value = []
    selectedLookupMatchToken.value = ''
    zipCodeRequired.value = !!normalizeZipCode(lookupForm.zipCode)
    setRsvpErrors([])
    phaseIndex.value = 1
  } catch (err) {
    if (getStatusCode(err) === 409) {
      zipCodeRequired.value = true
    }
    const message = getErrorMessage(err)
    if (!isApiResponseError(err)) {
      void reportRsvpClientError('lookup-submit', err, message)
    }
    setRsvpErrors([message])
  } finally {
    lookupSubmitting.value = false
  }
}

async function submitRsvp() {
  setRsvpErrors([])

  if (refreshAndScheduleRsvpCutoff()) {
    setRsvpErrors([RSVP_CLOSED_MESSAGE])
    phaseIndex.value = 0
    return
  }

  if (recaptchaActionBlocked.value) {
    setRsvpErrors([RECAPTCHA_LOADING_MESSAGE])
    return
  }

  if (!(await validateResponseFormOrReport())) return

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
        matchToken: matchedGuestToken.value || undefined,
        willAttend: responseForm.willAttend,
        guestsAttending: responseForm.willAttend === 'yes' ? responseForm.guestsAttending : 0,
        attendingNamedGuests: responseForm.willAttend === 'yes' && showNamedGuestSelector.value
          ? responseForm.attendingNamedGuests
          : [],
        guestNames: responseForm.willAttend === 'yes' ? selectedGuestNames() : [],
        captchaToken,
      },
    })

    setRsvpErrors([])
    phaseIndex.value = 3
  } catch (err) {
    const message = getErrorMessage(err)
    if (!isApiResponseError(err)) {
      void reportRsvpClientError('submit-rsvp', err, message)
    }
    setRsvpErrors([message])
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

  if (refreshAndScheduleRsvpCutoff()) {
    setRsvpErrors([RSVP_CLOSED_MESSAGE])
    phaseIndex.value = 0
    return
  }

  phaseIndex.value = 2
  await nextTick()
  responseFormRef.value?.resetValidation?.()
}

function returnToFaq() {
  setRsvpErrors([])
  phaseIndex.value = 1
}
</script>
