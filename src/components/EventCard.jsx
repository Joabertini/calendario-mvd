import { CAT_MAP, ACCESS_LABELS, SCALE_LABELS, SOURCE_LABELS } from '../lib/constants'
import styles from './EventCard.module.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-UY', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

function formatTime(iso) {
  const d = new Date(iso)
  if (d.getHours() === 0 && d.getMinutes() === 0) return ''
  return d.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' })
}

function daysUntil(iso) {
  const today = new Date(); today.setHours(0,0,0,0)
  const ev    = new Date(iso); ev.setHours(0,0,0,0)
  return Math.round((ev - today) / 86_400_000)
}

function urgencyLabel(days) {
  if (days < 0)  return { text: 'PASADO',  type: 'past' }
  if (days === 0) return { text: '📍 HOY',   type: 'today' }
  if (days === 1) return { text: '⏰ MAÑANA', type: 'soon' }
  if (days <= 3)  return { text: `en ${days} días`, type: 'near' }
  return { text: `en ${days} días`, type: 'normal' }
}

export default function EventCard({ event, index = 0 }) {
  const cat   = CAT_MAP[event.category] ?? CAT_MAP.otros
  const days  = daysUntil(event.date)
  const urg   = urgencyLabel(days)
  const time  = formatTime(event.date)

  return (
    <article
      className={styles.card}
      style={{ '--cat': cat.color, '--delay': `${Math.min(index,12) * 45}ms` }}
      data-massive={event.isMassive}
      data-past={days < 0}
    >
      {/* Top accent bar */}
      <div className={styles.bar} />

      {/* Massive badge */}
      {event.isMassive && (
        <div className={styles.massiveBadge}>🔥 EVENTO MASIVO</div>
      )}

      {/* Header row */}
      <div className={styles.header}>
        <span className={styles.cat} style={{ color: cat.color }}>
          {cat.emoji} {cat.label.toUpperCase()}
        </span>
        <span className={styles.urgency} data-type={urg.type}>
          {urg.text}
        </span>
      </div>

      {/* Title */}
      <h2 className={styles.title}>{event.title}</h2>

      {/* Meta */}
      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaIcon}>📅</span>
          <span>
            {formatDate(event.date)}
            {time && <span className={styles.time}> · {time}</span>}
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaIcon}>📍</span>
          <span>{event.venue}</span>
        </div>
      </div>

      {/* Pills */}
      <div className={styles.pills}>
        <span className={styles.pill} data-access={event.access}>
          {ACCESS_LABELS[event.access] ?? event.access}
        </span>
        <span className={styles.pill} data-scale={event.scale}>
          {SCALE_LABELS[event.scale] ?? event.scale}
        </span>
        {event.price && (
          <span className={styles.pill} data-type="price">
            💲 {event.price}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.source}>
          {SOURCE_LABELS[event.source] ?? event.source}
        </span>
        <div className={styles.footerLinks}>
          {event.ticketUrl && event.access === 'paid' && (
            <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className={styles.ticketBtn}>
              Entradas →
            </a>
          )}
          {event.sourceUrl && (
            <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
              Ver →
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
