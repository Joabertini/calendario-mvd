import { useState, useMemo, useEffect } from 'react'
import { useEvents, applyFilters, DEFAULT_FILTERS } from './hooks/useEvents'
import { supabase } from './lib/supabase'
import Header from './components/Header'
import Filters from './components/Filters'
import EventCard from './components/EventCard'
import StatusBar from './components/StatusBar'
import LoginModal from './components/LoginModal'
import styles from './App.module.css'

export default function App() {
  const { events, meta, loading, error, lastPoll, refresh } = useEvents()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Auth — escuchar cambios de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) setLoginOpen(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const filtered = useMemo(() => applyFilters(events, filters), [events, filters])

  const massiveCount = useMemo(() => events.filter(e => e.isMassive).length, [events])
  const todayCount   = useMemo(() => {
    const today = new Date().toDateString()
    return events.filter(e => new Date(e.date).toDateString() === today).length
  }, [events])

  return (
    <div className={styles.app}>
      <Header
        totalCount={events.length}
        filteredCount={filtered.length}
        massiveCount={massiveCount}
        todayCount={todayCount}
        loading={loading}
        lastPoll={lastPoll}
        onRefresh={refresh}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
        user={user}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />

      <div className={styles.layout}>
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
        )}

        <Filters
          filters={filters}
          onChange={setFilters}
          totalCount={events.length}
          filteredCount={filtered.length}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={styles.main}>
          <StatusBar
            meta={meta}
            error={error}
            loading={loading}
            lastPoll={lastPoll}
          />

          {loading && events.length === 0 ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : error && events.length === 0 ? (
            <div className={styles.errorState}>
              <span className={styles.errorIcon}>⚠️</span>
              <p>No se pudo cargar eventos</p>
              <p className={styles.errorDetail}>{error}</p>
              <button className={styles.retryBtn} onClick={refresh}>Reintentar</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <p>No hay eventos con esos filtros</p>
              <button
                className={styles.retryBtn}
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className={styles.resultsBar}>
                <span className={styles.resultsCount}>
                  <span className={styles.resultsNum}>{filtered.length}</span>
                  {filtered.length !== events.length && (
                    <span className={styles.resultsOf}> de {events.length}</span>
                  )}
                  <span className={styles.resultsLabel}> eventos</span>
                </span>
                {filtered.some(e => e.isMassive) && (
                  <span className={styles.massiveAlert}>
                    🔥 {filtered.filter(e => e.isMassive).length} masivos
                  </span>
                )}
              </div>

              <div className={styles.grid}>
                {filtered.map((ev, i) => (
                  <EventCard key={ev.id} event={ev} index={i} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
