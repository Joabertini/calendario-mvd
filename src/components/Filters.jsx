import { CATEGORIES } from '../lib/constants'
import styles from './Filters.module.css'

export default function Filters({ filters, onChange, totalCount, filteredCount, open, onClose }) {
  function toggleCat(id) {
    const has = filters.categories.includes(id)
    onChange({
      ...filters,
      categories: has ? filters.categories.filter(c => c !== id) : [...filters.categories, id]
    })
  }

  function reset() {
    onChange({ categories:[], access:'all', scale:'all', onlyMassive:false, dateFrom:'', dateTo:'', search:'' })
  }

  const hasFilters =
    filters.categories.length > 0 ||
    filters.access !== 'all' ||
    filters.scale  !== 'all' ||
    filters.onlyMassive ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search

  return (
    <aside className={styles.sidebar} data-open={open}>
      {/* Sidebar header */}
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>FILTROS</span>
        <div className={styles.headerActions}>
          {hasFilters && (
            <button className={styles.clearBtn} onClick={reset}>limpiar</button>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
      </div>

      {/* Counter */}
      <div className={styles.counter}>
        <span className={styles.counterNum}>{filteredCount}</span>
        <span className={styles.counterSep}>/</span>
        <span className={styles.counterTotal}>{totalCount}</span>
        <span className={styles.counterLabel}>eventos</span>
      </div>

      <div className={styles.scroll}>
        {/* Search */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>BUSCAR</label>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder="evento, lugar..."
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.target.value })}
              className={styles.searchInput}
            />
            {filters.search && (
              <button className={styles.clearInput} onClick={() => onChange({ ...filters, search: '' })}>✕</button>
            )}
          </div>
        </section>

        {/* Solo masivos toggle */}
        <section className={styles.section}>
          <button
            className={styles.massiveToggle}
            data-active={filters.onlyMassive}
            onClick={() => onChange({ ...filters, onlyMassive: !filters.onlyMassive })}
          >
            <span>🔥</span>
            <span>Solo eventos masivos</span>
            <span className={styles.toggle} data-on={filters.onlyMassive} />
          </button>
        </section>

        {/* Categories */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>CATEGORÍA</label>
          <div className={styles.catGrid}>
            {CATEGORIES.map(cat => {
              const active = filters.categories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  className={styles.catBtn}
                  data-active={active}
                  style={{ '--cat': cat.color }}
                  onClick={() => toggleCat(cat.id)}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Access */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>ACCESO</label>
          <div className={styles.chipGroup}>
            {[
              { v: 'all',  label: 'Todos' },
              { v: 'free', label: '✅ Gratis' },
              { v: 'paid', label: '🎟 Con entrada' },
            ].map(o => (
              <button
                key={o.v}
                className={styles.chip}
                data-active={filters.access === o.v}
                onClick={() => onChange({ ...filters, access: o.v })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Scale */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>ESCALA</label>
          <div className={styles.chipGroup}>
            {[
              { v: 'all',     label: 'Todos' },
              { v: 'massive', label: '🔥 Masivo' },
              { v: 'large',   label: 'Grande' },
              { v: 'medium',  label: 'Mediano' },
              { v: 'small',   label: 'Pequeño' },
            ].map(o => (
              <button
                key={o.v}
                className={styles.chip}
                data-active={filters.scale === o.v}
                onClick={() => onChange({ ...filters, scale: o.v })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Date range */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>FECHAS</label>
          <div className={styles.dateGroup}>
            <div className={styles.dateField}>
              <label className={styles.dateLabel}>Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.dateField}>
              <label className={styles.dateLabel}>Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                className={styles.dateInput}
              />
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
