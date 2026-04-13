/**
 * Kōen — Scraper Universal
 * Agrega TODOS los eventos de Uruguay (deportes, música, teatro, geek, cultura, etc.)
 * Runs in GitHub Actions every hour.
 * Outputs: ../public/events.json
 */

import { load } from 'cheerio'
import { createHash } from 'crypto'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const OUTPUT = join(__dir, '..', 'public', 'events.json')

const TIMEOUT_MS = 12_000
const UA = 'Mozilla/5.0 (compatible; KoenBot/1.0; +https://github.com/Joabertini/calendario-mvd)'

// ─────────────────────────────────────────────
// Category detection — UNIVERSAL
// ─────────────────────────────────────────────
const CAT_KEYWORDS = {
  // Deportes
  futbol:          ['fútbol','futbol','football','soccer','peñarol','nacional','defensor','danubio','racing','river plate','rampla','torque','fénix','fenix','rentistas','progreso','liverpool','wanderers','cerro largo','sud america','boston river'],
  basket:          ['básquet','basquet','basket','baloncesto','nba','ucb','goes','biguá','bigua','aguada','trouville','olimpia','hebraica'],
  rugby:           ['rugby','urr','unión de rugby'],
  tenis:           ['tenis','tennis','padel','pádel','atp','wta','itf'],
  atletismo:       ['atletismo','maratón','maraton','media maratón','10k','5k','running','carrera','cross','triatlón','triatlon','duatlón','trail'],
  ciclismo:        ['ciclismo','bicicleta','vuelta ciclista','criterium','bmx'],
  natacion:        ['natación','natacion','swimming','acuático','acuatico'],
  artes_marciales: ['boxeo','mma','ufc','judo','karate','taekwondo','wrestling','lucha','muay thai','kickboxing','bjj','grappling'],

  // Música y Espectáculo
  musica:     ['concierto','recital','festival de música','show musical','banda','orquesta','jazz','rock','cumbia','reggaeton','tango','candombe','folklore','hip hop','electronic','dj','live music','música en vivo','sinfonía','filarmónica'],
  teatro:     ['teatro','obra de teatro','espectáculo teatral','dramaturgia','monólogo','tragicomedia','comedia musical','ópera','zarzuela'],
  danza:      ['danza','ballet','folclore','flamenco','tango show','milonga','contemporánea','coreografía'],
  humor:      ['stand-up','stand up','comedia','humor','monólogo','improvisación','improv','sketch'],
  cine:       ['cine','película','estreno','proyección','film','cinema','cinéfilo','audiovisual','corto','documental'],
  circo:      ['circo','magia','mago','acrobacia','malabares','ilusionismo'],

  // Cultura y Arte
  arte:        ['exposición','expo','galería','inauguración','muestra','arte','pintura','escultura','fotografía','bienal','museo'],
  feria:       ['feria','mercado','bazar','expo venta','artesanías','feria del libro','emprendedores','feria gastronómica'],
  gastronomia: ['gastronómico','gastronomía','festival de comida','food','cerveza artesanal','vino','maridaje','cocina','chef','foodtruck'],
  educacion:   ['charla','conferencia','taller','workshop','capacitación','seminario','webinar','congreso','hackathon','meetup tecnológico'],
  carnaval:    ['carnaval','murga','candombe','tablado','comparsa','desfile','llamadas'],

  // Geek / Otaku / Cosplay
  anime:   ['anime','otaku','manga','japón','japonés','dragon ball','naruto','one piece','sailor moon','cosplay anime','cultura japonesa','j-pop','j-rock','kawaii'],
  cosplay: ['cosplay','costume','disfraz','mascarada','cosplayer'],
  gaming:  ['gaming','esports','videojuegos','gamer','torneo de videojuegos','league of legends','valorant','minecraft','fortnite','counter strike','lan party','streamer','twitch'],
  rol:     ['rol','rpg','dungeons','d&d','dnd','roleplay','juego de rol','partida','campaña','mazmorra','warhammer','pathfinder'],
  magic:   ['magic the gathering','magic: the gathering','mtg','yugioh','yu-gi-oh','pokemon tcg','torneo de cartas','tcg','trading card'],
  comics:  ['cómic','comic','manga','historieta','superhéroe','superhero','marvel','dc comics','image comics'],
  geek:    ['geek','nerd','cultura pop','convención','convention','con','fandom','merchandise','friki'],

  // Familia
  familia: ['niños','infantil','familia','kids','jardín','cuentos','circo infantil','títeres','teatro infantil','actividades para niños'],

  // catch-all
  otros:   [],
}

