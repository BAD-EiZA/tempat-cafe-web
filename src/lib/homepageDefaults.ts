export const SECTION_TYPES = [
  'hero',
  'about',
  'featured_menu',
  'promo',
  'gallery',
  'hours',
  'location',
  'facilities',
  'testimonial',
  'cta',
  'social',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  about: 'Tentang',
  featured_menu: 'Menu unggulan',
  promo: 'Promo',
  gallery: 'Galeri',
  hours: 'Jam operasional',
  location: 'Lokasi',
  facilities: 'Fasilitas',
  testimonial: 'Testimoni',
  cta: 'Ajakan aksi',
  social: 'Sosial',
};

export const DEFAULT_DESIGN = {
  primaryColor: '#1b4332',
  secondaryColor: '#d97706',
  font: 'Outfit Variable',
};

export const DEFAULT_SECTIONS = [
  {
    type: 'hero',
    content: {
      title: 'Selamat datang',
      subtitle: 'Kopi, makanan, dan tempat nyaman untuk bekerja atau berkumpul.',
      imageUrl: '/assets/hero-interior.svg',
    },
  },
  {
    type: 'about',
    content: {
      body: 'Ceritakan singkat tentang kafe Anda: suasana, specialty, dan apa yang membedakan tempat ini.',
    },
  },
  { type: 'featured_menu', content: {} },
  { type: 'hours', content: { text: 'Sen-Min 08:00-22:00' } },
  { type: 'location', content: { address: '', mapsUrl: '' } },
  { type: 'facilities', content: { items: 'WiFi, AC, Outdoor' } },
  { type: 'promo', content: {} },
  { type: 'gallery', content: { urls: '' } },
  {
    type: 'cta',
    content: { menuLabel: 'Lihat Menu', reservationLabel: 'Reservasi' },
  },
  { type: 'social', content: { instagram: '', whatsapp: '' } },
];

export function emptySectionContent(type: string): Record<string, string> {
  switch (type) {
    case 'hero':
      return { title: '', subtitle: '', imageUrl: '/assets/hero-interior.svg' };
    case 'about':
      return { body: '' };
    case 'hours':
      return { text: '' };
    case 'location':
      return { address: '', mapsUrl: '' };
    case 'facilities':
      return { items: '' };
    case 'gallery':
      return { urls: '' };
    case 'testimonial':
      return { quote: '', author: '' };
    case 'cta':
      return { menuLabel: 'Lihat Menu', reservationLabel: 'Reservasi' };
    case 'social':
      return { instagram: '', whatsapp: '' };
    default:
      return {};
  }
}
