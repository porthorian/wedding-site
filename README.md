# Wedding Website (Nuxt 4 + Vue 3 + Vuetify)

Whimsical wedding website built with Nuxt, Vue 3, and Vuetify. The design leans into soft botanicals,
floating florals, and gentle motion to create a storybook feel.

## Goals

- Use Vuetify for layout, typography, and sections.
- Add animated floral accents and a warm, whimsical palette.
- Keep the page responsive with a clear RSVP-focused call to action.

## Project plan

1. **Visual foundation**
   - Define theme colors in Vuetify.
   - Add custom fonts and background gradients.
   - Introduce animated floral elements for ambiance.
2. **Content structure**
   - Hero, story, weekend details.
   - Schedule, travel, registry, gallery, RSVP band.
3. **Polish**
   - Staggered reveal animations.
   - Verify mobile layout and spacing.

## Scripts

```bash
yarn dev
yarn build
yarn preview
```

## RSVP sheet

The RSVP flow reads and updates one Google Sheets worksheet. Share the sheet with the configured service account
and provide the env vars shown in `.env.example`.

Set `DISCORD_RSVP_WEBHOOK_URL` to a Discord channel incoming webhook URL to receive server-side notifications for
new RSVP submissions, changed RSVP updates, and operational RSVP error reports.

Required worksheet columns:

- `First Name`
- `Last Name`
- `ZIP Code`
- `Named Guests Count`
- `Guests Eligible`
- `Will Attend`
- `Decline Reason`
- `Guests Attending`
- `Guests Names`
- `Submitted At`
- `Updated At`

`Named Guests Count` is the number of people named on the invitation. Use `1` or higher for ordinary named
invitees. When `Named Guests Count` is blank or `0`, the invitation is treated as an anonymous party: no names
are assumed from the sheet, `Guests Eligible` is the maximum party size, and the RSVP form asks for each attendee's
name. For rows with named guests, `Guests Eligible` is the number of additional guests allowed.
`Guests Attending` stores the total attending count.

## Notes

- Main page: `app/pages/index.vue`
- RSVP page: `app/pages/rsvp.vue`
- Vuetify plugin: `plugins/vuetify.ts`
- Global styles: `assets/styles/main.css`
