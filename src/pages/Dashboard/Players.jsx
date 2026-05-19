import React, { useState, useEffect } from 'react'
import { Plus, Users, Filter, Loader2, Edit2, Trash2, Lock, FileSpreadsheet, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AddPlayerModal from '../../components/Modals/AddPlayerModal'
import BulkImportModal from '../../components/Modals/BulkImportModal'
import { useNavigate } from 'react-router-dom'
import { useClubData } from '../../hooks/useClubData'
import { getAvatarColor, getInitials } from '../../utils/imageCompress'

const POSITIONS = ['Punta', 'Opuesto', 'Central', 'Armador', 'Libero', 'Universal']

// ─── Avatar Component ────────────────────────────────────────────────────────
function PlayerAvatar({ player, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-sm'
  const initials = getInitials(player.first_name, player.last_name)
  const colorClass = getAvatarColor(`${player.first_name}${player.last_name}`)

  if (player.photo_url) {
    return (
      <img
        src={player.photo_url}
        alt={initials}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm shrink-0`}
      />
    )
  }
  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm shrink-0`}>
      {initials}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Players() {
  const navigate = useNavigate()
  const { club, role, loading: clubLoading } = useClubData()

  const [allPlayers, setAllPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters and Sort
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterPosition, setFilterPosition] = useState('all')
  const [filterGender, setFilterGender] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // ── Inline edit state ────────────────────────────────────────────────────────
  // editingCell: "playerId_field" | null
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  // flashCell: { "playerId_field": 'success' | 'error' | null }
  const [flashCell, setFlashCell] = useState({})
  const [editError, setEditError] = useState(null) // validation error message

  // Permissions
  const canEdit = role === 'owner' || role === 'admin' || role === 'coach' || role === 'assistant'

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    if (!club) return
    setLoading(true)
    try {
      const { data: teamsData } = await supabase.from('teams').select('id, nombre').eq('club_id', club.id)
      setTeams(teamsData || [])

      const { data: playersData, error } = await supabase
        .from('players')
        .select(`
          *,
          team_assignments (
            teams (id, nombre)
          )
        `)
        .eq('club_id', club.id)
        .order('last_name', { ascending: true })

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

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const calculateAge = (dob) => {
    if (!dob) return '-'
    const birthDate = new Date(dob + 'T00:00:00')
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  // ── Inline Edit ───────────────────────────────────────────────────────────────
  const startEditing = (playerId, field, currentValue) => {
    if (!canEdit) return
    setEditingCell(`${playerId}_${field}`)
    setEditValue(currentValue ?? '')
  }

  const flashResult = (playerId, field, type) => {
    const key = `${playerId}_${field}`
    setFlashCell(prev => ({ ...prev, [key]: type }))
    setTimeout(() => setFlashCell(prev => ({ ...prev, [key]: null })), type === 'success' ? 900 : 1500)
  }

  const handleInlineSave = async (playerId, field) => {
    setEditingCell(null)
    setEditError(null)

    // Map alias → DB column
    const dbField = field === 'dorsal' ? 'jersey_number' : field

    // Parse value based on field type
    let dbValue
    if (field === 'dorsal') {
      const parsed = parseInt(editValue, 10)
      dbValue = editValue === '' || isNaN(parsed) ? null : parsed
    } else {
      dbValue = editValue.trim() === '' ? null : editValue.trim()
    }

    // ── Dorsal uniqueness validation (per gender) ────────────────────────────
    if (field === 'dorsal' && dbValue !== null) {
      const thisPlayer = allPlayers.find(p => p.id === playerId)
      const conflict = allPlayers.find(p =>
        p.id !== playerId &&
        p.jersey_number === dbValue &&
        p.gender === thisPlayer?.gender
      )
      if (conflict) {
        const genderLabel = thisPlayer?.gender || 'ese género'
        setEditError(
          `El dorsal ${dbValue} ya está asignado a ${conflict.last_name} ${conflict.first_name} (${genderLabel}). Los dorsales deben ser únicos por rama.`
        )
        flashResult(playerId, field, 'error')
        setTimeout(() => setEditError(null), 5000)
        return
      }
    }

    // Optimistic update
    setAllPlayers(prev => prev.map(p =>
      p.id === playerId ? { ...p, [dbField]: dbValue } : p
    ))
    flashResult(playerId, field, 'success')

    try {
      const { error } = await supabase.from('players').update({ [dbField]: dbValue }).eq('id', playerId)
      if (error) throw error
    } catch (err) {
      console.error('Error saving inline:', err)
      flashResult(playerId, field, 'error')
    }
  }

  const handleInlineKeyDown = (e, playerId, field) => {
    if (e.key === 'Enter') handleInlineSave(playerId, field)
    if (e.key === 'Escape') setEditingCell(null)
  }

  // Position saves immediately on select change (no need to press Enter)
  const handlePositionChange = async (playerId, newPosition) => {
    setEditingCell(null)
    const dbValue = newPosition === '' ? null : newPosition

    setAllPlayers(prev => prev.map(p =>
      p.id === playerId ? { ...p, position: dbValue } : p
    ))
    flashResult(playerId, 'position', 'success')

    try {
      const { error } = await supabase.from('players').update({ position: dbValue }).eq('id', playerId)
      if (error) throw error
    } catch (err) {
      console.error('Error saving position:', err)
      flashResult(playerId, 'position', 'error')
    }
  }

  // Cell flash class
  const getCellFlash = (playerId, field) => {
    const v = flashCell[`${playerId}_${field}`]
    if (v === 'success') return 'bg-green-50'
    if (v === 'error') return 'bg-red-50'
    return ''
  }

  // ── Filters & Sort ────────────────────────────────────────────────────────────
  let displayedPlayers = allPlayers.filter(p => {
    if (filterTeam !== 'all' && !p.team_assignments?.some(ta => ta.teams?.id === filterTeam)) return false
    if (filterPosition !== 'all' && p.position !== filterPosition) return false
    if (filterGender !== 'all' && p.gender !== filterGender) return false
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
      const nA = `${a.last_name} ${a.first_name}`.toLowerCase()
      const nB = `${b.last_name} ${b.first_name}`.toLowerCase()
      return nA < nB ? (sortConfig.direction === 'asc' ? -1 : 1) : nA > nB ? (sortConfig.direction === 'asc' ? 1 : -1) : 0
    }
    if (sortConfig.key === 'dorsal') {
      // null dorsals go to the end
      const dA = a.jersey_number ?? (sortConfig.direction === 'asc' ? Infinity : -Infinity)
      const dB = b.jersey_number ?? (sortConfig.direction === 'asc' ? Infinity : -Infinity)
      return dA < dB ? (sortConfig.direction === 'asc' ? -1 : 1) : dA > dB ? (sortConfig.direction === 'asc' ? 1 : -1) : 0
    }
    if (sortConfig.key === 'position') {
      const pA = a.position || '', pB = b.position || ''
      return pA < pB ? (sortConfig.direction === 'asc' ? -1 : 1) : pA > pB ? (sortConfig.direction === 'asc' ? 1 : -1) : 0
    }
    if (sortConfig.key === 'age') {
      const aA = calculateAge(a.dob) === '-' ? -1 : calculateAge(a.dob)
      const aB = calculateAge(b.dob) === '-' ? -1 : calculateAge(b.dob)
      return aA < aB ? (sortConfig.direction === 'asc' ? -1 : 1) : aA > aB ? (sortConfig.direction === 'asc' ? 1 : -1) : 0
    }
    return 0
  })

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeletePlayer = async (playerId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar a este jugador? Esta acción no se puede deshacer y borrará todos sus datos.')) return
    try {
      const { error } = await supabase.from('players').delete().eq('id', playerId)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Error deleting player:', err)
      alert('Error al eliminar jugador. Intenta de nuevo.')
    }
  }

  if (clubLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
  if (!club) return <div className="p-10 text-center text-slate-400">No se encontró un club asociado a tu cuenta.</div>

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jugadores</h1>
          <p className="text-slate-500">Administra el plantel de tu club.</p>
        </div>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 shrink-0">
          <Users size={20} />
          <span className="font-semibold text-slate-700">{displayedPlayers.length}</span>
          <span className="text-sm hidden sm:inline">Jugadores mostrados</span>
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
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="all">Todas las Ramas</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </select>
            <select
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full sm:w-auto p-2.5 outline-none"
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
            >
              <option value="all">Todas las Posiciones</option>
              {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
            <select
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full sm:w-auto p-2.5 outline-none"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="all">Todos los Equipos</option>
              {teams.map(team => <option key={team.id} value={team.id}>{team.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-primary"><Loader2 className="animate-spin" size={32} /></div>
        ) : displayedPlayers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Aún no hay jugadores</h3>
            <p className="text-slate-500 mb-6">Comienza agregando los integrantes de tus equipos.</p>
            {canEdit && (
              <button onClick={() => setIsModalOpen(true)} className="text-primary font-medium hover:underline">
                + Agregar primer jugador
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Hint bar */}
            {canEdit && (
              <div className="flex items-center gap-1.5 px-6 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-400">
                <span>💡</span>
                <span><strong>Doble clic</strong> en Dorsal o Cédula para editar · <strong>Clic</strong> en Posición para cambiarla</span>
              </div>
            )}
            {/* Dorsal validation error banner */}
            {editError && (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-700 animate-in slide-in-from-top-1">
                <span>⚠️</span>
                <span>{editError}</span>
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Nombre Completo
                      {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="text-slate-300" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort('dorsal')}>
                    <div className="flex items-center justify-center gap-1">
                      Dorsal
                      {sortConfig.key === 'dorsal' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="text-slate-300" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('position')}>
                    <div className="flex items-center gap-1">
                      Posición
                      {sortConfig.key === 'position' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="text-slate-300" />}
                    </div>
                  </th>
                  <th className="px-6 py-4">Equipos</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('age')}>
                    <div className="flex items-center gap-1">
                      Edad
                      {sortConfig.key === 'age' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="text-slate-300" />}
                    </div>
                  </th>
                  <th className="px-6 py-4">Cédula</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedPlayers.map((player) => {
                  const isEditingDorsal   = editingCell === `${player.id}_dorsal`
                  const isEditingPosition = editingCell === `${player.id}_position`
                  const isEditingDni      = editingCell === `${player.id}_dni`

                  return (
                    <tr key={player.id} className="hover:bg-slate-50/50 transition-colors group">

                      {/* Nombre */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar player={player} />
                          <span className="font-bold text-slate-900">{player.last_name} {player.first_name}</span>
                        </div>
                      </td>

                      {/* Dorsal — doble clic */}
                      <td className={`px-6 py-3 text-center transition-colors ${getCellFlash(player.id, 'dorsal')}`}>
                        {isEditingDorsal ? (
                          <input
                            autoFocus
                            type="number"
                            min="0"
                            max="99"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleInlineSave(player.id, 'dorsal')}
                            onKeyDown={e => handleInlineKeyDown(e, player.id, 'dorsal')}
                            className="w-14 text-center p-1 border-2 border-primary rounded-lg text-sm font-bold text-slate-700 outline-none bg-white shadow-sm"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => canEdit && startEditing(player.id, 'dorsal', player.jersey_number)}
                            title={canEdit ? 'Doble clic para editar' : ''}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all
                              ${player.jersey_number ? 'bg-slate-100 text-slate-700' : 'text-slate-300'}
                              ${canEdit ? 'cursor-pointer group-hover:ring-2 group-hover:ring-primary/20 group-hover:bg-slate-100' : ''}
                            `}
                          >
                            {player.jersey_number ?? '-'}
                          </span>
                        )}
                      </td>

                      {/* Posición — clic simple */}
                      <td className={`px-6 py-3 transition-colors ${getCellFlash(player.id, 'position')}`}>
                        {isEditingPosition ? (
                          <select
                            autoFocus
                            defaultValue={player.position || ''}
                            onChange={e => handlePositionChange(player.id, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={e => e.key === 'Escape' && setEditingCell(null)}
                            className="px-2 py-1 border-2 border-primary rounded-lg text-xs font-bold uppercase outline-none bg-white shadow-sm text-slate-700"
                          >
                            <option value="">Sin posición</option>
                            {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                          </select>
                        ) : (
                          <span
                            onClick={() => canEdit && startEditing(player.id, 'position', player.position)}
                            title={canEdit ? 'Clic para cambiar posición' : ''}
                            className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase transition-all
                              ${player.position ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}
                              ${canEdit ? 'cursor-pointer hover:ring-2 hover:ring-blue-200 hover:bg-blue-100' : ''}
                            `}
                          >
                            {player.position || '-'}
                          </span>
                        )}
                      </td>

                      {/* Equipos */}
                      <td className="px-6 py-3 text-sm text-slate-600">
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

                      {/* Edad */}
                      <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {calculateAge(player.dob)} años
                      </td>

                      {/* Cédula — doble clic */}
                      <td className={`px-6 py-3 text-sm transition-colors ${getCellFlash(player.id, 'dni')}`}>
                        {isEditingDni ? (
                          <input
                            autoFocus
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleInlineSave(player.id, 'dni')}
                            onKeyDown={e => handleInlineKeyDown(e, player.id, 'dni')}
                            className="w-32 p-1 border-2 border-primary rounded-lg text-sm text-slate-700 outline-none bg-white shadow-sm font-mono"
                            placeholder="Cédula..."
                          />
                        ) : (
                          <span
                            onDoubleClick={() => canEdit && startEditing(player.id, 'dni', player.dni)}
                            title={canEdit ? 'Doble clic para editar' : ''}
                            className={`rounded px-1 py-0.5 -mx-1 transition-all
                              ${player.dni ? 'text-slate-600 font-mono' : 'text-slate-300'}
                              ${canEdit ? 'cursor-pointer group-hover:bg-slate-100' : ''}
                            `}
                          >
                            {player.dni || '-'}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-3 text-right">
                        {canEdit ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/app/players/${player.id}`)}
                              title="Editar jugador completo"
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
                            <span className="text-slate-300 cursor-not-allowed" title="Solo lectura">
                              <Lock size={14} />
                            </span>
                          </div>
                        )}
                      </td>

                    </tr>
                  )
                })}
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
