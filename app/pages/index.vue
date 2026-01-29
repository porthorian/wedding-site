<template>
  <section class="page-shell paper-bg">
    <v-container class="py-10">
      <section id="hero" class="landing-section landing-section--hero">
        <div class="hero-frame">
          <div ref="heroFrameRef" class="hero-frame-art" aria-hidden="true" v-html="heroFrameSvg" />
          <v-card class="panel panel-hero hero-frame-card" elevation="0">
            <v-card-text class="panel-content">
              <p class="eyebrow">{{ wedding.hero.dateDisplay }} • {{ wedding.location }}</p>
              <h1 class="hero-title">{{ wedding.names }}</h1>
              <p class="hero-tagline">{{ wedding.hero.tagline }}</p>
              <div class="hero-countdown">
                <div class="section-label">Countdown</div>
                <Countdown :date="weddingDate" />
              </div>
              <div class="button-row">
                <v-btn
                  v-for="cta in wedding.hero.ctas"
                  :key="cta.label"
                  :href="cta.href"
                  class="text-none"
                  color="primary"
                  variant="elevated"
                >
                  {{ cta.label }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </section>

      <section id="schedule" class="landing-section">
        <v-card class="panel" elevation="0">
          <v-card-text class="panel-content">
            <h2 class="panel-title">Our Schedule</h2>
            <v-row>
              <v-col v-for="item in wedding.schedule" :key="item.time" cols="12" sm="6" md="3">
                <div class="mini-card">
                  <div class="mini-time">{{ item.time }}</div>
                  <div class="mini-title">{{ item.title }}</div>
                  <div class="mini-detail">{{ item.detail }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </section>

      <section id="travel" class="landing-section">
        <v-card class="panel" elevation="0">
          <v-card-text class="panel-content">
            <h2 class="panel-title">Travel &amp; Accommodations</h2>
            <v-row>
              <v-col cols="12" md="7">
                <div class="section-block">
                  <div class="section-label">Nearby Airports</div>
                  <v-chip-group>
                    <v-chip v-for="airport in wedding.travel.airports" :key="airport" color="secondary">
                      {{ airport }}
                    </v-chip>
                  </v-chip-group>
                </div>
                <div class="section-block">
                  <div class="section-label">Hotels</div>
                  <div v-for="hotel in wedding.travel.hotels" :key="hotel.name" class="link-row">
                    <a :href="hotel.url" target="_blank" rel="noreferrer">{{ hotel.name }}</a>
                    <span class="muted">{{ hotel.note }}</span>
                  </div>
                </div>
                <div class="section-block">
                  <div class="section-label">Local Transport</div>
                  <div v-for="note in wedding.travel.gettingAround" :key="note" class="muted">
                    {{ note }}
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="5">
                <v-img
                  class="travel-photo"
                  :src="wedding.travel.photo"
                  alt="Travel"
                  height="240"
                  cover
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </section>

      <section id="gallery" class="landing-section">
        <v-card class="panel" elevation="0">
          <v-card-text class="panel-content">
            <h2 class="panel-title">Photo Gallery</h2>
            <v-row dense>
              <v-col v-for="photo in wedding.gallery" :key="photo.url" cols="12" sm="6" md="4">
                <v-card class="gallery-card" elevation="0">
                  <v-img :src="photo.url" :alt="photo.title" height="200" cover />
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </section>

      <section id="registry" class="landing-section">
        <v-card class="panel" elevation="0">
          <v-card-text class="panel-content">
            <h2 class="panel-title">Our Registry</h2>
            <v-row>
              <v-col v-for="item in wedding.registry" :key="item.name" cols="12" sm="4">
                <div class="registry-card">
                  <div class="registry-name">{{ item.name }}</div>
                  <v-btn
                    :href="item.url"
                    target="_blank"
                    rel="noreferrer"
                    class="text-none"
                    color="primary"
                    variant="elevated"
                  >
                    View Registry
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </section>

      <section id="rsvp" class="landing-section">
        <v-card class="panel" elevation="0">
          <v-card-text class="panel-content">
            <h2 class="panel-title">RSVP &amp; Song Request</h2>
            <v-row>
              <v-col cols="12" md="7">
                <v-form>
                  <v-text-field label="Your Name" variant="underlined" />
                  <v-text-field label="Email Address" variant="underlined" />
                  <div class="field-group">
                    <div class="section-label">Will you attend?</div>
                    <v-radio-group inline>
                      <v-radio label="Yes" value="yes" />
                      <v-radio label="No" value="no" />
                    </v-radio-group>
                  </div>
                  <v-text-field label="Number of Guests" variant="underlined" />
                  <v-text-field label="Dietary Restrictions" variant="underlined" />
                  <v-text-field label="Song Request" variant="underlined" />
                  <v-textarea label="Message" variant="underlined" rows="3" />
                </v-form>
              </v-col>
              <v-col cols="12" md="5" class="d-flex align-end">
                <div class="button-row">
                  <v-btn color="primary" class="text-none" variant="elevated">Send</v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </section>
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as anime from 'animejs'
import { wedding } from '~/data/wedding'
import heroFrameSvg from '~/assets/svgs/810543_23257-NV0O8K.svg?raw'

const weddingDate = new Date(wedding.dateISO)
const heroFrameRef = ref<HTMLElement | null>(null)
let heroAnimation: anime.JSAnimation | null = null
let floatAnimation: anime.JSAnimation | null = null

onMounted(() => {
  const root = heroFrameRef.value
  if (!root) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const paths = root.querySelectorAll('path')
  if (paths.length === 0) return

  heroAnimation = anime.animate(paths, {
    keyframes: [
      { translateX: -6, translateY: -2, rotate: -2 },
      { translateX: 6, translateY: 2, rotate: 2 },
      { translateX: -6, translateY: -2, rotate: -2 },
    ],
    ease: 'inOutSine',
    duration: 8000,
    delay: anime.stagger(40, { from: 'center' }),
    loop: true,
    alternate: true
  })

  floatAnimation = anime.animate(root, {
    keyframes: [
      { translateX: -6, translateY: -2, rotate: -1.2 },
      { translateX: 6, translateY: 2, rotate: 1.2 },
      { translateX: -6, translateY: -2, rotate: -1.2 },
    ],
    duration: 8000,
    ease: 'inOutSine',
    loop: true,
    alternate: true
  })
})

onBeforeUnmount(() => {
  heroAnimation?.pause()
  floatAnimation?.pause()
  heroAnimation = null
  floatAnimation = null
})
</script>
