export const CATEGORIES = [
  { id: 'futbol',          label: 'Fútbol',          emoji: '⚽', color: '#2edf7a' },
  { id: 'basket',          label: 'Básquet',         emoji: '🏀', color: '#ff8940' },
  { id: 'rugby',           label: 'Rugby',           emoji: '🏉', color: '#a855f7' },
  { id: 'tenis',           label: 'Tenis',           emoji: '🎾', color: '#38b6ff' },
  { id: 'atletismo',       label: 'Atletismo',       emoji: '🏃', color: '#d4f53c' },
  { id: 'ciclismo',        label: 'Ciclismo',        emoji: '🚴', color: '#f43f8e' },
  { id: 'natacion',        label: 'Natación',        emoji: '🏊', color: '#22d3ee' },
  { id: 'artes_marciales', label: 'Artes Marciales', emoji: '🥊', color: '#ff4d4d' },
  { id: 'otros',           label: 'Otros',           emoji: '🏅', color: '#6868a0' },
]

export const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

export const ACCESS_LABELS = { free: '✅ GRATIS', paid: '🎟 PAGO', unknown: '❔ A CONFIRMAR' }
export const SCALE_LABELS  = { small: 'Pequeño', medium: 'Mediano', large: 'Grande', massive: '🔥 MASIVO' }
export const SOURCE_LABELS = {
  passline:    'Passline',
  tickantel:   'Tickantel',
  redtickets:  'RedTickets',
  google:      'Google Events',
  imm_cultura: 'IMM Cultura',
  seed:        'Datos de ejemplo',
  manual:      'Manual',
}
