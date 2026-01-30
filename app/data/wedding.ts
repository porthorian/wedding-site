export const wedding = {
  names: 'Rosa & Vinnie',
  dateISO: '2026-08-07T16:30:00-04:00',
  location: 'The TillingHouse, Tinton Falls, NJ',
  hero: {
    dateDisplay: 'August 7, 2026',
    timeDisplay: '4:30 PM',
    tagline: 'A garden ceremony, candlelit dinner, and dancing beneath drifting blooms.',
    ctas: [
      { label: 'RSVP', href: '#rsvp' },
      { label: 'View Schedule', href: '#schedule' },
      { label: 'Travel', href: '#travel' },
    ],
  },
  schedule: [
    { time: '4:30 PM', title: 'Ceremony', detail: 'Arrive by 4:15 PM' },
    { time: '5:15 PM', title: 'Cocktail Hour', detail: 'Drinks + bites' },
    { time: '6:30 PM', title: 'Reception', detail: 'Dinner + dancing' },
    { time: '10:45 PM', title: 'Last Call', detail: 'One more song' },
  ],
  travel: {
    airports: ['EWR (Newark)'],
    hotels: [
      { name: 'Sheraton Eatontown Hotel', url: 'https://www.marriott.com/en-us/hotels/ewres-sheraton-eatontown-hotel/overview/', note: 'Block code: TBD - Shuttle to Venue' },
      { name: 'Doubletree by Hilton Tinton Falls Eatontown', url: 'https://www.hilton.com/en/hotels/jfketdt-doubletree-tinton-falls-eatontown', note: 'Closest to venue' },
    ],
    gettingAround: [
      'Uber/Lyft is widely available.',
      "If you're staying near the shore, plan ~20 min drive.",
    ],
    photo:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  registry: [
    { name: 'Williams Sonoma', url: 'https://www.williams-sonoma.com/registry/q2tgk9rvsg/registry-list.html' },
    { name: 'Crate & Barrel', url: 'https://www.crateandbarrel.com/gift-registry/rosa-franze-and-vinnie-marone/r7391211' },
    { name: 'Amazon', url: 'https://www.amazon.com/wedding/guest-view/3UW4QAP93JK2E' },
  ],
  gallery: [
    {
      title: 'Engagement at the shore',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Sunset picnic',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'City stroll',
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    },
  ],
}