const MASSIVE_VENUES = [
  'estadio centenario','gran parque central','campeón del siglo','palacio peñarol',
  'antel arena','velódromo','estadio charrúa','franzini','obdulio varela',
  'parque viera','parque capurro','parque palermo','estadio olímpico',
  'teatro solís','teatro circular','teatro el galpón','teatro astral',
  'auditorio del sodre','sala zitarrosa','club de golf del uruguay',
  'complejo world trade center','complejo wtc','expo prado',
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
  if (/festival|torneo|campeonato|copa|nacional|internacional|maratón|maraton/i.test(t)) return 'large'
  if (/partido|match|clásico|clasico|final|semifinal|concierto|recital|show/i.test(t)) return 'medium'
  return 'small'
}

function isMassive(scale, venue) {
  return scale === 'massive' || MASSIVE_VENUES.some(v => (venue||'').toLowerCase().includes(v))
}

function makeId(title, date) {
  return createHash('md5').update(`${title}${date}`).digest('hex').slice(0, 12)
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────
function validateTitle(t) {
  if (!t || t.length < 5 || t.length > 200) return false
  if ((t.match(/[a-záéíóúñüA-Z]/g) || []).length < 3) return false
  const uiNoise = ['ver más','leer más','comprar','click','aquí','inicio','menú','carrito','login','registro','home']
  if (uiNoise.some(n => t.toLowerCase().trim() === n)) return false
  return true
}

function validateUrl(url) {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.pathname.length > 1 && u.pathname !== '/' && !u.pathname.endsWith('/categorias') && !u.pathname.endsWith('/eventos')
  } catch { return false }
}

// ─────────────────────────────────────────────
// Fetch helpers
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

