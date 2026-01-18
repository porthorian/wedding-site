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
    airports: ['EWR (Newark)', 'JFK', 'LGA'],
    hotels: [
      { name: 'Hotel Option 1', url: 'https://example.com', note: 'Block code: ROSA' },
      { name: 'Hotel Option 2', url: 'https://example.com', note: 'Closest to venue' },
    ],
    gettingAround: [
      'Uber/Lyft is widely available.',
      "If you're staying near the shore, plan ~25-35 min drive.",
    ],
    photo:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  registry: [
    { name: 'Zola', url: 'https://example.com' },
    { name: 'Amazon', url: 'https://example.com' },
    { name: 'Crate & Barrel', url: 'https://example.com' },
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
