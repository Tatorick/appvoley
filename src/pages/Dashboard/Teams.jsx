import React, { useEffect, useState } from 'react'
import { Plus, Users, Trash2, Shield, Edit2, Lock, Loader2 } from 'lucide-react' // Added Lock
import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext' // Unused
import CreateTeamModal from '../../components/Modals/CreateTeamModal'
import { useClubData } from '../../hooks/useClubData' // Import Hook

export default function Teams() {
    // const { user } = useAuth() // Unused

    // Use Hook
    const { club, role, loading: clubLoading } = useClubData()

    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [teamToEdit, setTeamToEdit] = useState(null)

    // Permissions
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

if (clubLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => (
                    <div key={team.id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">

                        {/* Header with Icon and Actions */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 text-primary rounded-xl flex items-center justify-center font-bold text-xl">
                                {team.nombre.substring(0, 1).toUpperCase()}
                            </div>

                            {canEdit ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(team)}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                                        title="Editar equipo"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar equipo"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="p-2 text-slate-300">
                                    <Lock size={16} />
                                </div>
                            )}
                        </div>

                        {/* Team Info */}
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{team.nombre}</h3>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                <Shield size={12} /> {team.categories?.nombre || 'Sin Categoría'}
                            </span>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide 
                            ${team.genero === 'Femenino' ? 'bg-pink-100 text-pink-600' :
                                    team.genero === 'Masculino' ? 'bg-blue-100 text-blue-600' :
                                        'bg-purple-100 text-purple-600'}`
                            }>
                                {team.genero || 'Mixto'}
                            </span>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Users size={16} />
                                <span>{team.player_count} Jugadores</span>
                            </div>
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
