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
                <template
                  v-for="part in getFaqAnswerParts(item.answer)"
                  :key="part.key"
                >
                  <a
                    v-if="part.type === 'link'"
                    class="faq-answer-link"
                    :href="part.href"
                    :target="part.external ? '_blank' : undefined"
                    :rel="part.external ? 'noopener noreferrer' : undefined"
                  >
                    {{ part.text }}
                  </a>
                  <span v-else>{{ part.text }}</span>
                </template>
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
              <template
                v-for="part in getFaqAnswerParts(item.answer)"
                :key="part.key"
              >
                <a
                  v-if="part.type === 'link'"
                  class="faq-answer-link"
                  :href="part.href"
                  :target="part.external ? '_blank' : undefined"
                  :rel="part.external ? 'noopener noreferrer' : undefined"
                >
                  {{ part.text }}
                </a>
                <span v-else>{{ part.text }}</span>
              </template>
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

type FaqAnswerPart =
  | {
      key: string
      text: string
      type: 'text'
    }
  | {
      external: boolean
      href: string
      key: string
      text: string
      type: 'link'
    }

const faqUrlPattern = /https?:\/\/[^\s<>"']+/g
const sameSiteFaqHosts = new Set(['wedding.marone.us', 'www.wedding.marone.us'])
const trailingUrlPunctuationPattern = /[),.!?:;]+$/

const splitFaqUrlTrailingText = (value: string) => {
  const trailingMatch = value.match(trailingUrlPunctuationPattern)

  if (!trailingMatch) {
    return { trailingText: '', urlText: value }
  }

  return {
    trailingText: trailingMatch[0],
    urlText: value.slice(0, -trailingMatch[0].length),
  }
}

const getFaqLinkProps = (urlText: string) => {
  try {
    const url = new URL(urlText)

    if (sameSiteFaqHosts.has(url.hostname)) {
      return {
        external: false,
        href: `${url.pathname}${url.search}${url.hash}` || '/',
      }
    }
  } catch {
    return {
      external: true,
      href: urlText,
    }
  }

  return {
    external: true,
    href: urlText,
  }
}

const getFaqAnswerParts = (answer: string) => {
  const parts: FaqAnswerPart[] = []
  let cursor = 0

  for (const match of answer.matchAll(faqUrlPattern)) {
    const matchIndex = match.index ?? 0
    const rawUrlText = match[0]
    const { trailingText, urlText } = splitFaqUrlTrailingText(rawUrlText)

    if (matchIndex > cursor) {
      parts.push({
        key: `${matchIndex}-text`,
        text: answer.slice(cursor, matchIndex),
        type: 'text',
      })
    }

    if (urlText) {
      const linkProps = getFaqLinkProps(urlText)

      parts.push({
        ...linkProps,
        key: `${matchIndex}-link`,
        text: urlText,
        type: 'link',
      })
    }

    if (trailingText) {
      parts.push({
        key: `${matchIndex}-trailing`,
        text: trailingText,
        type: 'text',
      })
    }

    cursor = matchIndex + rawUrlText.length
  }

  if (cursor < answer.length) {
    parts.push({
      key: `${cursor}-text`,
      text: answer.slice(cursor),
      type: 'text',
    })
  }

  return parts
}
</script>
