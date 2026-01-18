# Wedding Website Design Plan

## Goals
- Whimsical, storybook feel with soft florals and gentle motion.
- Single-page flow that is easy to navigate and RSVP-friendly.
- Use Vuetify for layout + typography, Nuxt/Vue for structure, anime.js for SVG motion.

## Required Sections
1. Hero
   - Names, date, location.
   - Live countdown.
   - Primary CTA: RSVP.
2. Schedule
   - Timeline list of key moments (ceremony, cocktail hour, dinner, dancing).
3. Travel Arrangements
   - Lodging suggestions, transport notes, and venue address.
4. Gallery
   - Engagement photos or placeholders; lightbox optional.
5. Registry
   - Outbound links to multiple registries.
6. RSVP & Song Requests
   - Form CTA (modal or separate section); song suggestion field.

## Visual Direction
- Palette: warm neutrals, blush petals, sage greens, soft gold accents.
- Typography: elegant script for names, serif for headings, clean sans for body.
- Background: subtle gradient with faint botanical textures.
- Cards: airy panels with soft borders and gentle shadows.

## Animation Concept (SVG + anime.js)
- Create an SVG floral cluster with layered petals + stems.
- Place 2–3 clusters as decorative elements (top hero, mid-page, footer).
- Use anime.js to:
  - Sway stems on a slow loop (rotate around base).
  - Drift petals slightly with staggered delays.
  - Add a soft opacity pulse on highlight blooms.
- Tie motion speed to scroll position for gentle parallax (optional).

## Information Architecture
- Top nav anchors: Hero, Schedule, Travel, Gallery, Registry, RSVP.
- Each section uses Vuetify `v-container`, `v-row`, `v-col`.
- CTA buttons consistent in size and tone.

## Content Checklist (to provide)
- Names, date, location, time.
- Full schedule items.
- Travel options + hotel blocks.
- Registry URLs.
- RSVP form destination (Google Form, custom endpoint, etc.).
- Photo assets for gallery.

## Implementation Notes
- Use a dedicated `FloralMotion.vue` component for the SVG animation.
- Load anime.js once in the component; ensure SSR safety via `onMounted`.
- Keep animations lightweight for mobile; reduce motion if `prefers-reduced-motion` is set.

## Editable Content (Single Source of Truth)
Store all editable content in a single config object so updates are simple and centralized. Example:

```ts
const wedding = {
  names: "Rosa & Vinnie",
  dateISO: "2026-08-07T16:30:00-04:00", // adjust time
  location: "Tinton Falls, NJ",
  schedule: [
    { time: "4:30 PM", title: "Ceremony", detail: "Arrive by 4:15 PM" },
    { time: "5:15 PM", title: "Cocktail Hour", detail: "Drinks + bites" },
    { time: "6:30 PM", title: "Reception", detail: "Dinner + dancing" },
    { time: "10:45 PM", title: "Last Call", detail: "One more song" },
  ],
  travel: {
    airports: ["EWR (Newark)", "JFK", "LGA"],
    hotels: [
      { name: "Hotel Option 1", url: "https://example.com", note: "Block code: ROSA" },
      { name: "Hotel Option 2", url: "https://example.com", note: "Closest to venue" },
    ],
    gettingAround: [
      "Uber/Lyft is widely available.",
      "If you’re staying near the shore, plan ~25–35 min drive.",
    ],
  },
  registry: [
    { name: "Zola", url: "https://example.com" },
    { name: "Amazon", url: "https://example.com" },
    { name: "Crate & Barrel", url: "https://example.com" },
  ],
  gallery: [
    {
      title: "Engagement at the shore",
      url: "https://example.com/photo-1.jpg",
    },
    {
      title: "Sunset picnic",
      url: "https://example.com/photo-2.jpg",
    },
    {
      title: "City stroll",
      url: "https://example.com/photo-3.jpg",
    },
  ],
};
```

## Gallery Section (Vuetify)
- Display images from `wedding.gallery` as a responsive grid.
- Use `v-img` inside `v-card` for each image.
- Optional: add a dialog/lightbox to view a larger version when clicked.
