// ─────────────────────────────────────────────────────────────
// Kōen — Categorías universales (todos los eventos de Uruguay)
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  // ── DEPORTES ──────────────────────────────────────────────
  { id: 'futbol',          label: 'Fútbol',          emoji: '⚽', color: '#2edf7a',  group: 'deportes' },
  { id: 'basket',          label: 'Básquet',         emoji: '🏀', color: '#ff8940',  group: 'deportes' },
  { id: 'rugby',           label: 'Rugby',           emoji: '🏉', color: '#a855f7',  group: 'deportes' },
  { id: 'tenis',           label: 'Tenis / Pádel',   emoji: '🎾', color: '#38b6ff',  group: 'deportes' },
  { id: 'atletismo',       label: 'Atletismo',       emoji: '🏃', color: '#d4f53c',  group: 'deportes' },
  { id: 'ciclismo',        label: 'Ciclismo',        emoji: '🚴', color: '#f43f8e',  group: 'deportes' },
  { id: 'natacion',        label: 'Natación',        emoji: '🏊', color: '#22d3ee',  group: 'deportes' },
  { id: 'artes_marciales', label: 'Artes Marciales', emoji: '🥊', color: '#ff4d4d',  group: 'deportes' },
  { id: 'deporte',         label: 'Deporte General', emoji: '🏅', color: '#6868a0',  group: 'deportes' },

  // ── MÚSICA Y ESPECTÁCULO ──────────────────────────────────
  { id: 'musica',          label: 'Música / Recital', emoji: '🎵', color: '#f472b6',  group: 'espectaculo' },
  { id: 'teatro',          label: 'Teatro',           emoji: '🎭', color: '#c084fc',  group: 'espectaculo' },
  { id: 'danza',           label: 'Danza',            emoji: '💃', color: '#e879f9',  group: 'espectaculo' },
  { id: 'humor',           label: 'Humor / Stand-up', emoji: '🎤', color: '#facc15',  group: 'espectaculo' },
  { id: 'cine',            label: 'Cine',             emoji: '🎬', color: '#60a5fa',  group: 'espectaculo' },
  { id: 'circo',           label: 'Circo / Magia',    emoji: '🎪', color: '#fb923c',  group: 'espectaculo' },

  // ── CULTURA Y ARTE ────────────────────────────────────────
  { id: 'arte',            label: 'Arte / Expo',      emoji: '🎨', color: '#34d399',  group: 'cultura' },
  { id: 'feria',           label: 'Feria / Mercado',  emoji: '🏪', color: '#fbbf24',  group: 'cultura' },
  { id: 'gastronomia',     label: 'Gastronomía',      emoji: '🍽️', color: '#f97316',  group: 'cultura' },
  { id: 'educacion',       label: 'Charla / Taller',  emoji: '📚', color: '#818cf8',  group: 'cultura' },
  { id: 'carnaval',        label: 'Carnaval',         emoji: '🎉', color: '#f43f8e',  group: 'cultura' },

  // ── GEEK / OTAKU / COSPLAY ────────────────────────────────
  { id: 'anime',           label: 'Anime / Otaku',    emoji: '⛩️',  color: '#f472b6',  group: 'geek' },
  { id: 'cosplay',         label: 'Cosplay',          emoji: '🦸',  color: '#c084fc',  group: 'geek' },
  { id: 'gaming',          label: 'Gaming / Esports', emoji: '🕹️',  color: '#4ade80',  group: 'geek' },
  { id: 'rol',             label: 'Rol / RPG / D&D',  emoji: '🎲',  color: '#fb923c',  group: 'geek' },
  { id: 'magic',           label: 'Magic / TCG',      emoji: '🃏',  color: '#facc15',  group: 'geek' },
  { id: 'comics',          label: 'Cómics / Manga',   emoji: '💥',  color: '#f97316',  group: 'geek' },
  { id: 'geek',            label: 'Cultura Geek',     emoji: '🤖',  color: '#818cf8',  group: 'geek' },

  // ── OTROS ─────────────────────────────────────────────────
  { id: 'familia',         label: 'Familia / Niños',  emoji: '👨‍👩‍👧', color: '#86efac',  group: 'otros' },
  { id: 'otros',           label: 'Otros',            emoji: '📅',  color: '#94a3b8',  group: 'otros' },
]

export const CATEGORY_GROUPS = [
  { id: 'deportes',     label: 'Deportes' },
  { id: 'espectaculo',  label: 'Música y Espectáculo' },
  { id: 'cultura',      label: 'Cultura y Arte' },
  { id: 'geek',         label: 'Geek / Otaku / Cosplay' },
  { id: 'otros',        label: 'Otros' },
]

export const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

export const ACCESS_LABELS = {
  free:    '✅ Gratis',
  paid:    '🎟 Pago',
  unknown: '❔ A confirmar',
}

export const SCALE_LABELS = {
  small:   'Pequeño',
  medium:  'Mediano',
  large:   'Grande',
  massive: '🔥 Masivo',
}

export const SOURCE_LABELS = {
  passline:      'Passline',
  tickantel:     'Tickantel',
  redtickets:    'RedTickets',
  eventosanime:  'EventosAnime.uy',
  eventbrite:    'Eventbrite',
  meetup:        'Meetup',
  google:        'Google Events',
  imm_cultura:   'IMM Cultura',
  seed:          'Datos de ejemplo',
  manual:        'Manual',
}
