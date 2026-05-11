import React, { useEffect, useState } from 'react'
import { Plus, Users, Trash2, Shield, Edit2, Lock, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import CreateTeamModal from '../../components/Modals/CreateTeamModal'
import { useClubData } from '../../hooks/useClubData'
import { useNavigate } from 'react-router-dom'

export default function Teams() {
    const { club, role, loading: clubLoading } = useClubData()
    const navigate = useNavigate()

    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [teamToEdit, setTeamToEdit] = useState(null)
    
    // Inline Players State
    const [expandedTeamId, setExpandedTeamId] = useState(null)
    const [teamPlayers, setTeamPlayers] = useState({})
    const [loadingPlayers, setLoadingPlayers] = useState({})

    const canEdit = role === 'owner' || role === 'admin' || role === 'coach' || role === 'assistant'

    const fetchTeams = async () => {
        if (!club) return
        setLoading(true)
        try {
            // 1. Fetch Teams
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select(`
                *,
                categories (nombre)
            `)
                .eq('club_id', club.id)
                .order('created_at', { ascending: false })

            if (teamsError) throw teamsError

            // 2. Fetch Player Counts (from team_assignments)
            const teamIds = teamsData?.map(t => t.id) || []
            let countsByTeam = {}

            if (teamIds.length > 0) {
                const { data: assignmentsData, error: assignmentsError } = await supabase
                    .from('team_assignments')
                    .select('team_id')
                    .in('team_id', teamIds)

                if (assignmentsError) throw assignmentsError

                assignmentsData?.forEach(a => {
                    if (a.team_id) {
                        countsByTeam[a.team_id] = (countsByTeam[a.team_id] || 0) + 1
                    }
                })
            }

            // Merge counts
            const teamsWithCount = teamsData?.map(team => ({
                ...team,
                player_count: countsByTeam[team.id] || 0
            })) || []

            setTeams(teamsWithCount)
        } catch (err) {
            console.error('Error fetching teams:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (club) fetchTeams()
    }, [club])

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este equipo?')) return;
        try {
            const { error } = await supabase.from('teams').delete().eq('id', id)
            if (error) throw error
            fetchTeams()
        } catch (err) {
            alert('Error eliminando: ' + err.message)
        }
    }

    const handleEdit = (team) => {
        setTeamToEdit(team)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setTeamToEdit(null)
    }

    const toggleTeam = async (teamId) => {
        if (expandedTeamId === teamId) {
            setExpandedTeamId(null)
            return
        }
        
        setExpandedTeamId(teamId)
        
        // Fetch players if not already fetched
        if (!teamPlayers[teamId]) {
            setLoadingPlayers(prev => ({...prev, [teamId]: true}))
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
                    .eq('team_id', teamId)
                
                if (error) throw error

                const mappedPlayers = data
                    .filter(a => a.players)
                    .map(a => a.players)
                    .sort((a, b) => a.last_name.localeCompare(b.last_name))

                setTeamPlayers(prev => ({...prev, [teamId]: mappedPlayers}))
            } catch (err) {
                console.error('Error fetching team players:', err)
            } finally {
                setLoadingPlayers(prev => ({...prev, [teamId]: false}))
            }
        }
    }

    const handleRemovePlayer = async (teamId, player) => {
        if (!confirm(`¿Estás seguro de eliminar a ${player.first_name} ${player.last_name} de este equipo?`)) return

        try {
            const { error } = await supabase
                .from('team_assignments')
                .delete()
                .match({ team_id: teamId, player_id: player.id })

            if (error) throw error
            
            // Update local state
            setTeamPlayers(prev => ({
                ...prev,
                [teamId]: prev[teamId].filter(p => p.id !== player.id)
            }))
            
            // Update team count
            setTeams(prevTeams => prevTeams.map(t => 
                t.id === teamId ? { ...t, player_count: t.player_count - 1 } : t
            ))

        } catch (err) {
            alert('Error al remover jugador del equipo: ' + err.message)
        }
    }

    if (clubLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
    if (!club) return <div className="p-10 text-center text-slate-400">No se encontró un club asociado a tu cuenta.</div>

    // Group teams by gender
    const femTeams = teams.filter(t => t.genero === 'Femenino')
    const mascTeams = teams.filter(t => t.genero === 'Masculino')
    const mixTeams = teams.filter(t => t.genero === 'Mixto' || !t.genero)

    const sections = [
        { title: 'Femenino', emoji: '🩷', teams: femTeams, badgeColor: 'bg-pink-100 text-pink-600', styles: {
            bgHeader: 'bg-rose-100', textHeader: 'text-rose-600', textTitle: 'text-rose-900', borderBottom: 'border-rose-200', badgeBg: 'bg-rose-50', badgeBorder: 'border-rose-100', activeBorder: 'border-rose-300', activeRing: 'ring-rose-100'
        }},
        { title: 'Masculino', emoji: '💙', teams: mascTeams, badgeColor: 'bg-blue-100 text-blue-600', styles: {
            bgHeader: 'bg-sky-100', textHeader: 'text-sky-600', textTitle: 'text-sky-900', borderBottom: 'border-sky-200', badgeBg: 'bg-sky-50', badgeBorder: 'border-sky-100', activeBorder: 'border-sky-300', activeRing: 'ring-sky-100'
        }},
        { title: 'Mixto', emoji: '💜', teams: mixTeams, badgeColor: 'bg-purple-100 text-purple-600', styles: {
            bgHeader: 'bg-violet-100', textHeader: 'text-violet-600', textTitle: 'text-violet-900', borderBottom: 'border-violet-200', badgeBg: 'bg-violet-50', badgeBorder: 'border-violet-100', activeBorder: 'border-violet-300', activeRing: 'ring-violet-100'
        }}
    ].filter(s => s.teams.length > 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mis Equipos</h1>
                    <p className="text-slate-500">Gestiona las categorías y plantillas de tu club</p>
                </div>

                {/* Permission Check for Create Button */}
                {canEdit && (
                    <button
                        onClick={() => { setTeamToEdit(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Nuevo Equipo
                    </button>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-slate-100 rounded-2xl"></div>
                    ))}
                </div>
            ) : teams.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Shield size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Aún no tienes equipos</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">Crea tu primer equipo para empezar a agregar jugadores y gestionar partidos.</p>
                    {canEdit && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-primary font-semibold hover:underline"
                        >
                            Crear Equipo
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {sections.map((section) => (
                        <div key={section.title} className="space-y-4">
                            {/* Section Header */}
                            <div className={`flex items-center gap-2 pb-2 border-b-2 ${section.styles.borderBottom}`}>
                                <div className={`w-8 h-8 rounded-lg ${section.styles.bgHeader} flex items-center justify-center ${section.styles.textHeader} font-bold`}>
                                    {section.emoji}
                                </div>
                                <h2 className={`text-xl font-bold ${section.styles.textTitle}`}>{section.title}</h2>
                                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${section.styles.badgeBg} ${section.styles.textHeader} border ${section.styles.badgeBorder}`}>
                                    {section.teams.length} {section.teams.length === 1 ? 'equipo' : 'equipos'}
                                </span>
                            </div>

                            {/* Teams Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {section.teams.map(team => {
                                    const isExpanded = expandedTeamId === team.id
                                    const isLoading = loadingPlayers[team.id]
                                    const players = teamPlayers[team.id] || []

                                    return (
                                        <div key={team.id} 
                                            className={`group bg-white rounded-2xl border transition-all relative overflow-hidden flex flex-col ${isExpanded ? `${section.styles.activeBorder} shadow-lg ring-1 ${section.styles.activeRing}` : 'border-slate-100 shadow-sm hover:shadow-md cursor-pointer hover:border-slate-300'}`}
                                            onClick={(e) => {
                                                // Prevent toggle if clicking action buttons
                                                if (!e.target.closest('button')) {
                                                    toggleTeam(team.id)
                                                }
                                            }}
                                        >
                                            <div className="p-6">
                                                {/* Header with Icon and Actions */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 text-primary rounded-xl flex items-center justify-center font-bold text-xl">
                                                        {team.nombre.substring(0, 1).toUpperCase()}
                                                    </div>

                                                    <div className="flex gap-2 relative z-10">
                                                        {canEdit ? (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEdit(team); }}
                                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                                                                    title="Editar equipo"
                                                                >
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(team.id); }}
                                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Eliminar equipo"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="p-2 text-slate-300">
                                                                <Lock size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Team Info */}
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">{team.nombre}</h3>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                        <Shield size={12} /> {team.categories?.nombre || 'Sin Categoría'}
                                                    </span>
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide ${section.badgeColor}`}>
                                                        {team.genero || 'Mixto'}
                                                    </span>
                                                </div>

                                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-sm text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users size={16} />
                                                        <span>{team.player_count} Jugadores</span>
                                                    </div>
                                                    <button className="text-slate-400 hover:text-primary font-medium hover:underline text-xs flex items-center gap-1">
                                                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Players Section */}
                                            {isExpanded && (
                                                <div className="border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2">
                                                    <div className="p-4 flex items-center justify-between">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase">Plantilla ({players.length})</h4>
                                                    </div>
                                                    
                                                    {isLoading ? (
                                                        <div className="flex flex-col items-center justify-center py-6 text-primary">
                                                            <Loader2 className="animate-spin mb-2" size={24} />
                                                            <p className="text-xs text-slate-500 font-medium">Cargando...</p>
                                                        </div>
                                                    ) : players.length === 0 ? (
                                                        <div className="text-center py-6 px-4">
                                                            <p className="text-slate-500 text-sm">Este equipo aún no tiene jugadores asignados.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto border-t border-slate-100">
                                                            <table className="w-full text-left">
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {players.map((player) => (
                                                                        <tr key={player.id} className="hover:bg-white transition-colors group">
                                                                            <td className="px-4 py-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                                                                                        {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{player.last_name} {player.first_name}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center w-10">
                                                                                {player.jersey_number ? (
                                                                                    <span className="inline-flex w-5 h-5 items-center justify-center bg-slate-100 rounded-full font-bold text-slate-700 text-[10px]">
                                                                                        {player.jersey_number}
                                                                                    </span>
                                                                                ) : <span className="text-slate-300 text-xs">-</span>}
                                                                            </td>
                                                                            <td className="px-2 py-2 w-16">
                                                                                {player.position ? (
                                                                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-wider block text-center truncate">
                                                                                        {player.position}
                                                                                    </span>
                                                                                ) : <span className="text-slate-400 text-xs text-center block">-</span>}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right w-16">
                                                                                <div className="flex items-center justify-end gap-1 relative z-10">
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); navigate(`/app/players/${player.id}`); }}
                                                                                        className="p-1 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                                                                                        title="Editar"
                                                                                    >
                                                                                        <Edit2 size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleRemovePlayer(team.id, player); }}
                                                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                        title="Eliminar"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateTeamModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onTeamCreated={fetchTeams}
                teamToEdit={teamToEdit}
            />

        </div>
    )
}
