import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Trash2, Users, Shield, Award, AlertTriangle } from 'lucide-react'

export default function ClubInspector() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [club, setClub] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClubDetails()
  }, [id])

  const fetchClubDetails = async () => {
    try {
        setLoading(true)
        
        // 1. Club Info
        const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', id)
            .single()
        if (clubError) throw clubError
        setClub(clubData)

        // 2. Teams
        const { data: teamData } = await supabase
            .from('teams')
            .select('*, categories(nombre)')
            .eq('club_id', id)
        setTeams(teamData || [])

        // 3. Players
        const { data: playerData } = await supabase
            .from('players')
            .select('*')
            .eq('club_id', id)
        setPlayers(playerData || [])

        // 4. Staff/Members
        const { data: memberData } = await supabase
            .from('club_members')
            .select('*, profiles(nombre_completo, email, rol)')
            .eq('club_id', id)
        setMembers(memberData || [])

    } catch (error) {
        console.error("Error loading club details:", error)
        alert("Error cargando detalles: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if(!confirm("⚠️ ¿FORZAR eliminación del equipo? Esto borrará sus asignaciones.")) return
    try {
        const { error } = await supabase.from('teams').delete().eq('id', teamId)
        if (error) throw error
        setTeams(prev => prev.filter(t => t.id !== teamId))
        alert("Equipo eliminado.")
    } catch (err) { alert(err.message) }
  }

  const handleDeletePlayer = async (playerId) => {
    if(!confirm("⚠️ ¿FORZAR eliminación del jugador? Perderá stats y pagos.")) return
    try {
        const { error } = await supabase.from('players').delete().eq('id', playerId)
        if (error) throw error
        setPlayers(prev => prev.filter(p => p.id !== playerId))
        alert("Jugador eliminado.")
    } catch (err) { alert(err.message) }
  }

  const handleRemoveMember = async (memberId) => {
    if(!confirm("⚠️ ¿Expulsar miembro del club?")) return
    try {
        const { error } = await supabase.from('club_members').delete().eq('id', memberId)
        if (error) throw error
        setMembers(prev => prev.filter(m => m.id !== memberId))
        alert("Miembro removido.")
    } catch (err) { alert(err.message) }
  }

  if (loading) return <div className="p-10 text-white">Cargando inspector...</div>
  if (!club) return <div className="p-10 text-white">Club no encontrado</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link to="/admin" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white transition-colors">
            <ArrowLeft size={20} />
        </Link>
        <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                {club.nombre}
                {club.status === 'activo' ? 
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">Activo</span> : 
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">Pendiente</span>
                }
            </h1>
            <p className="text-slate-400 font-mono text-sm">ID: {club.id} | Código: {club.codigo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* MEMBERS / STAFF */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
                <Shield size={24}/>
                <h3 className="font-bold text-lg">Staff & Miembros ({members.length})</h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {members.map(m => (
                    <div key={m.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center group">
                        <div>
                            <div className="font-bold text-slate-200">{m.profiles?.nombre_completo || 'Unknown'}</div>
                            <div className="text-xs text-slate-500">{m.role_in_club}</div>
                        </div>
                        <button 
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                            title="Expulsar"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* TEAMS */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4 text-purple-400">
                <Users size={24}/>
                <h3 className="font-bold text-lg">Equipos ({teams.length})</h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {teams.map(t => (
                    <div key={t.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center group">
                        <div>
                            <div className="font-bold text-slate-200">{t.nombre}</div>
                            <div className="text-xs text-slate-500">{t.categories?.nombre || 'Sin cat'}</div>
                        </div>
                        <button 
                            onClick={() => handleDeleteTeam(t.id)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                            title="Eliminar Equipo"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* PLAYERS */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4 text-orange-400">
                <Award size={24}/>
                <h3 className="font-bold text-lg">Jugadores ({players.length})</h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {players.map(p => (
                    <div key={p.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center group">
                        <div>
                            <div className="font-bold text-slate-200">{p.first_name} {p.last_name}</div>
                            <div className="text-xs text-slate-500">DNI: {p.dni || '—'}</div>
                        </div>
                        <button 
                            onClick={() => handleDeletePlayer(p.id)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                            title="Eliminar Jugador"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>

      </div>

      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3">
        <AlertTriangle className="text-red-400 shrink-0" />
        <div>
            <h4 className="font-bold text-red-400">Zona de Peligro</h4>
            <p className="text-sm text-red-300/80">
                Estás visualizando datos privados con permisos de Super Admin. 
                Cualquier eliminación es permanente e irreversible. Actúa con precaución.
            </p>
        </div>
      </div>
    </div>
  )
}
