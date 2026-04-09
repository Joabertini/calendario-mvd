import React from 'react'

export default function App() {
  const events = [
    { date: 4, title: 'Carrera Asociación Autismo Uruguay', category: 'Running', venue: 'Playa Malvín' },
    { date: 5, title: 'Llegada Vuelta Ciclista', category: 'Ciclismo', venue: 'Gran Parque Central' },
    { date: 8, title: 'City Torque vs Gremio', category: 'Fútbol', venue: 'Estadio Centenario' },
    { date: 10, title: 'Circuito de conciertos', category: 'Conciertos', venue: 'Teatro Solís' },
    { date: 12, title: 'Carrera Teletón', category: 'Running', venue: 'Pocitos' },
    { date: 19, title: 'Montevideo 15K + 30K', category: 'Running', venue: 'Playa Buceo' },
    { date: 19, title: 'Fixtures Rugby / Hockey', category: 'Rugby', venue: 'Estadio Charrúa' },
    { date: 25, title: '10K Peluffo', category: 'Running', venue: 'Playa Malvín' },
    { date: 26, title: 'Gran Fondo La Española', category: 'Ciclismo', venue: 'Montevideo' },
  ]

  const categories = ['Todos', ...new Set(events.map((e) => e.category))]
  const [filter, setFilter] = React.useState('Todos')
  const filtered = filter === 'Todos' ? events : events.filter((e) => e.category === filter)
  const days = Array.from({ length: 30 }, (_, i) => i + 1)

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Abril 2026 — Montevideo</h1>
          <select
            className="border rounded-2xl px-4 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const dayEvents = filtered.filter((e) => e.date === day)
            return (
              <div key={day} className="border rounded-2xl p-3 min-h-32 shadow-sm">
                <div className="font-semibold text-lg mb-2">{day}</div>
                <div className="space-y-2">
                  {dayEvents.map((event, idx) => (
                    <div key={idx} className="text-sm border rounded-xl p-2 bg-gray-50">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-gray-600">{event.category}</div>
                      <div className="text-xs text-gray-500">{event.venue}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
