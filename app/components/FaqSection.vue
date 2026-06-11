<template>
  <div :class="['faq-section', { 'faq-section--compact': compact }]">
    <v-card v-if="!compact" elevation="0" class="section-card faq-card">
      <v-card-text class="panel-content faq-panel-content">
        <div class="faq-intro">
          <p class="eyebrow">Questions</p>
          <h2 class="panel-title faq-title">FAQ</h2>
          <p class="faq-copy">
            A few helpful details before you RSVP.
          </p>
        </div>

        <div class="faq-list-wrap">
          <v-expansion-panels class="faq-panels" variant="accordion" multiple>
            <v-expansion-panel
              v-for="item in wedding.faq"
              :key="item.question"
              class="faq-panel"
              elevation="0"
            >
              <v-expansion-panel-title class="faq-question">
                {{ item.question }}
              </v-expansion-panel-title>
              <v-expansion-panel-text class="faq-answer">
                {{ item.answer }}
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-card-text>
    </v-card>

    <template v-else>
      <div class="faq-intro">
        <p class="eyebrow">Questions</p>
        <h1 class="rsvp-page-title">Before you RSVP</h1>
        <p class="rsvp-page-copy">
          A few helpful details for the day.
        </p>
      </div>

      <div class="faq-list-wrap">
        <v-expansion-panels class="faq-panels faq-panels--compact" variant="accordion" multiple>
          <v-expansion-panel
            v-for="item in wedding.faq"
            :key="item.question"
            class="faq-panel"
            elevation="0"
          >
            <v-expansion-panel-title class="faq-question">
              {{ item.question }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="faq-answer">
              {{ item.answer }}
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { wedding } from '~/data/wedding'

defineProps<{
  compact?: boolean
}>()
</script>
