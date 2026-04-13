/**
 * EventScout MVD — Scraper
 * Runs in GitHub Actions every hour.
 * Outputs: ../public/events.json
 */

import { load } from 'cheerio'
import { createHash } from 'crypto'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const OUTPUT = join(__dir, '..', 'public', 'events.json')

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const TIMEOUT_MS = 12_000
const UA = 'Mozilla/5.0 (compatible; EventScoutBot/2.0; +https://github.com/Joabertini/calendario-mvd)'

// ─────────────────────────────────────────────
// Category / scale detection
// ─────────────────────────────────────────────
const CAT_KEYWORDS = {
  futbol:          ['fútbol','futbol','football','soccer','peñarol','nacional','defensor','danubio','racing','river plate','rampla','torque','fénix','fenix','rentistas','progreso','liverpool','wanderers'],
  basket:          ['básquet','basquet','basket','baloncesto','nba','ucb','goes','biguá','bigua','aguada','trouville','olimpia'],
  rugby:           ['rugby','urr','unión de rugby'],
  tenis:           ['tenis','tennis','padel','pádel','atp','wta','itf'],
  atletismo:       ['atletismo','maratón','maraton','media maratón','10k','5k','running','carrera','cross','triatlón','triatlon','duatlón'],
  ciclismo:        ['ciclismo','bicicleta','vuelta ciclista','criterium','bmx'],
  natacion:        ['natación','natacion','swimming','acuático','acuatico'],
  artes_marciales: ['boxeo','mma','ufc','judo','karate','taekwondo','wrestling','lucha','muay thai','kickboxing','bjj','grappling'],
  otros:           [],
}

const MASSIVE_VENUES = [
  'estadio centenario','gran parque central','campeón del siglo','palacio peñarol',
  'antel arena','velódromo','estadio charrúa','franzini','obdulio varela',
  'parque viera','parque capurro','parque palermo',
]

function detectCategory(text) {
  const t = text.toLowerCase()
  for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
    if (cat === 'otros') continue
    if (kws.some(k => t.includes(k))) return cat
  }
  return 'otros'
}

function detectScale(title, venue, desc) {
  const t = `${title} ${venue} ${desc}`.toLowerCase()
  if (MASSIVE_VENUES.some(v => t.includes(v))) return 'massive'
  if (/torneo|campeonato|copa|nacional|internacional/i.test(t)) return 'large'
  if (/partido|match|clásico|clasico|final|semifinal/i.test(t)) return 'medium'
  return 'small'
}

function isMassive(scale, venue) {
  return scale === 'massive' || MASSIVE_VENUES.some(v => venue.toLowerCase().includes(v))
}

function makeId(title, date) {
  return createHash('md5').update(`${title}${date}`).digest('hex').slice(0, 12)
}

// ─────────────────────────────────────────────
// Fetch helper
// ─────────────────────────────────────────────
async function fetchHtml(url) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept-Language': 'es-UY,es;q=0.9' },
    })
    clearTimeout(t)
    if (!res.ok) { console.warn(`[SKIP] ${url} → HTTP ${res.status}`); return null }
    return res.text()
  } catch (e) {
    console.warn(`[SKIP] ${url} → ${e.message}`)
    return null
  }
}

// ─────────────────────────────────────────────
// Date parser (Spanish flexible)
// ─────────────────────────────────────────────
const MONTHS = { enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,octubre:10,noviembre:11,diciembre:12,ene:1,feb:2,mar:3,abr:4,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12 }

