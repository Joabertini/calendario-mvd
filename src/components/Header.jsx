import styles from './Header.module.css'

export default function Header({
  totalCount, filteredCount, massiveCount, todayCount,
  loading, lastPoll, onRefresh, onToggleSidebar, sidebarOpen,
  user, onLoginClick, onLogout
}) {
  function formatLastPoll(date) {
    if (!date) return '—'
    return date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const displayEmail = user?.email
    ? user.email.length > 20 ? user.email.slice(0, 18) + '…' : user.email
    : null

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onToggleSidebar}
          aria-label="Abrir filtros"
          data-open={sidebarOpen}
        >
          <span /><span /><span />
        </button>

        <div className={styles.brand}>
          <span className={styles.brandKanji}>公園</span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>Kōen</span>
            <span className={styles.brandSub}>Uruguay · Todos los eventos</span>
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

      {/* Right: live + auth */}
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

        {user ? (
          <div className={styles.authUser}>
            <span className={styles.authEmail}>{displayEmail}</span>
            <button className={styles.authBtn} onClick={onLogout}>Salir</button>
          </div>
        ) : (
          <button className={styles.authBtn} data-login onClick={onLoginClick}>
            Ingresar
          </button>
        )}
      </div>
    </header>
  )
}
