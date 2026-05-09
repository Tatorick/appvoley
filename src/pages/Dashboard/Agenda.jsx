import React, { useState, useEffect, useCallback } from 'react'
import { Plus, CalendarDays, List, MapPin, Clock, Trophy, ChevronLeft, ChevronRight, Loader2, X, ExternalLink, Zap, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import AddMatchModal from '../../components/Modals/AddMatchModal'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_HEADER = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function toLocalStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function getEventColor(event, full = false) {
  if (event.status === 'canceled') return full ? 'bg-slate-400' : 'bg-slate-300'
  if (event.status === 'completed') {
    const won = (event.score_us ?? 0) > (event.score_them ?? 0)
    return full ? (won ? 'bg-emerald-500' : 'bg-red-500') : (won ? 'bg-emerald-400' : 'bg-red-400')
  }
  if (event.is_tournament_match) return full ? 'bg-purple-500' : 'bg-purple-400'
  if (event.type === 'league') return full ? 'bg-orange-500' : 'bg-orange-400'
  return full ? 'bg-blue-500' : 'bg-blue-400'
}

function getEventLabel(event) {
  if (event.is_tournament_match) return 'Torneo'
  if (event.type === 'league') return 'Liga'
  return 'Amistoso'
}

export default function Agenda() {
  const { club, role, loading: clubLoading } = useClubData()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(null)
  const [view, setView] = useState(() => localStorage.getItem('agendaView') || 'calendar')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [matchToEdit, setMatchToEdit] = useState(null)
  const canEdit = role === 'owner' || role === 'admin' || role === 'coach' || role === 'assistant'

  const setViewPersisted = (v) => { setView(v); localStorage.setItem('agendaView', v) }

  const fetchData = useCallback(async () => {
    if (!club) return
    setLoading(true)
    try {
      const { data: matchesData } = await supabase
        .from('matches').select('*, teams(nombre, genero, categories(nombre))').eq('club_id', club.id)

      const { data: clubTournaments } = await supabase
        .from('tournaments').select('id, name, location, start_date, end_date, status').eq('club_id', club.id)

      setTournaments(clubTournaments || [])
      const tournamentIds = (clubTournaments || []).map(t => t.id)
      let tsData = []
      if (tournamentIds.length > 0) {
        const { data } = await supabase
          .from('tournament_schedule').select('*, tournaments(id, name, location)').in('tournament_id', tournamentIds)
        tsData = data || []
      }

      const normalMatches = (matchesData || []).map(m => ({ ...m, event_date: m.date, is_tournament_match: false }))
      const tournamentMatches = tsData.map(m => ({
        id: m.id, event_date: m.match_date, date: m.match_date,
        time: m.match_time || '12:00:00', opponent_name: m.opponent,
        score_us: m.our_score, score_them: m.opponent_score, status: m.status,
        location: m.venue || m.tournaments?.location || '', type: 'tournament',
        teams: { nombre: m.tournaments?.name || 'Torneo', genero: '', categories: { nombre: m.phase || '' } },
        is_tournament_match: true, tournament_id: m.tournament_id
      }))
      setMatches([...normalMatches, ...tournamentMatches])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [club])

  useEffect(() => { if (club) fetchData() }, [club, fetchData])

  // Build events map
  const eventsMap = {}
  matches.forEach(m => {
    const key = (m.event_date || m.date || '').slice(0, 10)
    if (!key) return
    if (!eventsMap[key]) eventsMap[key] = []
    eventsMap[key].push(m)
  })

  // Tournament range days
  const tournamentRangeDays = new Set()
  tournaments.forEach(t => {
    if (!t.start_date || !t.end_date) return
    const start = new Date(t.start_date + 'T12:00:00')
    const end = new Date(t.end_date + 'T12:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      tournamentRangeDays.add(toLocalStr(d))
    }
  })

  // Stats
  const completed = matches.filter(m => m.status === 'completed')
  const wins = completed.filter(m => (m.score_us ?? 0) > (m.score_them ?? 0)).length
  const losses = completed.length - wins
  const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0
  const upcoming = matches.filter(m => m.status === 'scheduled').sort((a, b) => new Date(a.event_date) - new Date(b.event_date))

  const streak = (() => {
    const sorted = [...completed].sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
    if (!sorted.length) return null
    const firstWon = (sorted[0].score_us ?? 0) > (sorted[0].score_them ?? 0)
    let count = 0
    for (const m of sorted) {
      const w = (m.score_us ?? 0) > (m.score_them ?? 0)
      if (w === firstWon) count++; else break
    }
    return { type: firstWon ? 'win' : 'loss', count }
  })()

  const todayStr = toLocalStr(today)
  const sevenDaysStr = toLocalStr(new Date(today.getTime() + 7 * 86400000))
  const nextEvent = upcoming.find(m => {
    const d = (m.event_date || m.date || '').slice(0, 10)
    return d >= todayStr && d <= sevenDaysStr
  })

  if (clubLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  if (!club) return <div className="p-10 text-center text-slate-400">No se encontró el club.</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="text-primary" /> Agenda Deportiva
          </h1>
          <p className="text-slate-500 text-sm">Planificación de partidos y eventos del club.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button onClick={() => setViewPersisted('calendar')} title="Vista Calendario"
              className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
              <CalendarDays size={18} />
            </button>
            <button onClick={() => setViewPersisted('list')} title="Vista Lista"
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={18} />
            </button>
          </div>
          {canEdit && (
            <button onClick={() => { setMatchToEdit(null); setIsModalOpen(true) }}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2 active:scale-95">
              <Plus size={18} /> Nuevo Partido
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Jugados', value: completed.length, color: 'text-slate-800' },
          { label: 'Ganados', value: wins, color: 'text-emerald-600' },
          { label: 'Perdidos', value: losses, color: 'text-red-500' },
          { label: '% Victorias', value: `${winRate}%`, color: 'text-primary' },
          { label: 'Racha', value: streak ? `${streak.count}${streak.type === 'win' ? '✅' : '❌'}` : '-', color: streak?.type === 'win' ? 'text-emerald-600' : streak?.type === 'loss' ? 'text-red-500' : 'text-slate-300' }
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming banner */}
      {nextEvent && (
        <div onClick={() => setSelectedDay((nextEvent.event_date || nextEvent.date || '').slice(0, 10))}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl px-5 py-3 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-all">
          <Zap size={18} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Próximo: <span className="text-primary">vs {nextEvent.opponent_name}</span></p>
            <p className="text-xs text-slate-500">
              {new Date(((nextEvent.event_date || nextEvent.date) + 'T12:00:00')).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              {nextEvent.time ? ` · ${(nextEvent.time || '').slice(0, 5)}` : ''}
              {nextEvent.location ? ` · ${nextEvent.location}` : ''}
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
      ) : view === 'calendar' ? (
        <CalendarView
          currentMonth={currentMonth} currentYear={currentYear}
          setCurrentMonth={setCurrentMonth} setCurrentYear={setCurrentYear}
          eventsMap={eventsMap} tournamentRangeDays={tournamentRangeDays}
          selectedDay={selectedDay} setSelectedDay={setSelectedDay}
          today={today} onEditMatch={(m) => { if (!canEdit) return; m.is_tournament_match ? navigate('/app/tournaments/' + m.tournament_id) : (setMatchToEdit(m), setIsModalOpen(true)) }}
          tournaments={tournaments}
          onNavigateToTournament={(id) => navigate('/app/tournaments/' + id)}
        />
      ) : (
        <ListView
          upcoming={upcoming}
          history={matches.filter(m => m.status === 'completed' || m.status === 'canceled').sort((a, b) => new Date(b.event_date) - new Date(a.event_date))}
          onEditMatch={(m) => { if (!canEdit) return; m.is_tournament_match ? navigate('/app/tournaments/' + m.tournament_id) : (setMatchToEdit(m), setIsModalOpen(true)) }}
        />
      )}

      <AddMatchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} clubId={club.id} matchToEdit={matchToEdit} />
    </div>
  )
}

// ── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ currentMonth, currentYear, setCurrentMonth, setCurrentYear, eventsMap, tournamentRangeDays, selectedDay, setSelectedDay, today, onEditMatch, tournaments, onNavigateToTournament }) {
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const firstDay = new Date(currentYear, currentMonth, 1)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const todayStr = toLocalStr(today)

  const cells = []
  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: toLocalStr(new Date(currentYear, currentMonth, -startOffset + i + 1)), faded: true })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: toLocalStr(new Date(currentYear, currentMonth, i)), faded: false })
  }
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: toLocalStr(new Date(currentYear, currentMonth + 1, i)), faded: true })
  }

  const selectedEvents = selectedDay ? (eventsMap[selectedDay] || []) : []
  const selectedTournaments = selectedDay
    ? tournaments.filter(t => t.start_date && t.end_date && selectedDay >= t.start_date && selectedDay <= t.end_date)
    : []

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      {/* Grid */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"><ChevronLeft size={20} /></button>
          <h2 className="font-bold text-lg text-slate-800">{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_HEADER.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const events = eventsMap[cell.date] || []
            const isToday = cell.date === todayStr
            const isSelected = cell.date === selectedDay
            const inTournament = !cell.faded && tournamentRangeDays.has(cell.date)
            const dots = events.slice(0, 3)
            const extra = events.length - 3

            return (
              <div key={idx}
                onClick={() => !cell.faded && setSelectedDay(cell.date === selectedDay ? null : cell.date)}
                className={`min-h-[68px] p-2 border-b border-r border-slate-50 transition-all
                  ${cell.faded ? 'bg-slate-50/30 cursor-default' : 'cursor-pointer hover:bg-slate-50/80'}
                  ${inTournament ? 'bg-yellow-50/70' : ''}
                  ${isSelected ? '!bg-primary/10 ring-2 ring-inset ring-primary/30' : ''}
                `}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1
                  ${isToday ? 'bg-primary text-white shadow-md shadow-primary/30' : cell.faded ? 'text-slate-300' : 'text-slate-700'}
                `}>
                  {new Date(cell.date + 'T12:00:00').getDate()}
                </div>
                {dots.length > 0 && (
                  <div className="flex items-center gap-0.5 flex-wrap">
                    {dots.map((e, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e)}`} />)}
                    {extra > 0 && <span className="text-[9px] font-bold text-slate-400">+{extra}</span>}
                  </div>
                )}
                {inTournament && events.length === 0 && (
                  <span className="text-[9px] font-bold text-yellow-600 bg-yellow-100 px-1 rounded mt-0.5 inline-block">🏆</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-4 flex-wrap">
          {[
            { color: 'bg-blue-400', label: 'Amistoso' },
            { color: 'bg-purple-400', label: 'Torneo' },
            { color: 'bg-orange-400', label: 'Liga' },
            { color: 'bg-emerald-400', label: 'Victoria' },
            { color: 'bg-red-400', label: 'Derrota' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-2 h-2 rounded-full ${l.color}`} />{l.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />Rango Torneo
          </span>
        </div>
      </div>

      {/* Day Panel */}
      <div className="lg:w-80 space-y-3">
        {selectedDay ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 capitalize">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><X size={16} /></button>
            </div>

            {selectedTournaments.map(t => (
              <div key={t.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-3">
                <Trophy size={18} className="text-yellow-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{t.name}</p>
                  <p className="text-xs text-yellow-700">{t.start_date} → {t.end_date}</p>
                </div>
                <button onClick={() => onNavigateToTournament(t.id)} className="p-1.5 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors">
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}

            {selectedEvents.length > 0
              ? selectedEvents.map(event => <EventCard key={event.id} event={event} onEdit={onEditMatch} />)
              : selectedTournaments.length === 0 && (
                <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">Sin eventos este día</p>
                </div>
              )}
          </>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
            <CalendarDays size={32} className="mx-auto text-slate-200 mb-2" />
            <p className="text-slate-400 text-sm font-medium">Selecciona un día</p>
            <p className="text-slate-300 text-xs mt-1">para ver sus eventos</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Event Card (shared) ───────────────────────────────────────────────────────
function EventCard({ event, onEdit }) {
  const isCompleted = event.status === 'completed'
  const weWon = (event.score_us ?? 0) > (event.score_them ?? 0)
  return (
    <div onClick={() => onEdit(event)}
      className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all">
      <div className={`h-1 w-full ${getEventColor(event, true)}`} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{event.teams?.nombre || 'Equipo'}</p>
            <p className="text-xs text-slate-500 mt-0.5">vs <span className="font-semibold text-slate-700">{event.opponent_name}</span></p>
          </div>
          {isCompleted && event.score_us != null ? (
            <div className="text-right shrink-0">
              <p className={`text-lg font-bold leading-none ${weWon ? 'text-emerald-600' : 'text-red-500'}`}>{event.score_us} – {event.score_them}</p>
              <p className={`text-[10px] font-bold ${weWon ? 'text-emerald-500' : 'text-red-400'}`}>{weWon ? 'VICTORIA' : 'DERROTA'}</p>
            </div>
          ) : (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${event.status === 'canceled' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
              {event.status === 'canceled' ? 'CANCELADO' : getEventLabel(event).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          {event.time && <span className="flex items-center gap-1"><Clock size={10} />{(event.time || '').slice(0, 5)}</span>}
          {event.location && <span className="flex items-center gap-1 truncate"><MapPin size={10} />{event.location}</span>}
        </div>
      </div>
    </div>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ upcoming, history, onEditMatch }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />Próximos Partidos
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 italic">No hay partidos programados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(m => <EventCard key={m.id} event={m} onEdit={onEditMatch} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-400" />Historial
        </h2>
        {history.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 italic">Sin historial registrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map(m => <EventCard key={m.id} event={m} onEdit={onEditMatch} />)}
          </div>
        )}
      </section>
    </div>
  )
}
