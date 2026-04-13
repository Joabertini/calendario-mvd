import styles from './StatusBar.module.css'

function formatRelative(isoStr) {
  if (!isoStr) return '—'
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'hace unos segundos'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.round(mins / 60)
  return `hace ${hrs}h`
}

function formatTime(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' })
}

export default function StatusBar({ meta, error, loading, lastPoll }) {
  if (!meta && !error) return null

  return (
    <div className={styles.bar}>
      {error && (
        <span className={styles.errorChip}>
          ⚠️ {error} — mostrando datos en caché
        </span>
      )}

      {meta && (
        <>
          <span className={styles.item}>
            <span className={styles.dot} data-ok={!meta.usingFallback} />
            {meta.usingFallback ? 'Datos de ejemplo' : 'Datos en vivo'}
          </span>

          <span className={styles.sep}>·</span>

          <span className={styles.item}>
            Scrapers actualizados: <strong>{formatRelative(meta.lastUpdated)}</strong>
          </span>

          {meta.sources?.length > 0 && (
            <>
              <span className={styles.sep}>·</span>
              <span className={styles.sources}>
                {meta.sources.map(s => (
                  <span
                    key={s.name}
                    className={styles.sourceChip}
                    data-ok={s.ok}
                    title={`${s.name}: ${s.count} eventos`}
                  >
                    {s.name} ({s.count})
                  </span>
                ))}
              </span>
            </>
          )}

          <span className={styles.sep}>·</span>
          <span className={styles.item}>
            Próx. actualización: <strong>{formatTime(meta.nextUpdate)}</strong>
          </span>
        </>
      )}

      {loading && (
        <span className={styles.refreshingChip}>
          <span className={styles.spinner} /> actualizando…
        </span>
      )}
    </div>
  )
}
