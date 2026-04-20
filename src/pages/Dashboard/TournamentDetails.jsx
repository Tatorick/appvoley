import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, Settings, Loader2, Save, Plus, Trash2, CheckCircle, XCircle, AlertCircle, MessageCircle, UserPlus, CalendarDays, Swords, Clock, Flag, ChevronDown, ChevronUp, Edit2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import TournamentPaymentModal from '../../components/Modals/TournamentPaymentModal'
import AddPlayerModal from '../../components/Modals/AddPlayerModal'
import CreateTournamentModal from '../../components/Modals/CreateTournamentModal'

const SCHEDULE_PHASES = ['Fase de grupos', 'Cuartos de final', 'Semifinal', 'Tercer puesto', 'Final', 'Partido amistoso', 'Otro']

const emptyMatchForm = () => ({
    match_date: '',
    match_time: '',
    opponent: '',
    venue: '',
    phase: 'Fase de grupos',
    notes: ''
})

export default function TournamentDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { club, role } = useClubData()
    const [loading, setLoading] = useState(true)
    const [tournament, setTournament] = useState(null)
    const [activeTab, setActiveTab] = useState('roster') // 'general', 'roster', 'payments', 'schedule'

    // Roster Data
    const [roster, setRoster] = useState([])
    const [allPlayers, setAllPlayers] = useState([])
    const [isAddingPlayer, setIsAddingPlayer] = useState(false)
    const [isNewPlayerModalOpen, setIsNewPlayerModalOpen] = useState(false)

    // Payments Data
    const [payments, setPayments] = useState([])
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedPlayerForPayment, setSelectedPlayerForPayment] = useState(null)

    // Schedule Data
    const [schedule, setSchedule] = useState([])
    const [isAddingMatch, setIsAddingMatch] = useState(false)
    const [newMatch, setNewMatch] = useState(emptyMatchForm())
    const [scoreModal, setScoreModal] = useState(null) // { id, our_score, opponent_score }
    const [savingScore, setSavingScore] = useState(false)

    // General Tab Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const canManage = role === 'owner' || role === 'admin' || role === 'coach'

    useEffect(() => {
        fetchTournamentDetails()
    }, [id])

    const fetchTournamentDetails = async () => {
        setLoading(true)
        try {
            // 1. Fetch Tournament Info
            const { data: tData, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single()

            if (tError) throw tError
            setTournament(tData)

            // 2. Fetch Roster (include phone for WhatsApp)
            const { data: rData, error: rError } = await supabase
                .from('tournament_roster')
                .select('*, players(id, first_name, last_name, position, phone)')
                .eq('tournament_id', id)

            if (rError) throw rError

            // 2b. Fetch Team Assignments for these players
            const playerIds = rData?.map(r => r.player_id).filter(Boolean) || []
            let playerTeamsMap = {}

            if (playerIds.length > 0) {
                const { data: assignments } = await supabase
                    .from('team_assignments')
                    .select('player_id, teams(nombre)')
                    .in('player_id', playerIds)

                assignments?.forEach(a => {
                    if (!playerTeamsMap[a.player_id]) {
                        playerTeamsMap[a.player_id] = a.teams?.nombre
                    }
                })
            }

            // Map teams back to roster
            const rosterWithTeams = rData?.map(r => ({
                ...r,
                players: {
                    ...r.players,
                    teams: { nombre: playerTeamsMap[r.player_id] || 'Sin Equipo' }
                }
            })) || []

            setRoster(rosterWithTeams)

            // 2c. Fetch Tournament Schedule
            const { data: schedData } = await supabase
                .from('tournament_schedule')
                .select('*')
                .eq('tournament_id', id)
                .order('match_date', { ascending: true })
                .order('match_time', { ascending: true })

            setSchedule(schedData || [])

            // 3. Fetch Payments
            const { data: pData, error: pError } = await supabase
                .from('tournament_payments')
                .select('*, players(first_name, last_name)')
                .eq('tournament_id', id)
                .order('date', { ascending: false })

            if (pError) throw pError
            setPayments(pData || [])

            // 4. Fetch All Players (for adding to roster)
            const { data: apData } = await supabase
                .from('players')
                .select('id, first_name, last_name, position, phone')
                .eq('club_id', tData.club_id)
                .order('first_name')

            // Fetch assignments for all players
            const allPlayerIds = apData?.map(p => p.id) || []
            const allPlayerTeamsMap = {}

            if (allPlayerIds.length > 0) {
                const { data: allAssignments } = await supabase
                    .from('team_assignments')
                    .select('player_id, teams(nombre)')
                    .in('player_id', allPlayerIds)

                allAssignments?.forEach(a => {
                    if (!allPlayerTeamsMap[a.player_id]) {
                        allPlayerTeamsMap[a.player_id] = a.teams?.nombre
                    }
                })
            }

            const allPlayersWithTeams = apData?.map(p => ({
                ...p,
                teams: { nombre: allPlayerTeamsMap[p.id] || 'Sin Equipo' }
            })) || []

            setAllPlayers(allPlayersWithTeams)

        } catch (err) {
            console.error(err)
            // navigate('/app/tournaments') // Don't redirect on error, let user see it
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTournament = async () => {
        if (!confirm('¿Estás seguro de eliminar este torneo? Todas las designaciones, calendario y pagos asociados se perderán.')) return
        try {
            const { error } = await supabase.from('tournaments').delete().eq('id', id)
            if (error) throw error
            navigate('/app/tournaments')
        } catch (err) {
            alert('Error eliminando torneo: ' + err.message)
        }
    }

    // WhatsApp link helper
    const buildWALink = (player) => {
        if (!player?.phone) return null
        const phone = player.phone.replace(/\D/g, '')
        const intl = phone.startsWith('593') ? phone : `593${phone.replace(/^0/, '')}`
        const text = encodeURIComponent(
            `Hola ${player.first_name} 👋\n\n` +
            `Fuiste convocada para el torneo:\n` +
            `🏆 *${tournament?.name}*\n` +
            `📅 Del ${new Date(tournament?.start_date).toLocaleDateString('es-EC')} ` +
            `al ${new Date(tournament?.end_date).toLocaleDateString('es-EC')}\n` +
            `📍 ${tournament?.location}\n` +
            `💰 Costo: $${tournament?.cost_per_player} por jugadora\n\n` +
            `Por favor confirma tu participación respondiendo *SÍ* o *NO* a este mensaje.\n` +
            `¡Esperamos contar contigo! 🏐`
        )
        return `https://wa.me/${intl}?text=${text}`
    }

    // Auto-add newly created player to tournament roster
    const handleNewPlayerCreated = async () => {
        // After refresh, find the newest player not yet in roster
        await fetchTournamentDetails()
        setIsNewPlayerModalOpen(false)
    }
    // --- Roster Logic ---
    const [selectedTeamFilter, setSelectedTeamFilter] = useState('all')
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([])

    const availablePlayers = allPlayers.filter(p => !roster.some(r => r.player_id === p.id))
    const filteredAvailablePlayers = selectedTeamFilter === 'all'
        ? availablePlayers
        : availablePlayers.filter(p => p.teams?.nombre === selectedTeamFilter)

    const togglePlayerSelection = (playerId) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        )
    }

    const handleSelectAll = () => {
        if (selectedPlayerIds.length === filteredAvailablePlayers.length) {
            setSelectedPlayerIds([])
        } else {
            setSelectedPlayerIds(filteredAvailablePlayers.map(p => p.id))
        }
    }

    const handleBulkAdd = async () => {
        if (selectedPlayerIds.length === 0) return
        setLoading(true)
        try {
            const records = selectedPlayerIds.map(pid => ({
                tournament_id: id,
                player_id: pid,
                status: 'pending'
            }))

            const { error } = await supabase
                .from('tournament_roster')
                .insert(records)

            if (error) throw error

            await fetchTournamentDetails()
            setIsAddingPlayer(false)
            setSelectedPlayerIds([])
        } catch (err) {
            console.error(err)
            alert("Error al agregar jugadores")
        } finally {
            setLoading(false)
        }
    }

    const handleAddToRoster = async (playerId) => {
        try {
            const { error } = await supabase
                .from('tournament_roster')
                .insert({
                    tournament_id: id,
                    player_id: playerId,
                    status: 'pending'
                })
            if (error) throw error
            fetchTournamentDetails()
            setIsAddingPlayer(false)
        } catch (err) {
            alert("Error al agregar jugador")
        }
    }

    const handleRemoveFromRoster = async (rosterId) => {
        if (!confirm("¿Quitar jugador de la lista?")) return
        try {
            const { error } = await supabase.from('tournament_roster').delete().eq('id', rosterId)
            if (error) throw error
            fetchTournamentDetails()
        } catch (err) {
            alert("Error al eliminar")
        }
    }

    const handleUpdateStatus = async (rosterId, newStatus) => {
        try {
            const { error } = await supabase
                .from('tournament_roster')
                .update({ status: newStatus })
                .eq('id', rosterId)
            if (error) throw error
            // Optimistic update
            setRoster(prev => prev.map(r => r.id === rosterId ? { ...r, status: newStatus } : r))
        } catch (err) {
            console.error(err)
        }
    }

    // --- Schedule CRUD ---
    const handleAddMatch = async () => {
        if (!newMatch.match_date || !newMatch.opponent.trim()) {
            alert('El rival y la fecha son obligatorios.')
            return
        }
        try {
            const { error } = await supabase
                .from('tournament_schedule')
                .insert({
                    tournament_id: id,
                    match_date: newMatch.match_date,
                    match_time: newMatch.match_time || null,
                    opponent: newMatch.opponent.trim(),
                    venue: newMatch.venue.trim() || null,
                    phase: newMatch.phase || 'Fase de grupos',
                    notes: newMatch.notes.trim() || null,
                    status: 'scheduled'
                })
            if (error) throw error
            setNewMatch(emptyMatchForm())
            setIsAddingMatch(false)
            fetchTournamentDetails()
        } catch (err) {
            alert('Error al agregar partido: ' + err.message)
        }
    }

    const handleDeleteMatch = async (matchId) => {
        if (!confirm('¿Quitar este partido del calendario?')) return
        try {
            const { error } = await supabase.from('tournament_schedule').delete().eq('id', matchId)
            if (error) throw error
            setSchedule(prev => prev.filter(m => m.id !== matchId))
        } catch (err) {
            alert('Error al eliminar partido')
        }
    }

    const handleSaveScore = async () => {
        if (!scoreModal) return
        setSavingScore(true)
        try {
            const { error } = await supabase
                .from('tournament_schedule')
                .update({
                    our_score: parseInt(scoreModal.our_score) || 0,
                    opponent_score: parseInt(scoreModal.opponent_score) || 0,
                    status: 'completed'
                })
                .eq('id', scoreModal.id)
            if (error) throw error
            setSchedule(prev => prev.map(m =>
                m.id === scoreModal.id
                    ? { ...m, our_score: parseInt(scoreModal.our_score) || 0, opponent_score: parseInt(scoreModal.opponent_score) || 0, status: 'completed' }
                    : m
            ))
            setScoreModal(null)
        } catch (err) {
            alert('Error al guardar resultado')
        } finally {
            setSavingScore(false)
        }
    }

    // --- Render Helpers ---
    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
    if (!tournament) return null

    // Financial Summary
    const totalExpected = roster.length * (tournament.cost_per_player || 0)
    const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    const pendingAmount = totalExpected - totalCollected

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/tournaments')} className="p-2 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{tournament.name}</h1>
                    <p className="text-slate-500 text-sm flex gap-2 items-center">
                        <MapPin size={14} /> {tournament.location}
                        <span>•</span>
                        <Calendar size={14} /> {new Date(tournament.start_date).toLocaleDateString()}
                    </p>
                </div>
                <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tournament.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {tournament.status === 'confirmed' ? 'Confirmado' : 'Planificado'}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'roster' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={16} /> Convocatoria ({roster.length})
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'schedule' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <CalendarDays size={16} /> Calendario ({schedule.length})
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <DollarSign size={16} /> Finanzas
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Settings size={16} /> Detalles
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">

                {/* SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Partidos del Torneo</h3>
                            {canManage && (
                                <button
                                    onClick={() => { setIsAddingMatch(true); setNewMatch(emptyMatchForm()) }}
                                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors"
                                >
                                    <Plus size={16} /> Agregar Partido
                                </button>
                            )}
                        </div>

                        {/* Formulario inline para nuevo partido */}
                        {isAddingMatch && (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 space-y-3 animate-in zoom-in-95">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Swords size={13} /> Nuevo Partido</h4>
                                    <button onClick={() => setIsAddingMatch(false)}><XCircle size={16} className="text-slate-400 hover:text-slate-600" /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Rival *</label>
                                        <input type="text" value={newMatch.opponent} onChange={e => setNewMatch({...newMatch, opponent: e.target.value})}
                                            className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="Nombre del rival" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Fase</label>
                                        <select value={newMatch.phase} onChange={e => setNewMatch({...newMatch, phase: e.target.value})}
                                            className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20">
                                            {SCHEDULE_PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Fecha *</label>
                                        <input type="date" value={newMatch.match_date} min={tournament.start_date} max={tournament.end_date}
                                            onChange={e => setNewMatch({...newMatch, match_date: e.target.value})}
                                            className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Hora</label>
                                        <input type="time" value={newMatch.match_time} onChange={e => setNewMatch({...newMatch, match_time: e.target.value})}
                                            className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Cancha</label>
                                        <input type="text" value={newMatch.venue} onChange={e => setNewMatch({...newMatch, venue: e.target.value})}
                                            className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="Coliseo Norte" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Notas</label>
                                    <input type="text" value={newMatch.notes} onChange={e => setNewMatch({...newMatch, notes: e.target.value})}
                                        className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="Observaciones opcionales" />
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleAddMatch}
                                        className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors flex items-center gap-2">
                                        <Save size={15} /> Guardar Partido
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista de partidos */}
                        {schedule.length === 0 && !isAddingMatch ? (
                            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
                                <CalendarDays size={40} className="mx-auto mb-3 text-slate-200" />
                                <p className="text-slate-400 font-medium">No hay partidos en el calendario.</p>
                                {canManage && <p className="text-slate-300 text-sm mt-1">Usa el botón "Agregar Partido" para comenzar.</p>}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {schedule.map(match => {
                                    const isCompleted = match.status === 'completed'
                                    const isWin = isCompleted && match.our_score > match.opponent_score
                                    const isLoss = isCompleted && match.our_score < match.opponent_score
                                    const isTie = isCompleted && match.our_score === match.opponent_score
                                    return (
                                        <div key={match.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                            isCompleted && isWin ? 'border-green-200' :
                                            isCompleted && isLoss ? 'border-red-200' :
                                            isCompleted && isTie ? 'border-slate-200' :
                                            'border-slate-100'
                                        }`}>
                                            {/* Left accent bar */}
                                            <div className={`flex`}>
                                                <div className={`w-1 shrink-0 ${
                                                    isCompleted && isWin ? 'bg-green-400' :
                                                    isCompleted && isLoss ? 'bg-red-400' :
                                                    isCompleted && isTie ? 'bg-slate-400' :
                                                    'bg-blue-300'
                                                }`} />
                                                <div className="flex-1 p-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                                    isCompleted && isWin ? 'bg-green-100 text-green-700' :
                                                                    isCompleted && isLoss ? 'bg-red-100 text-red-700' :
                                                                    isCompleted && isTie ? 'bg-slate-100 text-slate-600' :
                                                                    'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                    {isCompleted && isWin ? '✓ Victoria' :
                                                                     isCompleted && isLoss ? '✗ Derrota' :
                                                                     isCompleted && isTie ? 'Empate' :
                                                                     'Programado'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">{match.phase}</span>
                                                            </div>
                                                            <p className="font-bold text-slate-800">vs {match.opponent}</p>
                                                            <div className="flex flex-wrap gap-3 mt-1.5">
                                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(match.match_date + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                </span>
                                                                {match.match_time && (
                                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                        <Clock size={12} /> {match.match_time.slice(0,5)}
                                                                    </span>
                                                                )}
                                                                {match.venue && (
                                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                        <MapPin size={12} /> {match.venue}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {match.notes && <p className="text-xs text-slate-400 mt-1 italic">{match.notes}</p>}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {/* Resultado */}
                                                            {isCompleted ? (
                                                                <div className={`text-center px-3 py-1 rounded-xl font-black text-lg ${
                                                                    isWin ? 'bg-green-50 text-green-700' :
                                                                    isLoss ? 'bg-red-50 text-red-600' :
                                                                    'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {match.our_score} - {match.opponent_score}
                                                                </div>
                                                            ) : canManage ? (
                                                                <button
                                                                    onClick={() => setScoreModal({ id: match.id, our_score: '', opponent_score: '' })}
                                                                    className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                                                                >
                                                                    Registrar Resultado
                                                                </button>
                                                            ) : null}

                                                            {/* Eliminar */}
                                                            {canManage && (
                                                                <button onClick={() => handleDeleteMatch(match.id)}
                                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Mini modal para registrar resultado */}
                        {scoreModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Flag size={18} className="text-primary" /> Registrar Resultado</h3>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nos. (Sets ganados)</label>
                                            <input type="number" min="0" max="3"
                                                value={scoreModal.our_score}
                                                onChange={e => setScoreModal({...scoreModal, our_score: e.target.value})}
                                                className="w-full p-3 text-3xl font-black text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <span className="text-2xl font-black text-slate-300 mt-4">-</span>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Rival</label>
                                            <input type="number" min="0" max="3"
                                                value={scoreModal.opponent_score}
                                                onChange={e => setScoreModal({...scoreModal, opponent_score: e.target.value})}
                                                className="w-full p-3 text-3xl font-black text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setScoreModal(null)}
                                            className="flex-1 py-2 text-slate-500 font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                            Cancelar
                                        </button>
                                        <button onClick={handleSaveScore} disabled={savingScore}
                                            className="flex-1 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60">
                                            {savingScore ? '...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ROSTER TAB */}
                {activeTab === 'roster' && (
                    <div className="space-y-4">

                        {/* Status counters */}
                        {roster.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-xl text-sm">
                                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                    <span className="font-bold text-yellow-700">{roster.filter(r => r.status === 'pending').length}</span>
                                    <span className="text-yellow-600">pendientes</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl text-sm">
                                    <CheckCircle size={14} className="text-green-500" />
                                    <span className="font-bold text-green-700">{roster.filter(r => r.status === 'confirmed').length}</span>
                                    <span className="text-green-600">confirmadas</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-sm">
                                    <XCircle size={14} className="text-red-400" />
                                    <span className="font-bold text-red-700">{roster.filter(r => r.status === 'declined').length}</span>
                                    <span className="text-red-500">no viajan</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-between items-center gap-2">
                            <h3 className="font-bold text-slate-700">Lista de Convocadas</h3>
                            {canManage && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsNewPlayerModalOpen(true)}
                                        className="border border-primary text-primary px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/5 transition-colors"
                                    >
                                        <UserPlus size={15} /> Nueva Jugadora
                                    </button>
                                    <button
                                        onClick={() => setIsAddingPlayer(true)}
                                        className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors"
                                    >
                                        <Plus size={16} /> Agregar Existente
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Add Player Area */}
                        {isAddingPlayer && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 animate-in zoom-in-95">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Seleccionar Jugadores</h4>
                                    <button onClick={() => setIsAddingPlayer(false)}><XCircle size={16} className="text-slate-400 hover:text-slate-600" /></button>
                                </div>

                                {/* Filters & Actions */}
                                <div className="flex flex-wrap gap-3 mb-4">
                                    <select
                                        className="text-sm border-slate-200 rounded-lg px-3 py-2 bg-white"
                                        onChange={(e) => setSelectedTeamFilter(e.target.value)}
                                    >
                                        <option value="all">Todos los Equipos</option>
                                        {[...new Set(allPlayers.map(p => p.teams?.nombre))].filter(Boolean).sort().map(teamName => (
                                            <option key={teamName} value={teamName}>{teamName}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleSelectAll}
                                        className="text-sm text-slate-600 font-medium hover:text-primary px-2"
                                    >
                                        {selectedPlayerIds.length === filteredAvailablePlayers.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                    </button>

                                    <button
                                        onClick={handleBulkAdd}
                                        disabled={selectedPlayerIds.length === 0}
                                        className="ml-auto bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
                                    >
                                        Agregar ({selectedPlayerIds.length})
                                    </button>
                                </div>

                                {/* Player Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                    {filteredAvailablePlayers.length === 0 ? (
                                        <p className="col-span-full text-center text-slate-400 text-sm py-4">No hay jugadores disponibles con este filtro.</p>
                                    ) : (
                                        filteredAvailablePlayers.map(p => (
                                            <label
                                                key={p.id}
                                                className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-all ${selectedPlayerIds.includes(p.id)
                                                    ? 'bg-primary/5 border-primary shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                    checked={selectedPlayerIds.includes(p.id)}
                                                    onChange={() => togglePlayerSelection(p.id)}
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">{p.first_name} {p.last_name}</p>
                                                    <p className="text-xs text-slate-400">{p.position} • {p.teams?.nombre || 'Sin Equipo'}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Roster List */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Jugadora</th>
                                        <th className="px-4 py-3 hidden sm:table-cell">Posición</th>
                                        <th className="px-4 py-3">Estado</th>
                                        {canManage && <th className="px-4 py-3 text-right">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {roster.map(r => {
                                        const waLink = buildWALink(r.players)
                                        return (
                                        <tr key={r.id} className={`transition-colors ${
                                            r.status === 'declined' ? 'bg-red-50/50 hover:bg-red-50' :
                                            r.status === 'confirmed' ? 'hover:bg-green-50/30' :
                                            'hover:bg-slate-50/50'
                                        }`}>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-800 text-sm">{r.players.first_name} {r.players.last_name}</p>
                                                <p className="text-xs text-slate-400">{r.players.teams?.nombre}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{r.players.position}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                                                    r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    r.status === 'declined'  ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {r.status === 'confirmed' && <CheckCircle size={10} />}
                                                    {r.status === 'declined'  && <XCircle size={10} />}
                                                    {r.status === 'pending'   && '⏳'}
                                                    {r.status === 'confirmed' ? 'Confirmada' : r.status === 'declined' ? 'No Viaja' : 'Pendiente'}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* WhatsApp button (only if phone exists) */}
                                                        {waLink && (
                                                            <a
                                                                href={waLink}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title="Enviar convocatoria por WhatsApp"
                                                                className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                                                            >
                                                                <MessageCircle size={15} />
                                                            </a>
                                                        )}
                                                        {/* Confirm button */}
                                                        {r.status !== 'confirmed' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(r.id, 'confirmed')}
                                                                title="Marcar como confirmada"
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                                            >
                                                                <CheckCircle size={15} />
                                                            </button>
                                                        )}
                                                        {/* Decline button */}
                                                        {r.status !== 'declined' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(r.id, 'declined')}
                                                                title="Marcar como no viaja"
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                                            >
                                                                <XCircle size={15} />
                                                            </button>
                                                        )}
                                                        {/* Remove from roster */}
                                                        <button
                                                            onClick={() => handleRemoveFromRoster(r.id)}
                                                            title="Quitar del torneo"
                                                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                        )
                                    })}
                                    {roster.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">
                                                No hay jugadoras convocadas aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* PAYMENTS TAB */}
                {activeTab === 'payments' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Costo Total (Est.)</p>
                                <p className="text-2xl font-bold text-slate-800">${totalExpected.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Recaudado</p>
                                <p className="text-2xl font-bold text-green-600">${totalCollected.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Pendiente</p>
                                <p className="text-2xl font-bold text-red-500">${pendingAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Player Payments Table */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Estado de Cuenta por Jugador</h3>
                                <p className="text-xs text-slate-400">Costo Base: <strong>${tournament.cost_per_player}</strong></p>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Jugador</th>
                                        <th className="px-6 py-3 text-right">Pagado</th>
                                        <th className="px-6 py-3 text-right">Pendiente</th>
                                        <th className="px-6 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {roster.map(r => {
                                        const paid = payments.filter(p => p.player_id === r.player_id).reduce((sum, p) => sum + parseFloat(p.amount), 0)
                                        const pending = (tournament.cost_per_player || 0) - paid
                                        const isFullyPaid = pending <= 0

                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 font-medium text-slate-800">
                                                    {r.players.first_name} {r.players.last_name}
                                                </td>
                                                <td className="px-6 py-3 text-right font-bold text-green-600">
                                                    ${paid.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {isFullyPaid ? (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Pagado</span>
                                                    ) : (
                                                        <span className="font-bold text-red-500">${pending.toFixed(2)}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPlayerForPayment(r.players)
                                                            setIsPaymentModalOpen(true)
                                                        }}
                                                        className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                                                    >
                                                        Registrar Pago
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Recent Transactions */}
                        <div className="mt-8">
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Historial de Transacciones</h4>
                            <div className="space-y-2">
                                {payments.map(p => (
                                    <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-bold text-slate-700">{p.players?.first_name} {p.players?.last_name}</p>
                                            <p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString()} • {p.notes || 'Sin notas'}</p>
                                        </div>
                                        <span className="font-bold text-green-600">+${p.amount}</span>
                                    </div>
                                ))}
                                {payments.length === 0 && <p className="text-slate-400 text-sm italic">No hay pagos registrados.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800">Información del Evento</h3>
                            {canManage && (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditModalOpen(true)} className="text-sm font-bold text-primary hover:bg-slate-50 px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                                        <Edit2 size={16}/> Editar
                                    </button>
                                    <button onClick={handleDeleteTournament} className="text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                                        <Trash2 size={16}/> Eliminar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
                                <p className="text-slate-800 font-medium">{tournament.name}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ubicación</label>
                                <p className="text-slate-800 font-medium">{tournament.location}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fechas</label>
                                <p className="text-slate-800 font-medium">
                                    {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Costo por Jugador</label>
                                <p className="text-slate-800 font-medium">${tournament.cost_per_player}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estado</label>
                                <p className="text-slate-800 font-medium capitalize flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${tournament.status === 'confirmed' ? 'bg-green-500' : tournament.status === 'canceled' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                    {tournament.status === 'planned' ? 'Planificado' : tournament.status === 'confirmed' ? 'Confirmado' : tournament.status === 'canceled' ? 'Cancelado' : 'Finalizado'}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción</label>
                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{tournament.description || 'Sin descripción.'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <TournamentPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={fetchTournamentDetails}
                tournamentId={id}
                player={selectedPlayerForPayment}
            />
            <AddPlayerModal
                isOpen={isNewPlayerModalOpen}
                onClose={() => setIsNewPlayerModalOpen(false)}
                onPlayerAdded={handleNewPlayerCreated}
            />
            {/* Modal para editar */}
            <CreateTournamentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchTournamentDetails}
                clubId={club?.id}
                tournamentToEdit={tournament}
            />
        </div>
    )
}
