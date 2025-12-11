import React, { useState, useEffect } from 'react'
import { Plus, Calendar, MapPin, Clock, Trophy, Filter, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import AddMatchModal from '../../components/Modals/AddMatchModal'

export default function Agenda() {
  const { club, role, loading: clubLoading } = useClubData()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'history'
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [matchToEdit, setMatchToEdit] = useState(null)

  const canEdit = role === 'owner' || role === 'admin' || role === 'coach'

  const fetchMatches = React.useCallback(async () => {
    if (!club) return
    setLoading(true)
    try {
        const { data, error } = await supabase
            .from('matches')
            .select(`
                *,
                teams (nombre, genero, categories(nombre))
            `)
            .eq('club_id', club.id)
            .order('date', { ascending: activeTab === 'upcoming' }) 
            // Usually upcoming ASC (soonest first), history DESC (newest first). 
            // But Supabase sort is static in one query unless we split or sort in JS. 
            // Let's sort in JS or fetch all and filter. Matches vol won't be huge yet.
            // Better: Order by date DESC always, then filter in JS? 
            // Or just Order by date ASC for everything and reverse for history?
            
        if (error) throw error
        setMatches(data || [])
    } catch (err) {
        console.error(err)
        setError("Error al cargar partidos")
    } finally {
        setLoading(false)
    }
  }, [club, activeTab])

  useEffect(() => {
    if (club) fetchMatches()
  }, [club, fetchMatches]) // Re-fetch when tab logic changes if we moved sort to query, but here we moved sort to JS? No, fetchMatches dependency on activeTab is mostly for triggers.

  // Filter & Sort
  const upcomingMatches = matches
    .filter(m => m.status === 'scheduled')
    .sort((a,b) => new Date(a.date) - new Date(b.date)) // Ascending (soonest first)
  
  const historyMatches = matches
    .filter(m => m.status === 'completed' || m.status === 'canceled')
    .sort((a,b) => new Date(b.date) - new Date(a.date)) // Descending (newest first)

  const handleEdit = (match) => {
      if(!canEdit) return
      setMatchToEdit(match)
      setIsModalOpen(true)
  }

  const handleNew = () => {
      setMatchToEdit(null)
      setIsModalOpen(true)
  }

  if (clubLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>
  if (!club) return <div className="p-10 text-center">No se encontró el club.</div>

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="text-primary" /> Agenda Deportiva
                </h1>
                <p className="text-slate-500 text-sm">Gestiona partidos, amistosos y registra resultados.</p>
            </div>
            {canEdit && (
                <button 
                    onClick={handleNew}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} /> Nuevo Partido
                </button>
            )}
        </div>

        {/* Stats Summary (Mini) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Partidos Jugados</p>
                <p className="text-2xl font-bold text-slate-800">{historyMatches.filter(m => m.status === 'completed').length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Ganados</p>
                <p className="text-2xl font-bold text-green-600">
                    {historyMatches.filter(m => m.status === 'completed' && m.score_us > m.score_them).length}
                </p>
            </div>
             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Perdidos</p>
                <p className="text-2xl font-bold text-red-500">
                    {historyMatches.filter(m => m.status === 'completed' && m.score_us < m.score_them).length}
                </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                 <p className="text-xs font-bold text-slate-400 uppercase">Próximos</p>
                 <p className="text-2xl font-bold text-blue-600">{upcomingMatches.length}</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Próximos
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Resultados / Historial
            </button>
        </div>

        {/* Content */}
        {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {(activeTab === 'upcoming' ? upcomingMatches : historyMatches).map(match => (
                    <MatchCard key={match.id} match={match} onClick={() => handleEdit(match)} />
                ))}
                
                {(activeTab === 'upcoming' ? upcomingMatches : historyMatches).length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100 border-dashed">
                        No hay partidos {activeTab === 'upcoming' ? 'programados' : 'registrados'}.
                    </div>
                )}
            </div>
        )}

        <AddMatchModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchMatches}
            clubId={club.id}
            matchToEdit={matchToEdit}
        />
    </div>
  )
}

function MatchCard({ match, onClick }) {
    const isCompleted = match.status === 'completed'
    const weWon = match.score_us > match.score_them

    return (
        <div onClick={onClick} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group relative">
            {/* Status Stripe */}
            <div className={`h-2 w-full ${
                match.status === 'scheduled' ? 'bg-blue-500' :
                match.status === 'canceled' ? 'bg-slate-300' :
                weWon ? 'bg-green-500' : 'bg-red-500'
            }`}></div>

            <div className="p-5">
                {/* Header: Date & Type */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-50 px-2 py-1 rounded-lg">
                        <Calendar size={12}/>
                        <span>{new Date(match.date).toLocaleDateString()}</span>
                        <span className="text-slate-300">|</span>
                        <Clock size={12}/>
                        <span>{match.time.slice(0,5)}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                        match.type === 'tournament' ? 'bg-purple-100 text-purple-700' :
                        match.type === 'league' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {match.type === 'league' ? 'Liga' : match.type === 'tournament' ? 'Torneo' : 'Amistoso'}
                    </span>
                </div>

                {/* Teams */}
                <div className="space-y-3 mb-4">
                    {/* Us */}
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-800">{match.teams?.nombre || 'Nuestro Equipo'}</p>
                            <p className="text-[10px] text-slate-400">{match.teams?.categories?.nombre} {match.teams?.genero}</p>
                        </div>
                        {isCompleted && (
                            <span className={`text-xl font-bold ${weWon ? 'text-green-600' : 'text-slate-400'}`}>
                                {match.score_us}
                            </span>
                        )}
                    </div>
                    
                    {/* VS Divider if not completed */}
                    {!isCompleted && <div className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest my-1">- VS -</div>}

                    {/* Them */}
                    <div className="flex justify-between items-center">
                         <div>
                            <p className="font-bold text-slate-600">{match.opponent_name}</p>
                            <p className="text-[10px] text-slate-400">Rival</p>
                        </div>
                        {isCompleted && (
                            <span className={`text-xl font-bold ${!weWon ? 'text-green-600' : 'text-slate-400'}`}>
                                {match.score_them}
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer: Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <MapPin size={12} />
                    <span className="truncate">{match.location || 'Sin ubicación'}</span>
                </div>
            </div>
        </div>
    )
}
