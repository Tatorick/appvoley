import React, { useState, useEffect } from 'react'
import { Plus, Users, Filter, Loader2, Edit2, Trash2, Lock, FileSpreadsheet, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AddPlayerModal from '../../components/Modals/AddPlayerModal'
import BulkImportModal from '../../components/Modals/BulkImportModal'
import { useNavigate } from 'react-router-dom'
import { useClubData } from '../../hooks/useClubData'

export default function Players() {
  const navigate = useNavigate()
  
  // Use Hook instead of manual fetch logic parts
  const { club, role, loading: clubLoading } = useClubData()

  const [allPlayers, setAllPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters and Sort
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterPosition, setFilterPosition] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Permissions
  const canEdit = role === 'owner' || role === 'admin' || role === 'coach'

  // Fetch logic
  // Wrapped in useCallback to be stable for useEffect and child modal
  const fetchData = React.useCallback(async () => {
    if (!club) return // Wait for club
    setLoading(true)
    try {
        // 2. Fetch Teams for Filter
        const { data: teamsData } = await supabase.from('teams').select('id, nombre').eq('club_id', club.id)
        setTeams(teamsData || [])

        // 3. Fetch Players with Assignments
        let query = supabase
            .from('players')
            .select(`
                *, 
                team_assignments (
                    teams (id, nombre)
                )
            `)
            .eq('club_id', club.id)
            .order('last_name', { ascending: true })

        const { data: playersData, error } = await query
        if (error) throw error
        
        setAllPlayers(playersData || [])
    } catch (err) {
        console.error('Error fetching data:', err)
    } finally {
        setLoading(false)
    }
  }, [club])

  useEffect(() => {
    if (club) fetchData()
  }, [club, fetchData])

  // Helpers
  const calculateAge = (dob) => {
    if (!dob) return '-'
    // Append T00:00:00 to force local-time parsing (avoids UTC midnight offset shifting the date)
    const birthDate = new Date(dob + 'T00:00:00')
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  // Apply filters and sort
  let displayedPlayers = allPlayers.filter(p => {
    // Team Filter
    if (filterTeam !== 'all' && !p.team_assignments?.some(ta => ta.teams?.id === filterTeam)) return false
    // Position Filter
    if (filterPosition !== 'all' && p.position !== filterPosition) return false
    // Search Term
    if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        const dni = p.dni || ''
        if (!fullName.includes(term) && !dni.includes(term)) return false
    }
    return true
  })

  displayedPlayers.sort((a, b) => {
    if (sortConfig.key === 'name') {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()
        if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1
        if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    }
    if (sortConfig.key === 'position') {
        const posA = a.position || ''
        const posB = b.position || ''
        if (posA < posB) return sortConfig.direction === 'asc' ? -1 : 1
        if (posA > posB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    }
    if (sortConfig.key === 'age') {
        const ageA = calculateAge(a.dob) === '-' ? -1 : calculateAge(a.dob)
        const ageB = calculateAge(b.dob) === '-' ? -1 : calculateAge(b.dob)
        if (ageA < ageB) return sortConfig.direction === 'asc' ? -1 : 1
        if (ageA > ageB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    }
    if (sortConfig.key === 'height') {
        const hA = a.height || 0
        const hB = b.height || 0
        if (hA < hB) return sortConfig.direction === 'asc' ? -1 : 1
        if (hA > hB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    }
    return 0
  })

  const handleDeletePlayer = async (playerId) => {
      if (!confirm('¿Estás seguro de que quieres eliminar a este jugador? Esta acción no se puede deshacer y borrará todos sus datos.')) return

      try {
          const { error } = await supabase
              .from('players')
              .delete()
              .eq('id', playerId)
          
          if (error) throw error
          
          // Refresh
          fetchData()
      } catch (err) {
          console.error('Error deleting player:', err)
          alert('Error al eliminar jugador. Intenta de nuevo.')
      }
  }

  if (clubLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
  if (!club) return <div className="p-10 text-center text-slate-400">No se encontró un club asociado a tu cuenta.</div>

  return (
    <div className="space-y-6">
       
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jugadores</h1>
          <p className="text-slate-500">Administra el plantel de tu club.</p>
        </div>
        
        {/* Permission Check for Add Button */}
        {canEdit && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
              >
                <FileSpreadsheet size={18} className="text-emerald-600" />
                Importar Excel
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-primary/25"
              >
                <Plus size={20} />
                Nuevo Jugador
              </button>
            </div>
        )}
      </div>

        {/* Filters and Stats */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 shrink-0">
                <Users size={20} />
                <span className="font-semibold text-slate-700">{displayedPlayers.length}</span> <span className="text-sm hidden sm:inline">Jugadores mostrados</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o DNI..."
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-9 p-2.5 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter size={18} className="text-slate-400 shrink-0" />
                    <select 
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full sm:w-auto p-2.5 outline-none"
                        value={filterPosition}
                        onChange={(e) => setFilterPosition(e.target.value)}
                    >
                        <option value="all">Todas las Posiciones</option>
                        <option value="Punta">Punta</option>
                        <option value="Opuesto">Opuesto</option>
                        <option value="Central">Central</option>
                        <option value="Armador">Armador</option>
                        <option value="Libero">Libero</option>
                        <option value="Universal">Universal</option>
                    </select>
                    <select 
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full sm:w-auto p-2.5 outline-none"
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                    >
                        <option value="all">Todos los Equipos</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
                 <div className="p-12 flex justify-center text-primary"><Loader2 className="animate-spin" size={32}/></div>
            ) : displayedPlayers.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Aún no hay jugadores</h3>
                    <p className="text-slate-500 mb-6">Comienza agregando los integrantes de tus equipos.</p>
                    {canEdit && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="text-primary font-medium hover:underline"
                        >
                            + Agregar primer jugador
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Nombre Completo {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="text-slate-300"/>}</div>
                                </th>
                                <th className="px-6 py-4 text-center">Dorsal</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('position')}>
                                    <div className="flex items-center gap-1">Posición {sortConfig.key === 'position' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="text-slate-300"/>}</div>
                                </th>
                                <th className="px-6 py-4">Equipos</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('age')}>
                                    <div className="flex items-center gap-1">Edad {sortConfig.key === 'age' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="text-slate-300"/>}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('height')}>
                                    <div className="flex items-center gap-1">Altura {sortConfig.key === 'height' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="text-slate-300"/>}</div>
                                </th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayedPlayers.map((player) => (
                                <tr key={player.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{player.last_name} {player.first_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {player.jersey_number ? (
                                            <span className="inline-block w-8 h-8 leading-8 bg-slate-100 rounded-full font-bold text-slate-700 text-sm">
                                                {player.jersey_number}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {player.position ? (
                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold uppercase">
                                                {player.position}
                                            </span>
                                        ) : '-'}
                                    </td>
                                     <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex flex-wrap gap-1">
                                            {player.team_assignments && player.team_assignments.length > 0 ? (
                                                player.team_assignments.map((assignment, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 whitespace-nowrap">
                                                        {assignment.teams?.nombre || 'Equipo Eliminado'}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">Sin Equipo</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {calculateAge(player.dob)} años
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {player.height ? `${player.height} cm` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Permission Check for Actions */}
                                        {canEdit ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => navigate(`/app/players/${player.id}`)}
                                                    title="Editar jugador"
                                                    className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeletePlayer(player.id)}
                                                    title="Eliminar jugador"
                                                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               {/* Read Only Indicator */}
                                                <span className="text-slate-300 cursor-not-allowed" title="Solo lectura">
                                                    <Lock size={14} />
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <AddPlayerModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onPlayerAdded={fetchData}
        />
        <BulkImportModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            clubId={club?.id}
            onSuccess={fetchData}
        />
    </div>
  )
}
