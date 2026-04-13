import styles from './Header.module.css'

export default function Header({
  totalCount, filteredCount, massiveCount, todayCount,
  loading, lastPoll, onRefresh, onToggleSidebar, sidebarOpen
}) {
  function formatLastPoll(date) {
    if (!date) return '—'
    return date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Hamburger */}
        <button
          className={styles.menuBtn}
          onClick={onToggleSidebar}
          aria-label="Abrir filtros"
          data-open={sidebarOpen}
        >
          <span /><span /><span />
        </button>

        <div className={styles.brand}>
          <span className={styles.brandIcon}>📡</span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>EventScout</span>
            <span className={styles.brandSub}>Montevideo · Deportes</span>
          </div>
        </div>
      </div>

      {/* Stats pills */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{totalCount}</span>
          <span className={styles.statLabel}>eventos</span>
        </div>
        {massiveCount > 0 && (
          <div className={styles.stat} data-type="massive">
            <span className={styles.statNum}>{massiveCount}</span>
            <span className={styles.statLabel}>masivos</span>
          </div>
        )}
        {todayCount > 0 && (
          <div className={styles.stat} data-type="today">
            <span className={styles.statNum}>{todayCount}</span>
            <span className={styles.statLabel}>hoy</span>
          </div>
        )}
      </div>

      {/* Live indicator + refresh */}
      <div className={styles.right}>
        <div className={styles.live}>
          <span className={styles.liveDot} data-loading={loading} />
          <span className={styles.liveText}>
            {loading ? 'ACTUALIZANDO' : `LIVE · ${formatLastPoll(lastPoll)}`}
          </span>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={loading}
          aria-label="Actualizar ahora"
        >
          <span className={styles.refreshIcon} data-spinning={loading}>↻</span>
        </button>
      </div>
    </header>
  )
}
