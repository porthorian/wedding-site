export const wedding = {
  names: 'Rosa & Vincent',
  dateISO: '2026-08-07T16:30:00-04:00',
  location: 'The TillingHouse, Eatontown, NJ',
  hero: {
    dateDisplay: 'August 7, 2026',
    timeDisplay: '4:30 PM',
    tagline: '',
    ctas: [
      { label: 'Registry', href: '#registry' },
      { label: 'View Schedule', href: '#schedule' },
      { label: 'Travel', href: '#travel' },
    ],
  },
  schedule: [
    { time: '3:00 PM', title: 'Ceremony', detail: 'Arrive by 2:45 PM @ Saint Mary\'s Church in Deal, NJ' },
    { time: "4:00 PM", title: 'Limbo', detail: 'TBD' },
    { time: '6:00 PM', title: 'Cocktail Hour', detail: 'Drinks + bites' },
    { time: '7:00 PM', title: 'Reception', detail: 'Dinner + dancing' },
    { time: '11:00 PM', title: 'End of Night?', detail: 'TBD' },
  ],
  travel: {
    airports: [
      // { code: 'EWR', name: 'Newark Liberty International Airport', note: 'Usually the quickest option to Eatontown (~45–60 min)' },
    ],
    hotels: [
      { name: 'Sheraton Eatontown Hotel', url: 'https://www.marriott.com/en-us/hotels/ewres-sheraton-eatontown-hotel/overview/', note: 'Block code: TBD' },
    ],
    gettingAround: [
      'Uber/Lyft is widely available.',
      "If you're staying near the shore, plan ~20 min drive.",
    ],
    photo:
      '/images/tillinghouse_sketch.png',
  },
  registry: [
    {
      name: 'Williams Sonoma',
      url: 'https://www.williams-sonoma.com/registry/q2tgk9rvsg/registry-list.html',
      tagline: 'Kitchen and hosting classics',
      blurb:
        'A mix of cookware, table details, and the pieces we picture using for holiday dinners and weekend breakfasts.',
      highlights: ['Cookware', 'Bakeware', 'Tabletop'],
      accent: 'rgba(224, 170, 88, 0.3)',
    },
    {
      name: 'Crate & Barrel',
      url: 'https://www.crateandbarrel.com/gift-registry/rosa-franze-and-vinnie-marone/r7391211',
      tagline: 'Everyday home staples',
      blurb:
        'Core home essentials and practical upgrades that will become part of our regular routine right away.',
      highlights: ['Dining set', 'Barware', 'Entertaining'],
      accent: 'rgba(168, 168, 168, 0.28)',
    },
    {
      name: 'Anthropologie',
      url: 'https://www.anthropologie.com/registry/listing?registryId=58FCF2E3B22A',
      tagline: 'Character pieces and decor',
      blurb:
        'Decor and special pieces with color and personality that make a house feel warm and finished.',
      highlights: ['Decor', 'Glassware', 'Textiles'],
      accent: 'rgba(191, 153, 117, 0.28)',
    },
  ],
  gallery: [
    { url: '/images/gallery/JoePalaiaEngagementSession133191.jpg' },
    { url: '/images/gallery/JoePalaiaEngagementSession133201.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134134.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134138.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134139.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134143.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134159.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134146.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134193.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134157.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134160.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134166.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134163.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134083.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134188.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134217.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134218.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134228.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134153.jpg' },
    { url: '/images/gallery/JoePalaiaParkEngagementSession134230.jpg' }
  ],
}
