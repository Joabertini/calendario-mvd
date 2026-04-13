# 📡 EventScout MVD

Radar de eventos deportivos en Montevideo, Uruguay.  
Scraping automático cada hora · Filtros por categoría · Actualización en vivo

---

## Cómo funciona

```
GitHub Actions (cron cada hora)
  → scripts/scrape.js         ← Node.js, corre en el runner de GitHub
  → escribe public/events.json ← se commitea al repo
  → dispara deploy a GitHub Pages

React (navegador del fotógrafo)
  → fetch('/events.json?t=…')  ← polling cada 60 segundos
  → aplica filtros en el cliente
```

**No hay servidor.** Todo es estático. El "tiempo real" lo dan los GitHub Actions + polling del frontend.

---

## Fuentes de datos

| Fuente | Tipo | URL |
|---|---|---|
| Passline | Boleterí­a UY | passline.com/eventos?categoria=deporte |
| Tickantel | Boleterí­a UY | tickantel.com.uy/espectaculos/categorias/deportes |
| RedTickets | Boleterí­a UY | redtickets.uy/eventos/deportes |
| IMM Cultura | Eventos gratuitos | cultura.montevideo.gub.uy/agenda |
| Google Events | Opcional (API key) | via SerpAPI |

---

## Setup inicial

### 1. Cloná el repo

```bash
git clone https://github.com/Joabertini/calendario-mvd.git
cd calendario-mvd
```

### 2. Instalá dependencias

```bash
npm install          # dependencias React/Vite
cd scripts && npm install && cd ..   # dependencias del scraper
```

### 3. Desarrollo local

```bash
npm run dev
```

Para probar el scraper localmente:

```bash
node scripts/scrape.js
```

Esto genera/actualiza `public/events.json`.

---

## Deploy a GitHub Pages

### 1. Habilitá GitHub Pages en el repo

Ve a **Settings → Pages → Source** y seleccioná **"GitHub Actions"**.

### 2. Primer deploy

Hacé un push a `main`. El workflow `deploy.yml` se dispara automáticamente y publica en:

```
https://joabertini.github.io/calendario-mvd/
```

### 3. Scraping automático

El workflow `scrape.yml` corre **cada hora** (cron `0 * * * *`) y commitea `public/events.json` actualizado, lo que a su vez dispara un nuevo deploy.

Para correrlo a mano: **Actions → Scrape Events → Run workflow**.

---

## Google Events (opcional)

Para habilitar scraping de Google Events via SerpAPI:

1. Creá una cuenta gratuita en [serpapi.com](https://serpapi.com) (100 búsquedas/mes gratis)
2. Copiá tu API key
3. En el repo: **Settings → Secrets → Actions → New secret**
   - Nombre: `SERPAPI_KEY`
   - Valor: tu key

---

## Categorí­as

| ID | Deporte |
|---|---|
| `futbol` | Fútbol |
| `basket` | Básquet |
| `rugby` | Rugby |
| `tenis` | Tenis / Pádel |
| `atletismo` | Atletismo, maratones, running |
| `ciclismo` | Ciclismo |
| `natacion` | Natación |
| `artes_marciales` | Boxeo, MMA, Judo, etc. |
| `otros` | Resto |

---

## Estructura del proyecto

```
calendario-mvd/
├── .github/
│   └── workflows/
│       ├── scrape.yml       ← cron cada hora, genera events.json
│       └── deploy.yml       ← build + deploy a GitHub Pages
├── scripts/
│   ├── package.json         ← deps del scraper (cheerio, node-fetch)
│   └── scrape.js            ← scraper principal
├── public/
│   └── events.json          ← generado automáticamente
├── src/
│   ├── components/
│   │   ├── Header.jsx / .module.css
│   │   ├── Filters.jsx / .module.css
│   │   ├── EventCard.jsx / .module.css
│   │   └── StatusBar.jsx / .module.css
│   ├── hooks/
│   │   └── useEvents.js     ← polling + filtros
│   ├── lib/
│   │   └── constants.js     ← categorí­as, labels, colores
│   ├── App.jsx / App.module.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

---

## Agregar eventos manualmente

Editá `public/events.json` directamente y pusheá. Formato de cada evento:

```json
{
  "id": "unique-id",
  "title": "Nombre del evento",
  "date": "2025-07-15T20:00:00.000Z",
  "venue": "Estadio Centenario",
  "address": "Av. Ricaldoni s/n, Montevideo",
  "category": "futbol",
  "access": "paid",
  "scale": "massive",
  "isMassive": true,
  "price": "Desde $500",
  "ticketUrl": "https://...",
  "sourceUrl": "https://...",
  "source": "manual",
  "scrapedAt": "2025-07-09T00:00:00.000Z"
}
```

---

## Mejoras posibles

- [ ] Notificaciones push cuando aparece un evento masivo nuevo
- [ ] Vista de calendario mensual
- [ ] Export a CSV para planificación
- [ ] Integración con Google Calendar
- [ ] Panel de admin para agregar eventos manuales via UI
