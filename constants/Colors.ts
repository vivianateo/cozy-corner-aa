export const COLORS = {
  background: '#F7F5F2',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0EDE8',
  text: '#1A1714',
  textSecondary: '#7A6F65',
  textTertiary: '#B5ADA5',
  primary: '#E8734A',
  primaryMuted: 'rgba(232, 115, 74, 0.10)',
  accent: '#4CAF82',
  warning: '#F5A623',
  danger: '#E53E3E',
  border: 'rgba(26, 23, 20, 0.08)',
  divider: 'rgba(26, 23, 20, 0.05)',
  categoryColors: {
    ristoranti: '#E8734A',
    parchi: '#4CAF82',
    musei: '#7B68EE',
    'caffè': '#C8956C',
    hotel: '#4A90D9',
    altro: '#9B8EA0',
  } as Record<string, string>,
};

export const CATEGORY_LABELS: Record<string, string> = {
  tutti: 'Tutti',
  ristoranti: 'Ristoranti',
  parchi: 'Parchi',
  musei: 'Musei',
  'caffè': 'Caffè',
  hotel: 'Hotel',
  altro: 'Altro',
};

export const CATEGORIES = ['tutti', 'ristoranti', 'parchi', 'musei', 'caffè', 'hotel', 'altro'] as const;

export const AMENITIES = ['seggiolone', 'menu_bimbi', 'fasciatoio', 'luogo_gioco'] as const;
export type Amenity = typeof AMENITIES[number];

export const AMENITY_LABELS: Record<string, string> = {
  seggiolone: 'Seggiolone',
  menu_bimbi: 'Menù bimbi',
  fasciatoio: 'Fasciatoio',
  luogo_gioco: 'Luogo gioco',
};

export const AMENITY_ICONS: Record<string, string> = {
  seggiolone: '🪑',
  menu_bimbi: '🍼',
  fasciatoio: '🚿',
  luogo_gioco: '🎠',
};
