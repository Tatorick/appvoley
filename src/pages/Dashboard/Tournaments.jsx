import React, { useState, useEffect } from 'react'
import { Trophy, Plus, MapPin, Calendar, Users, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import CreateTournamentModal from '../../components/Modals/CreateTournamentModal'

export default function Tournaments() {
    const { club, role, loading: clubLoading } = useClubData()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [tournaments, setTournaments] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    const canManage = role === 'owner' || role === 'admin' || role === 'coach'

    const fetchTournaments = React.useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('club_id', club.id)
                .order('start_date', { ascending: false })

            if (error) throw error
            setTournaments(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [club])

    useEffect(() => {
        if (club) fetchTournaments()
    }, [club, fetchTournaments])

    if (clubLoading) return <div className="p-10 text-center">Cargando...</div>

    const activeTournaments = tournaments.filter(t => t.status === 'planned' || t.status === 'confirmed')
    const pastTournaments = tournaments.filter(t => t.status === 'completed' || t.status === 'canceled')

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Torneos y Viajes
                    </h1>
                    <p className="text-slate-500 text-sm">Gestiona la logística, convocatorias y pagos de tus competencias.</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} /> Nuevo Torneo
                    </button>
                )}
            </div>

            {/* Active Tournaments Grid */}
            <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Próximos Eventos</h2>
                {loading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : activeTournaments.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 border-dashed text-center text-slate-400">
                        <Trophy size={40} className="mx-auto mb-3 opacity-20" />
                        <p>No hay torneos activos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTournaments.map(t => (
                            <TournamentCard key={t.id} tournament={t} onClick={() => navigate(`/app/tournaments/${t.id}`)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Past Tournaments List */}
            {pastTournaments.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Historial</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        {pastTournaments.map((t, i) => (
                            <div
                                key={t.id}
                                onClick={() => navigate(`/app/tournaments/${t.id}`)}
                                className={`p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group ${i !== pastTournaments.length - 1 ? 'border-b border-slate-50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-10 rounded-full ${t.status === 'completed' ? 'bg-slate-300' : 'bg-red-200'}`}></div>
                                    <div>
                                        <h3 className="font-bold text-slate-700 group-hover:text-primary transition-colors">{t.name}</h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-2">
                                            <MapPin size={12} /> {t.location} • {new Date(t.start_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <CreateTournamentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTournaments}
                clubId={club.id}
            />
        </div>
    )
}

function TournamentCard({ tournament, onClick }) {
    const statusColors = {
        'planned': 'bg-blue-100 text-blue-700',
        'confirmed': 'bg-green-100 text-green-700',
        'completed': 'bg-slate-100 text-slate-600',
        'canceled': 'bg-red-100 text-red-600'
    }

    const statusLabels = {
        'planned': 'Planificado',
        'confirmed': 'Confirmado',
        'completed': 'Finalizado',
        'canceled': 'Cancelado'
    }

    return (
        <div
            onClick={onClick}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy size={80} />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColors[tournament.status]}`}>
                        {statusLabels[tournament.status]}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors">{tournament.name}</h3>

                <div className="space-y-2 mt-4">
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" /> {tournament.location}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Costo Est.</p>
                    <p className="font-bold text-slate-700">${tournament.cost_per_player}</p>
                </div>
            </div>
        </div>
    )
}
