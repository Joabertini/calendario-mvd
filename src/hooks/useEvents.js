import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = import.meta.env.BASE_URL  // /calendario-mvd/ in prod, / in dev
const JSON_URL = `${BASE}events.json`
const POLL_MS  = 60_000  // poll every 60 seconds

export function useEvents() {
  const [data, setData]         = useState(null)   // { events, meta }
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [lastPoll, setLastPoll] = useState(null)
  const timerRef                = useRef(null)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // cache-bust so the browser always gets the freshest JSON
      const res = await fetch(`${JSON_URL}?t=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastPoll(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchData() }, [fetchData])

  // Polling
  useEffect(() => {
    timerRef.current = setInterval(() => fetchData(true), POLL_MS)
    return () => clearInterval(timerRef.current)
  }, [fetchData])

  return {
    events:    data?.events   ?? [],
    meta:      data?.meta     ?? null,
    loading,
    error,
    lastPoll,
    refresh:   () => fetchData(),
  }
}

// ── Filtering ─────────────────────────────────
export function applyFilters(events, filters) {
  return events.filter(ev => {
    if (filters.categories.length && !filters.categories.includes(ev.category)) return false
    if (filters.access !== 'all' && ev.access !== filters.access) return false
    if (filters.scale  !== 'all' && ev.scale  !== filters.scale)  return false
    if (filters.onlyMassive && !ev.isMassive) return false
    if (filters.dateFrom) {
      if (new Date(ev.date) < new Date(filters.dateFrom)) return false
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo); to.setHours(23,59,59)
      if (new Date(ev.date) > to) return false
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!`${ev.title} ${ev.venue}`.toLowerCase().includes(q)) return false
    }
    return true
  })
}

export const DEFAULT_FILTERS = {
  categories: [],
  access:     'all',
  scale:      'all',
  onlyMassive: false,
  dateFrom:   '',
  dateTo:     '',
  search:     '',
}