function parseDate(raw) {
  if (!raw) return null
  const s = raw.trim().toLowerCase()
  // dd/mm/yyyy or dd-mm-yyyy
  let m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T00:00:00.000Z`
  // "15 de julio de 2025" / "15 julio 2025"
  m = s.match(/(\d{1,2})\s+(?:de\s+)?(\w+)(?:\s+de\s+|\s+)(\d{4})/)
  if (m && MONTHS[m[2]]) return `${m[3]}-${String(MONTHS[m[2]]).padStart(2,'0')}-${m[1].padStart(2,'0')}T00:00:00.000Z`
  // ISO passthrough
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s).toISOString()
  return null
}

// ─────────────────────────────────────────────
// SCRAPER: Passline
// ─────────────────────────────────────────────
async function scrapePassline() {
  const events = []
  const urls = [
    'https://www.passline.com/eventos?categoria=deporte',
    'https://www.passline.com/eventos?categoria=deportes',
  ]
  for (const url of urls) {
    const html = await fetchHtml(url)
    if (!html) continue
    const $ = load(html)
    $('[class*="event"], [class*="card"], article, li[class*="item"]').each((_, el) => {
      try {
        const $el  = $(el)
        const title = $el.find('h1,h2,h3,[class*="title"],[class*="name"]').first().text().trim()
        if (!title || title.length < 4) return
        const dateRaw = $el.find('time,[class*="date"],[class*="fecha"]').first().text().trim()
        const venue   = $el.find('[class*="venue"],[class*="lugar"],[class*="location"]').first().text().trim()
        const price   = $el.find('[class*="price"],[class*="precio"],[class*="valor"]').first().text().trim()
        const href    = $el.find('a').first().attr('href') || ''
        const img     = $el.find('img').first().attr('src') || ''
        const sourceUrl = href.startsWith('http') ? href : `https://www.passline.com${href}`
        const date    = parseDate(dateRaw) || new Date().toISOString()
        const cat     = detectCategory(title)
        const scale   = detectScale(title, venue, '')
        events.push({ id: makeId(title,date), title, date, venue: venue||'Montevideo', address:'Montevideo, Uruguay', category: cat, access: price&&!/gratis/i.test(price)?'paid':'free', scale, isMassive: isMassive(scale,venue), price, ticketUrl: sourceUrl, imageUrl: img, sourceUrl, source:'passline', scrapedAt: new Date().toISOString() })
      } catch {}
    })
  }
  console.log(`[Passline] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: Tickantel
// ─────────────────────────────────────────────
async function scrapeTickantel() {
  const events = []
  const html = await fetchHtml('https://www.tickantel.com.uy/espectaculos/categorias/deportes')
  if (!html) return events
  const $ = load(html)
  $('[class*="show"],[class*="event"],[class*="card"],article,.item').each((_, el) => {
    try {
      const $el = $(el)
      const title = $el.find('h2,h3,[class*="title"],[class*="name"]').first().text().trim()
      if (!title || title.length < 4) return
      const dateRaw = $el.find('time,[class*="date"],[class*="fecha"]').first().text().trim()
      const venue   = $el.find('[class*="place"],[class*="venue"],[class*="sala"]').first().text().trim()
      const price   = $el.find('[class*="price"],[class*="precio"]').first().text().trim()
      const href    = $el.find('a').first().attr('href') || ''
      const img     = $el.find('img').first().attr('src') || ''
      const sourceUrl = href.startsWith('http') ? href : `https://www.tickantel.com.uy${href}`
      const date    = parseDate(dateRaw) || new Date().toISOString()
      const cat     = detectCategory(title)
      const scale   = detectScale(title, venue, '')
      events.push({ id: makeId(title,date), title, date, venue: venue||'Montevideo', address:'Montevideo, Uruguay', category: cat, access: price?'paid':'unknown', scale, isMassive: isMassive(scale,venue), price, ticketUrl: sourceUrl, imageUrl: img, sourceUrl, source:'tickantel', scrapedAt: new Date().toISOString() })
    } catch {}
  })
  console.log(`[Tickantel] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: RedTickets
// ─────────────────────────────────────────────
async function scrapeRedTickets() {
  const events = []
  const html = await fetchHtml('https://www.redtickets.uy/eventos/deportes')
  if (!html) return events
  const $ = load(html)
  $('[class*="event"],[class*="card"],article').each((_, el) => {
    try {
      const $el = $(el)
      const title = $el.find('h2,h3,[class*="title"]').first().text().trim()
      if (!title || title.length < 4) return
      const dateRaw = $el.find('time,[class*="date"]').first().text().trim()
      const venue   = $el.find('[class*="venue"],[class*="location"],[class*="lugar"]').first().text().trim()
      const price   = $el.find('[class*="price"],[class*="precio"]').first().text().trim()
      const href    = $el.find('a').first().attr('href') || ''
      const sourceUrl = href.startsWith('http') ? href : `https://www.redtickets.uy${href}`
      const date    = parseDate(dateRaw) || new Date().toISOString()
      const cat     = detectCategory(title)
      const scale   = detectScale(title, venue, '')
      events.push({ id: makeId(title,date), title, date, venue: venue||'Montevideo', address:'Montevideo, Uruguay', category: cat, access: price?'paid':'unknown', scale, isMassive: isMassive(scale,venue), price, ticketUrl: sourceUrl, sourceUrl, source:'redtickets', scrapedAt: new Date().toISOString() })
    } catch {}
  })
  console.log(`[RedTickets] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: IMM Cultura (eventos gratuitos)
// ─────────────────────────────────────────────
async function scrapeIMMCultura() {
  const events = []
  const html = await fetchHtml('https://cultura.montevideo.gub.uy/agenda?field_tipo_evento=deporte')
  if (!html) return events
  const $ = load(html)
  $('article,.views-row,[class*="event"]').each((_, el) => {
    try {
      const $el = $(el)
      const title = $el.find('h2,h3,.views-field-title').first().text().trim()
      if (!title || title.length < 4) return
      const dateRaw = $el.find('.date-display-single,time,.views-field-field-fecha').first().text().trim()
      const venue   = $el.find('.views-field-field-lugar,[class*="lugar"]').first().text().trim()
      const href    = $el.find('a').first().attr('href') || ''
      const sourceUrl = href.startsWith('http') ? href : `https://cultura.montevideo.gub.uy${href}`
      const date    = parseDate(dateRaw) || new Date().toISOString()
      const cat     = detectCategory(title)
      const scale   = detectScale(title, venue, '')
      events.push({ id: makeId(title,date), title, date, venue: venue||'Montevideo', address:'Montevideo, Uruguay', category: cat, access:'free', scale, isMassive: isMassive(scale,venue), sourceUrl, source:'imm_cultura', scrapedAt: new Date().toISOString() })
    } catch {}
  })
  console.log(`[IMM Cultura] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: SerpAPI Google Events (optional — needs key)
// ─────────────────────────────────────────────
async function scrapeGoogleEvents() {
  const key = process.env.SERPAPI_KEY
  if (!key) { console.log('[Google Events] Skipped — no SERPAPI_KEY'); return [] }
  const events = []
  const queries = ['eventos deportivos Montevideo','partidos futbol Montevideo Uruguay']
  for (const q of queries) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(q)}&location=Montevideo%2C+Uruguay&hl=es&gl=uy&api_key=${key}`
      const res  = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) continue
      const data = await res.json()
      for (const ev of (data.events_results || [])) {
        const title = ev.title || ''
        const venue = ev.venue?.name || ev.address?.[0] || 'Montevideo'
        const dateRaw = ev.date?.start_date || ev.date?.when || ''
        const date  = parseDate(dateRaw) || new Date().toISOString()
        const cat   = detectCategory(title)
        const scale = detectScale(title, venue, ev.description||'')
        events.push({ id: makeId(title,date), title, date, venue, address: (ev.address||[]).join(', ')||'Montevideo', category: cat, access: ev.ticket_info?.[0]?.link ? 'paid' : 'unknown', scale, isMassive: isMassive(scale,venue), ticketUrl: ev.ticket_info?.[0]?.link, imageUrl: ev.thumbnail, sourceUrl: ev.link||'', source:'google', scrapedAt: new Date().toISOString() })
      }
    } catch (e) { console.warn('[Google Events]', e.message) }
  }
  console.log(`[Google Events] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// Dedup & sort
// ─────────────────────────────────────────────
function dedup(events) {
  const seen = new Map()
  for (const ev of events) {
    const key = `${ev.title.toLowerCase().slice(0,40)}_${ev.date.slice(0,10)}`
    if (!seen.has(key)) seen.set(key, ev)
  }
  return [...seen.values()].sort((a,b) => new Date(a.date) - new Date(b.date))
}

// ─────────────────────────────────────────────
// Seed / fallback data
// ─────────────────────────────────────────────
function seedEvents() {
  const now = Date.now()
  const day = 86_400_000
  return [
    { id:'seed-001', title:'Nacional vs Peñarol — Clásico', date:new Date(now+3*day).toISOString(), venue:'Estadio Centenario', address:'Av. Ricaldoni s/n, Mvd', category:'futbol', access:'paid', scale:'massive', isMassive:true, price:'Desde $500', ticketUrl:'https://www.passline.com', sourceUrl:'https://www.passline.com', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-002', title:'Maratón de Montevideo 2025', date:new Date(now+10*day).toISOString(), venue:'Rambla Sur', address:'Rambla República de Chile, Mvd', category:'atletismo', access:'paid', scale:'massive', isMassive:true, price:'Desde $800', ticketUrl:'https://www.passline.com', sourceUrl:'https://www.passline.com', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-003', title:'Básquet — Hebraica vs Goes', date:new Date(now+2*day).toISOString(), venue:'Antel Arena', address:'Dr. Américo Ricaldoni 2468, Mvd', category:'basket', access:'paid', scale:'large', isMassive:false, price:'$400', ticketUrl:'https://www.tickantel.com.uy', sourceUrl:'https://www.tickantel.com.uy', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-004', title:'Torneo de Rugby — Final Copa Uruguay', date:new Date(now+7*day).toISOString(), venue:'Estadio Charrúa', address:'Av. Batlle y Ordóñez 3745, Mvd', category:'rugby', access:'paid', scale:'large', isMassive:false, price:'$300', sourceUrl:'https://www.uru.com.uy', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-005', title:'Festival de Tenis Libre — Parque Rodó', date:new Date(now+1*day).toISOString(), venue:'Parque Rodó', address:'Parque Rodó, Mvd', category:'tenis', access:'free', scale:'small', isMassive:false, sourceUrl:'https://cultura.montevideo.gub.uy', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-006', title:'Gala de Boxeo Internacional', date:new Date(now+14*day).toISOString(), venue:'Palacio Peñarol', address:'Av. Ricaldoni, Mvd', category:'artes_marciales', access:'paid', scale:'massive', isMassive:true, price:'Desde $600', ticketUrl:'https://www.passline.com', sourceUrl:'https://www.passline.com', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-007', title:'Vuelta Ciclista — Etapa Montevideo', date:new Date(now+20*day).toISOString(), venue:'Rambla Sur — Circuito Urbano', address:'Rambla Sur, Mvd', category:'ciclismo', access:'free', scale:'large', isMassive:false, sourceUrl:'https://cultura.montevideo.gub.uy', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-008', title:'Defensor Sporting vs Danubio — Apertura', date:new Date(now+5*day).toISOString(), venue:'Estadio Luis Franzini', address:'Rambla Wilson s/n, Mvd', category:'futbol', access:'paid', scale:'medium', isMassive:false, price:'$350', ticketUrl:'https://www.tickantel.com.uy', sourceUrl:'https://www.tickantel.com.uy', source:'seed', scrapedAt:new Date().toISOString() },
  ]
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  console.log('🔍 EventScout MVD — scraper iniciado:', new Date().toISOString())

  const results = await Promise.allSettled([
    scrapePassline(),
    scrapeTickantel(),
    scrapeRedTickets(),
    scrapeIMMCultura(),
    scrapeGoogleEvents(),
  ])

  const scraped = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  const deduped = dedup(scraped)
  const events  = deduped.length >= 3 ? deduped : seedEvents()

  const output = {
    events,
    meta: {
      lastUpdated: new Date().toISOString(),
      nextUpdate:  new Date(Date.now() + 60*60*1000).toISOString(),
      totalCount:  events.length,
      sources: results.map((r,i) => ({
        name: ['passline','tickantel','redtickets','imm_cultura','google'][i],
        count: r.status === 'fulfilled' ? r.value.length : 0,
        ok: r.status === 'fulfilled',
      })),
      usingFallback: deduped.length < 3,
    }
  }

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8')
  console.log(`✅ Guardados ${events.length} eventos → public/events.json`)
  console.log('   Fuentes:', output.meta.sources.map(s=>`${s.name}(${s.count})`).join(' '))
}

main().catch(e => { console.error('❌ Scraper error:', e); process.exit(1) })