async function fetchJson(url) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    })
    clearTimeout(t)
    if (!res.ok) { console.warn(`[SKIP JSON] ${url} → HTTP ${res.status}`); return null }
    return res.json()
  } catch (e) {
    console.warn(`[SKIP JSON] ${url} → ${e.message}`)
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
  let m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T00:00:00.000Z`
  m = s.match(/(\d{1,2})\s+(?:de\s+)?(\w+)(?:\s+de\s+|\s+)(\d{4})/)
  if (m && MONTHS[m[2]]) return `${m[3]}-${String(MONTHS[m[2]]).padStart(2,'0')}-${m[1].padStart(2,'0')}T00:00:00.000Z`
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s).toISOString()
  return null
}

function isFutureDate(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const yesterday = new Date(Date.now() - 86_400_000)
  const twoYearsOut = new Date(Date.now() + 2 * 365 * 86_400_000)
  return d > yesterday && d < twoYearsOut
}

// ─────────────────────────────────────────────
// SCRAPER: Passline — TODOS los eventos
// ─────────────────────────────────────────────
async function scrapePassline() {
  const events = []
  const urls = [
    'https://www.passline.com/eventos',
    'https://www.passline.com/eventos?categoria=deporte',
    'https://www.passline.com/eventos?categoria=musica',
    'https://www.passline.com/eventos?categoria=teatro',
    'https://www.passline.com/eventos?categoria=arte-cultura',
  ]
  for (const url of urls) {
    const html = await fetchHtml(url)
    if (!html) continue
    const $ = load(html)
    $('[class*="event"], [class*="card"], article, li[class*="item"]').each((_, el) => {
      try {
        const $el     = $(el)
        const title   = $el.find('h1,h2,h3,[class*="title"],[class*="name"]').first().text().trim()
        if (!validateTitle(title)) return
        const dateRaw = $el.find('time,[class*="date"],[class*="fecha"]').first().text().trim()
        const date    = parseDate(dateRaw)
        if (!isFutureDate(date)) return
        const venue     = $el.find('[class*="venue"],[class*="lugar"],[class*="location"]').first().text().trim()
        const price     = $el.find('[class*="price"],[class*="precio"],[class*="valor"]').first().text().trim()
        const href      = $el.find('a').first().attr('href') || ''
        const img       = $el.find('img').first().attr('src') || ''
        const sourceUrl = href.startsWith('http') ? href : `https://www.passline.com${href}`
        if (!validateUrl(sourceUrl)) return
        const cat   = detectCategory(title)
        const scale = detectScale(title, venue, '')
        events.push({ id:makeId(title,date), title, date, venue:venue||'Montevideo', address:'Montevideo, Uruguay', category:cat, access:price&&!/gratis/i.test(price)?'paid':'free', scale, isMassive:isMassive(scale,venue), price, ticketUrl:sourceUrl, imageUrl:img, sourceUrl, source:'passline', scrapedAt:new Date().toISOString() })
      } catch {}
    })
  }
  console.log(`[Passline] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: Tickantel — todos los espectáculos
// ─────────────────────────────────────────────
async function scrapeTickantel() {
  const events = []
  const urls = [
    'https://www.tickantel.com.uy/espectaculos',
    'https://www.tickantel.com.uy/espectaculos/categorias/deportes',
    'https://www.tickantel.com.uy/espectaculos/categorias/musica',
    'https://www.tickantel.com.uy/espectaculos/categorias/teatro',
  ]
  for (const url of urls) {
    const html = await fetchHtml(url)
    if (!html) continue
    const $ = load(html)
    $('[class*="show"],[class*="event"],[class*="card"],article,.item').each((_, el) => {
      try {
        const $el   = $(el)
        const title = $el.find('h2,h3,[class*="title"],[class*="name"]').first().text().trim()
        if (!validateTitle(title)) return
        const dateRaw   = $el.find('time,[class*="date"],[class*="fecha"]').first().text().trim()
        const date      = parseDate(dateRaw)
        if (!isFutureDate(date)) return
        const venue     = $el.find('[class*="place"],[class*="venue"],[class*="sala"]').first().text().trim()
        const price     = $el.find('[class*="price"],[class*="precio"]').first().text().trim()
        const href      = $el.find('a').first().attr('href') || ''
        const img       = $el.find('img').first().attr('src') || ''
        const sourceUrl = href.startsWith('http') ? href : `https://www.tickantel.com.uy${href}`
        if (!validateUrl(sourceUrl)) return
        const cat   = detectCategory(title)
        const scale = detectScale(title, venue, '')
        events.push({ id:makeId(title,date), title, date, venue:venue||'Montevideo', address:'Montevideo, Uruguay', category:cat, access:price?'paid':'unknown', scale, isMassive:isMassive(scale,venue), price, ticketUrl:sourceUrl, imageUrl:img, sourceUrl, source:'tickantel', scrapedAt:new Date().toISOString() })
      } catch {}
    })
  }
  console.log(`[Tickantel] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: RedTickets
// ─────────────────────────────────────────────
async function scrapeRedTickets() {
  const events = []
  const urls = [
    'https://www.redtickets.uy/eventos',
    'https://www.redtickets.uy/eventos/deportes',
    'https://www.redtickets.uy/eventos/musica',
  ]
  for (const url of urls) {
    const html = await fetchHtml(url)
    if (!html) continue
    const $ = load(html)
    $('[class*="event"],[class*="card"],article').each((_, el) => {
      try {
        const $el   = $(el)
        const title = $el.find('h2,h3,[class*="title"]').first().text().trim()
        if (!validateTitle(title)) return
        const dateRaw   = $el.find('time,[class*="date"]').first().text().trim()
        const date      = parseDate(dateRaw)
        if (!isFutureDate(date)) return
        const venue     = $el.find('[class*="venue"],[class*="location"],[class*="lugar"]').first().text().trim()
        const price     = $el.find('[class*="price"],[class*="precio"]').first().text().trim()
        const href      = $el.find('a').first().attr('href') || ''
        const sourceUrl = href.startsWith('http') ? href : `https://www.redtickets.uy${href}`
        if (!validateUrl(sourceUrl)) return
        const cat   = detectCategory(title)
        const scale = detectScale(title, venue, '')
        events.push({ id:makeId(title,date), title, date, venue:venue||'Montevideo', address:'Montevideo, Uruguay', category:cat, access:price?'paid':'unknown', scale, isMassive:isMassive(scale,venue), price, ticketUrl:sourceUrl, sourceUrl, source:'redtickets', scrapedAt:new Date().toISOString() })
      } catch {}
    })
  }
  console.log(`[RedTickets] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: EventosAnime.uy (API JSON — geek/otaku)
// ─────────────────────────────────────────────
async function scrapeEventosAnime() {
  const data = await fetchJson('https://eventosanime.uy/api/events')
  if (!data) return []
  const events = []
  const list = Array.isArray(data) ? data : (data.events || data.data || [])
  for (const ev of list) {
    try {
      const title = (ev.title || ev.nombre || ev.name || '').trim()
      if (!validateTitle(title)) continue
      const dateRaw = ev.date || ev.fecha || ev.start_date || ev.start || ''
      const date    = parseDate(dateRaw) || (dateRaw ? new Date(dateRaw).toISOString() : null)
      if (!isFutureDate(date)) continue
      const venue   = ev.venue || ev.lugar || ev.location || 'Montevideo'
      const sourceUrl = ev.url || ev.link || ev.source_url || 'https://eventosanime.uy'
      const cat     = detectCategory(title + ' ' + (ev.description || ev.descripcion || ''))
      const scale   = detectScale(title, venue, ev.description || '')
      events.push({ id:makeId(title,date), title, date, venue, address:ev.address||'Montevideo, Uruguay', category:cat==='otros'?'anime':cat, access:ev.price?'paid':'free', scale, isMassive:isMassive(scale,venue), price:ev.price||'', imageUrl:ev.image||ev.imagen||'', sourceUrl, source:'eventosanime', scrapedAt:new Date().toISOString() })
    } catch {}
  }
  console.log(`[EventosAnime] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: IMM Cultura — agenda gratuita Montevideo
// ─────────────────────────────────────────────
async function scrapeIMMCultura() {
  const events = []
  const html = await fetchHtml('https://cultura.montevideo.gub.uy/agenda')
  if (!html) return events
  const $ = load(html)
  $('article,.views-row,[class*="event"]').each((_, el) => {
    try {
      const $el   = $(el)
      const title = $el.find('h2,h3,.views-field-title').first().text().trim()
      if (!validateTitle(title)) return
      const dateRaw   = $el.find('.date-display-single,time,.views-field-field-fecha').first().text().trim()
      const date      = parseDate(dateRaw)
      if (!isFutureDate(date)) return
      const venue     = $el.find('.views-field-field-lugar,[class*="lugar"]').first().text().trim()
      const href      = $el.find('a').first().attr('href') || ''
      const sourceUrl = href.startsWith('http') ? href : `https://cultura.montevideo.gub.uy${href}`
      const cat       = detectCategory(title)
      const scale     = detectScale(title, venue, '')
      events.push({ id:makeId(title,date), title, date, venue:venue||'Montevideo', address:'Montevideo, Uruguay', category:cat, access:'free', scale, isMassive:isMassive(scale,venue), sourceUrl, source:'imm_cultura', scrapedAt:new Date().toISOString() })
    } catch {}
  })
  console.log(`[IMM Cultura] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: Eventbrite Uruguay
// ─────────────────────────────────────────────
async function scrapeEventbrite() {
  const events = []
  const urls = [
    'https://www.eventbrite.com.uy/d/uruguay--montevideo/events/',
    'https://www.eventbrite.com/d/uruguay--montevideo/events/',
  ]
  for (const url of urls) {
    const html = await fetchHtml(url)
    if (!html) continue
    const $ = load(html)
    // Eventbrite puede tener JSON embebido
    let parsed = false
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html()
        const json = JSON.parse(raw)
        const items = Array.isArray(json) ? json : [json]
        for (const item of items) {
          if (item['@type'] !== 'Event') continue
          const title = item.name || ''
          if (!validateTitle(title)) continue
          const dateRaw = item.startDate || ''
          const date    = dateRaw ? new Date(dateRaw).toISOString() : null
          if (!isFutureDate(date)) continue
          const venue     = item.location?.name || 'Montevideo'
          const sourceUrl = item.url || ''
          if (!validateUrl(sourceUrl)) continue
          const cat   = detectCategory(title + ' ' + (item.description||''))
          const scale = detectScale(title, venue, item.description||'')
          events.push({ id:makeId(title,date), title, date, venue, address:item.location?.address?.streetAddress||'Montevideo, Uruguay', category:cat, access:item.offers?.[0]?.price>0?'paid':'free', scale, isMassive:isMassive(scale,venue), price:item.offers?.[0]?.price?`$${item.offers[0].price}`:'', imageUrl:item.image||'', sourceUrl, source:'eventbrite', scrapedAt:new Date().toISOString() })
          parsed = true
        }
      } catch {}
    })
    if (!parsed) {
      // fallback HTML scraping
      $('[data-testid*="event"],[class*="event-card"],[class*="search-event"]').each((_, el) => {
        try {
          const $el   = $(el)
          const title = $el.find('h2,h3,[class*="title"]').first().text().trim()
          if (!validateTitle(title)) return
          const dateRaw   = $el.find('time,[class*="date"]').first().text().trim()
          const date      = parseDate(dateRaw)
          if (!isFutureDate(date)) return
          const href      = $el.find('a').first().attr('href') || ''
          const sourceUrl = href.startsWith('http') ? href : `https://www.eventbrite.com${href}`
          if (!validateUrl(sourceUrl)) return
          const venue = $el.find('[class*="location"],[class*="venue"]').first().text().trim()
          const cat   = detectCategory(title)
          const scale = detectScale(title, venue, '')
          events.push({ id:makeId(title,date), title, date, venue:venue||'Montevideo', address:'Montevideo, Uruguay', category:cat, access:'unknown', scale, isMassive:isMassive(scale,venue), sourceUrl, source:'eventbrite', scrapedAt:new Date().toISOString() })
        } catch {}
      })
    }
    break // success en la primera URL que funcione
  }
  console.log(`[Eventbrite] ${events.length} events`)
  return events
}

