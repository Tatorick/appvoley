import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, Settings, Loader2, Save, Plus, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import TournamentPaymentModal from '../../components/Modals/TournamentPaymentModal'

export default function TournamentDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { club, role } = useClubData()
    const [loading, setLoading] = useState(true)
    const [tournament, setTournament] = useState(null)
    const [activeTab, setActiveTab] = useState('roster') // 'general', 'roster', 'payments'

    // Roster Data
    const [roster, setRoster] = useState([])
    const [allPlayers, setAllPlayers] = useState([])
    const [isAddingPlayer, setIsAddingPlayer] = useState(false)

    // Payments Data
    const [payments, setPayments] = useState([])
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedPlayerForPayment, setSelectedPlayerForPayment] = useState(null)

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
            console.error(err)
            // navigate('/app/tournaments') // Don't redirect on error, let user see it
        } finally {
            setLoading(false)
        }
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
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'roster' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={16} /> Convocatoria ({roster.length})
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <DollarSign size={16} /> Finanzas
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Settings size={16} /> Detalles
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">

                {/* ROSTER TAB */}
                {activeTab === 'roster' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Lista de Jugadores</h3>
                            {canManage && (
                                <button
                                    onClick={() => setIsAddingPlayer(true)}
                                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors"
                                >
                                    <Plus size={16} /> Agregar Jugador
                                </button>
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
                                        <th className="px-6 py-3">Jugador</th>
                                        <th className="px-6 py-3">Posición</th>
                                        <th className="px-6 py-3">Estado</th>
                                        {canManage && <th className="px-6 py-3 text-right">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {roster.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3">
                                                <p className="font-bold text-slate-800">{r.players.first_name} {r.players.last_name}</p>
                                                <p className="text-xs text-slate-400">{r.players.teams?.nombre}</p>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-slate-600">{r.players.position}</td>
                                            <td className="px-6 py-3">
                                                <select
                                                    disabled={!canManage}
                                                    value={r.status}
                                                    onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                                                    className={`text-xs font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        r.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}
                                                >
                                                    <option value="pending">Pendiente</option>
                                                    <option value="confirmed">Confirmado</option>
                                                    <option value="declined">No Viaja</option>
                                                </select>
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-3 text-right">
                                                    <button onClick={() => handleRemoveFromRoster(r.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {roster.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">
                                                No hay jugadores convocados aún.
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
                        <h3 className="font-bold text-slate-800 mb-4">Información del Evento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
    )
}
