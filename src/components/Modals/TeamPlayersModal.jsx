import React, { useEffect, useState } from 'react'
import { X, Loader2, Edit2, Trash2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function TeamPlayersModal({ isOpen, onClose, team, onPlayerRemoved }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && team) {
            fetchPlayers()
        } else {
            setPlayers([])
        }
    }, [isOpen, team])

    const fetchPlayers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('team_assignments')
                .select(`
                    id,
                    players (
                        id,
                        first_name,
                        last_name,
                        position,
                        jersey_number,
                        dni
                    )
                `)
                .eq('team_id', team.id)
            
            if (error) throw error

            // Map and sort alphabetically by last name
            const mappedPlayers = data
                .filter(a => a.players) // ensure player exists
                .map(a => a.players)
                .sort((a, b) => a.last_name.localeCompare(b.last_name))

            setPlayers(mappedPlayers)
        } catch (err) {
            console.error('Error fetching team players:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRemovePlayer = async (player) => {
        if (!confirm(`¿Estás seguro de eliminar a ${player.first_name} ${player.last_name} de este equipo?`)) return

        try {
            const { error } = await supabase
                .from('team_assignments')
                .delete()
                .match({ team_id: team.id, player_id: player.id })

            if (error) throw error
            
            // Remove from local state
            setPlayers(prev => prev.filter(p => p.id !== player.id))
            
            // Notify parent to update team count
            if (onPlayerRemoved) onPlayerRemoved()

        } catch (err) {
            alert('Error al remover jugador del equipo: ' + err.message)
        }
    }

    const handleEditPlayer = (playerId) => {
        onClose()
        navigate(`/app/players/${playerId}`)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
            <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Users className="text-primary" size={24} />
                            Plantilla: {team?.nombre}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {players.length} {players.length === 1 ? 'jugador' : 'jugadores'} asignados a este equipo
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-primary">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="text-sm text-slate-500 font-medium">Cargando jugadores...</p>
                        </div>
                    ) : players.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-2">No hay jugadores</h3>
                            <p className="text-slate-500 text-sm">Este equipo aún no tiene jugadores asignados.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                        <th className="px-6 py-3">Jugador</th>
                                        <th className="px-6 py-3 text-center">Dorsal</th>
                                        <th className="px-6 py-3">Posición</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {players.map((player) => (
                                        <tr key={player.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                        {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{player.last_name} {player.first_name}</p>
                                                        {player.dni && <p className="text-xs text-slate-500">DNI: {player.dni}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {player.jersey_number ? (
                                                    <span className="inline-flex w-7 h-7 items-center justify-center bg-slate-100 rounded-full font-bold text-slate-700 text-xs">
                                                        {player.jersey_number}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                {player.position ? (
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        {player.position}
                                                    </span>
                                                ) : <span className="text-slate-400 text-xs">-</span>}
                                            </td>
                                            <td className="px-6 py-3 text-right w-28">
                                                <div className="relative flex items-center justify-end h-8">
                                                    <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                        <button
                                                            onClick={() => handleEditPlayer(player.id)}
                                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                            title="Editar Jugador"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemovePlayer(player)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar del Equipo"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="absolute right-0 flex items-center opacity-100 group-hover:opacity-0 transition-opacity text-slate-300">
                                                        <span className="text-2xl leading-none px-2">&middot;&middot;&middot;</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