// ─────────────────────────────────────────────
// SCRAPER: SerpAPI Google Events
// ─────────────────────────────────────────────
async function scrapeGoogleEvents() {
  const key = process.env.SERPAPI_KEY
  if (!key) { console.log('[Google Events] Skipped — no SERPAPI_KEY'); return [] }
  const events = []
  const queries = [
    'eventos Montevideo Uruguay',
    'conciertos Montevideo Uruguay',
    'eventos deportivos Montevideo',
    'teatro Montevideo',
    'eventos geek anime Montevideo',
    'ferias y festivales Montevideo',
  ]
  for (const q of queries) {
    try {
      const url  = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(q)}&location=Montevideo%2C+Uruguay&hl=es&gl=uy&api_key=${key}`
      const data = await fetchJson(url)
      if (!data) continue
      for (const ev of (data.events_results || [])) {
        const title = (ev.title || '').trim()
        if (!validateTitle(title)) continue
        const venue   = ev.venue?.name || ev.address?.[0] || 'Montevideo'
        const dateRaw = ev.date?.start_date || ev.date?.when || ''
        const date    = parseDate(dateRaw)
        if (!isFutureDate(date)) continue
        const cat   = detectCategory(title + ' ' + (ev.description||''))
        const scale = detectScale(title, venue, ev.description||'')
        events.push({ id:makeId(title,date), title, date, venue, address:(ev.address||[]).join(', ')||'Montevideo', category:cat, access:ev.ticket_info?.[0]?.link?'paid':'unknown', scale, isMassive:isMassive(scale,venue), ticketUrl:ev.ticket_info?.[0]?.link, imageUrl:ev.thumbnail, sourceUrl:ev.link||'', source:'google', scrapedAt:new Date().toISOString() })
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
    const key = `${ev.title.toLowerCase().replace(/\s+/g,'').slice(0,30)}_${ev.date.slice(0,10)}`
    if (!seen.has(key)) seen.set(key, ev)
  }
  return [...seen.values()].sort((a,b) => new Date(a.date) - new Date(b.date))
}

// ─────────────────────────────────────────────
// Merge con seeds (cubre meses sin datos reales)
// ─────────────────────────────────────────────
function mergeWithSeeds(scraped, seeds) {
  const scrapedMonths = new Set(scraped.map(e => e.date.slice(0,7)))
  const fillSeeds = seeds.filter(s => !scrapedMonths.has(s.date.slice(0,7)))
  return [...scraped, ...fillSeeds]
}

// ─────────────────────────────────────────────
// Seeds universales — fallback
// ─────────────────────────────────────────────
function seedEvents() {
  const now = Date.now()
  const day = 86_400_000
  return [
    // Deportes
    { id:'seed-001', title:'Nacional vs Peñarol — Clásico', date:new Date(now+3*day).toISOString(), venue:'Estadio Centenario', address:'Av. Ricaldoni s/n, Mvd', category:'futbol', access:'paid', scale:'massive', isMassive:true, price:'Desde $500', ticketUrl:'https://www.passline.com/eventos', sourceUrl:'https://www.passline.com/eventos', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-002', title:'Maratón de Montevideo 2026', date:new Date(now+10*day).toISOString(), venue:'Rambla Sur', address:'Rambla República de Chile, Mvd', category:'atletismo', access:'paid', scale:'massive', isMassive:true, price:'Desde $800', ticketUrl:'https://www.passline.com/eventos', sourceUrl:'https://www.passline.com/eventos', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-003', title:'Básquet — Hebraica vs Goes', date:new Date(now+2*day).toISOString(), venue:'Antel Arena', address:'Dr. Américo Ricaldoni 2468, Mvd', category:'basket', access:'paid', scale:'large', isMassive:false, price:'$400', ticketUrl:'https://www.tickantel.com.uy/espectaculos', sourceUrl:'https://www.tickantel.com.uy/espectaculos', source:'seed', scrapedAt:new Date().toISOString() },
    // Música
    { id:'seed-010', title:'Festival de Música en el Parque — Verano 2026', date:new Date(now+5*day).toISOString(), venue:'Parque Rodó', address:'Parque Rodó, Mvd', category:'musica', access:'free', scale:'large', isMassive:false, sourceUrl:'https://cultura.montevideo.gub.uy/agenda', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-011', title:'Concierto de Rock — Antel Arena', date:new Date(now+15*day).toISOString(), venue:'Antel Arena', address:'Dr. Américo Ricaldoni 2468, Mvd', category:'musica', access:'paid', scale:'massive', isMassive:true, price:'Desde $1200', ticketUrl:'https://www.tickantel.com.uy/espectaculos', sourceUrl:'https://www.tickantel.com.uy/espectaculos', source:'seed', scrapedAt:new Date().toISOString() },
    // Teatro
    { id:'seed-020', title:'Obra de Teatro — Temporada Otoño', date:new Date(now+7*day).toISOString(), venue:'Teatro Solís', address:'Buenos Aires 678, Mvd', category:'teatro', access:'paid', scale:'medium', isMassive:false, price:'$400', ticketUrl:'https://www.tickantel.com.uy/espectaculos', sourceUrl:'https://www.tickantel.com.uy/espectaculos', source:'seed', scrapedAt:new Date().toISOString() },
    // Geek
    { id:'seed-030', title:'AnimeFest Uruguay 2026', date:new Date(now+20*day).toISOString(), venue:'Antel Arena', address:'Dr. Américo Ricaldoni 2468, Mvd', category:'anime', access:'paid', scale:'massive', isMassive:true, price:'Desde $600', ticketUrl:'https://www.passline.com/eventos', sourceUrl:'https://www.passline.com/eventos', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-031', title:'Torneo de Magic: The Gathering — FNM Montevideo', date:new Date(now+4*day).toISOString(), venue:'Centro Comercial Montevideo', address:'Mvd', category:'magic', access:'paid', scale:'small', isMassive:false, price:'$200', sourceUrl:'https://eventosanime.uy', source:'seed', scrapedAt:new Date().toISOString() },
    // Cultura
    { id:'seed-040', title:'Feria de Artesanías — Ciudad Vieja', date:new Date(now+1*day).toISOString(), venue:'Plaza Matriz', address:'Ciudad Vieja, Mvd', category:'feria', access:'free', scale:'medium', isMassive:false, sourceUrl:'https://cultura.montevideo.gub.uy/agenda', source:'seed', scrapedAt:new Date().toISOString() },
    { id:'seed-041', title:'Carnaval — Tablado del Prado', date:new Date(now+30*day).toISOString(), venue:'Parque del Prado', address:'Parque del Prado, Mvd', category:'carnaval', access:'paid', scale:'large', isMassive:false, price:'$300', sourceUrl:'https://www.passline.com/eventos', source:'seed', scrapedAt:new Date().toISOString() },
  ]
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  console.log('🌸 Kōen — scraper universal iniciado:', new Date().toISOString())

  const results = await Promise.allSettled([
    scrapePassline(),
    scrapeTickantel(),
    scrapeRedTickets(),
    scrapeEventosAnime(),
    scrapeIMMCultura(),
    scrapeEventbrite(),
    scrapeGoogleEvents(),
  ])

  const sourceNames = ['passline','tickantel','redtickets','eventosanime','imm_cultura','eventbrite','google']

  const scraped = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  const deduped = dedup(scraped)
  const seeds   = seedEvents()
  const events  = deduped.length >= 3 ? mergeWithSeeds(deduped, seeds) : seeds

  const output = {
    events,
    meta: {
      lastUpdated:   new Date().toISOString(),
      nextUpdate:    new Date(Date.now() + 60*60*1000).toISOString(),
      totalCount:    events.length,
      scrapedCount:  deduped.length,
      usingFallback: deduped.length < 3,
      sources: results.map((r,i) => ({
        name:  sourceNames[i],
        count: r.status === 'fulfilled' ? r.value.length : 0,
        ok:    r.status === 'fulfilled',
      })),
    }
  }

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8')
  console.log(`✅ Guardados ${events.length} eventos (${deduped.length} scraped + ${events.length - deduped.length} seeds) → public/events.json`)
  console.log('   Fuentes:', output.meta.sources.map(s=>`${s.name}(${s.count})`).join(' '))
}

main().catch(e => { console.error('❌ Scraper error:', e); process.exit(1) })
