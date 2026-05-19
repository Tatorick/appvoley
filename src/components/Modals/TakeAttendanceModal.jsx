import React, { useState, useEffect } from 'react'
import { X, Save, Clock, ClipboardCheck, Users, CheckCircle2, XCircle, AlertCircle, HelpCircle, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DIA_INDEX_MAP = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']

/**
 * Returns the team that is currently scheduled to train, based on the
 * current day-of-week and current time overlapping the team's hora_inicio/hora_fin window.
 */
function detectActiveTeam(teams) {
    const now = new Date()
    const todayKey = DIA_INDEX_MAP[now.getDay()]
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    return teams.find(t => {
        if (!t.hora_inicio || !t.hora_fin) return false
        if (!t.dias_semana?.includes(todayKey)) return false

        const [startH, startM] = t.hora_inicio.slice(0, 5).split(':').map(Number)
        const [endH,   endM]   = t.hora_fin.slice(0, 5).split(':').map(Number)
        const startMin = startH * 60 + startM
        const endMin   = endH   * 60 + endM

        return nowMinutes >= startMin && nowMinutes <= endMin
    }) || null
}

export default function TakeAttendanceModal({ isOpen, onClose, onSuccess, clubId }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Data
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [autoDetectedTeam, setAutoDetectedTeam] = useState(null)

  // Form Step 1: Session
  const [sessionData, setSessionData] = useState({
      team_id: '',
      date: new Date().toISOString().split('T')[0],
      time: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`,
      topic: ''
  })

  // Form Step 2: Attendance Records
  const [attendanceMap, setAttendanceMap] = useState({})

  const fetchTeams = React.useCallback(async () => {
    const { data: rawData } = await supabase.from('teams')
        .select('id, nombre, categories(nombre), tipo, dias_semana, hora_inicio, hora_fin')
        .eq('club_id', clubId)
        .order('tipo')
        .order('nombre')

    const data = rawData?.map(t => ({
        ...t,
        categoria: t.categories?.nombre
    })) || []
    
    setTeams(data)
    return data
  }, [clubId])

  useEffect(() => {
    if (isOpen && clubId) {
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
        
        fetchTeams().then(data => {
            // Auto-detect active team
            const active = detectActiveTeam(data)
            setAutoDetectedTeam(active)

            setStep(1)
            setSessionData({ 
                team_id: active?.id || '', 
                date: now.toISOString().split('T')[0], 
                time: currentTime,
                topic: ''
            })
            setAttendanceMap({})
            setPlayers([])
            setError(null)
        })
    }
  }, [isOpen, clubId, fetchTeams])

  const handleNext = async () => {
      if (!sessionData.team_id) {
          setError("Selecciona un equipo")
          return
      }
      setLoading(true)
      try {
          const { data, error } = await supabase
            .from('team_assignments')
            .select(`
                id,
                players!inner (
                    id,
                    first_name,
                    last_name,
                    position,
                    jersey_number,
                    active
                )
            `)
            .eq('team_id', sessionData.team_id)
            .eq('players.active', true)
          
          if (error) throw error
          
          const mappedPlayers = (data || [])
              .filter(a => a.players)
              .map(a => ({
                  id: a.players.id,
                  nombre_completo: `${a.players.first_name} ${a.players.last_name}`,
                  posicion: a.players.position,
                  numero_camiseta: a.players.jersey_number
              }))
              .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo))
          
          setPlayers(mappedPlayers)
          
          // Initialize all as 'present'
          const initialMap = {}
          mappedPlayers.forEach(p => { initialMap[p.id] = 'present' })
          setAttendanceMap(initialMap)
          
          setError(null)
          setStep(2)
      } catch (err) {
          console.error(err)
          setError("Error al cargar jugadores")
      } finally {
          setLoading(false)
      }
  }

  const toggleStatus = (playerId) => {
      setAttendanceMap(prev => {
          const current = prev[playerId]
          const next = 
            current === 'present' ? 'absent' :
            current === 'absent' ? 'late' :
            current === 'late' ? 'excused' : 'present'
          return { ...prev, [playerId]: next }
      })
  }

  const handleSubmit = async () => {
      setLoading(true)
      try {
          const { data: session, error: sessError } = await supabase
            .from('training_sessions')
            .insert({
                club_id: clubId,
                team_id: sessionData.team_id,
                date: sessionData.date,
                time: sessionData.time,
                topic: sessionData.topic
            })
            .select()
            .single()

          if (sessError) throw sessError

          const records = players.map(p => ({
              session_id: session.id,
              player_id: p.id,
              status: attendanceMap[p.id] || 'present'
          }))

          if (records.length > 0) {
            const { error: attError } = await supabase.from('attendance').insert(records)
            if (attError) throw attError
          }

          onSuccess()
          onClose()
      } catch (err) {
          console.error(err)
          setError(err.message)
      } finally {
          setLoading(false)
      }
  }

  // Helpers for the team select dropdown
  const competicionTeams = teams.filter(t => !t.tipo || t.tipo === 'competicion')
  const formativoTeams   = teams.filter(t => t.tipo === 'formativo')

  const selectedTeam = teams.find(t => t.id === sessionData.team_id)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <ClipboardCheck size={20} className="text-primary"/> 
                    Control de Asistencia
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-4 animate-in slide-in-from-right-4">

                        {/* Auto-detection banner */}
                        {autoDetectedTeam && (
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                <Zap size={18} className="text-emerald-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-emerald-800">Turno detectado automáticamente</p>
                                    <p className="text-xs text-emerald-600 truncate">{autoDetectedTeam.nombre}</p>
                                </div>
                            </div>
                        )}

                        {/* Team select */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipo / Grupo</label>
                            <select 
                                value={sessionData.team_id}
                                onChange={e => setSessionData({...sessionData, team_id: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700"
                            >
                                <option value="">Seleccionar...</option>

                                {competicionTeams.length > 0 && (
                                    <optgroup label="🏆 Competición">
                                        {competicionTeams.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.nombre}{t.categoria ? ` (${t.categoria})` : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}

                                {formativoTeams.length > 0 && (
                                    <optgroup label="📚 Grupos Formativos">
                                        {formativoTeams.map(t => {
                                            const horario = t.hora_inicio && t.hora_fin
                                                ? ` · ${t.hora_inicio.slice(0,5)}–${t.hora_fin.slice(0,5)}`
                                                : ''
                                            return (
                                                <option key={t.id} value={t.id}>
                                                    {t.nombre}{horario}
                                                </option>
                                            )
                                        })}
                                    </optgroup>
                                )}
                            </select>

                            {/* Selected team schedule info */}
                            {selectedTeam?.hora_inicio && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                                    <Clock size={12} className="text-emerald-500" />
                                    <span>
                                        Horario: <strong>{selectedTeam.hora_inicio.slice(0,5)} – {selectedTeam.hora_fin?.slice(0,5)}</strong>
                                        {selectedTeam.dias_semana?.length > 0 && (
                                            <> · {selectedTeam.dias_semana.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')}</>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Date + Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Fecha</label>
                                <input 
                                    type="date" 
                                    value={sessionData.date}
                                    onChange={e => setSessionData({...sessionData, date: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Hora</label>
                                <input 
                                    type="time" 
                                    value={sessionData.time}
                                    onChange={e => setSessionData({...sessionData, time: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Topic */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tema / Objetivo <span className="text-slate-300 normal-case font-normal">(Opcional)</span></label>
                            <input 
                                type="text" 
                                value={sessionData.topic}
                                onChange={e => setSessionData({...sessionData, topic: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Ej: Saque y Recepción"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg text-blue-800 text-sm">
                            <span className="font-bold">{players.length} Jugadores</span>
                            <span className="text-xs">Toca para cambiar estado</span>
                        </div>
                        
                        {/* Quick mark all */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const all = {}
                                    players.forEach(p => { all[p.id] = 'present' })
                                    setAttendanceMap(all)
                                }}
                                className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                                ✓ Todos Presentes
                            </button>
                            <button
                                onClick={() => {
                                    const all = {}
                                    players.forEach(p => { all[p.id] = 'absent' })
                                    setAttendanceMap(all)
                                }}
                                className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            >
                                ✗ Todos Ausentes
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {players.map(player => {
                                const status = attendanceMap[player.id]
                                return (
                                    <div 
                                        key={player.id}
                                        onClick={() => toggleStatus(player.id)}
                                        className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50 select-none"
                                        style={{ 
                                            borderColor: 
                                                status === 'present' ? '#22c55e' : 
                                                status === 'absent'  ? '#ef4444' : 
                                                status === 'late'    ? '#eab308' : '#3b82f6'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {player.numero_camiseta || '#'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">{player.nombre_completo}</p>
                                                <p className="text-[10px] text-slate-400">{player.posicion}</p>
                                            </div>
                                        </div>

                                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-28 justify-center transition-colors ${
                                            status === 'present' ? 'bg-green-100 text-green-700' : 
                                            status === 'absent'  ? 'bg-red-100 text-red-700' : 
                                            status === 'late'    ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {status === 'present'  && <><CheckCircle2 size={14}/> Presente</>}
                                            {status === 'absent'   && <><XCircle size={14}/> Ausente</>}
                                            {status === 'late'     && <><Clock size={14}/> Tarde</>}
                                            {status === 'excused'  && <><HelpCircle size={14}/> Justif.</>}
                                        </div>
                                    </div>
                                )
                            })}
                            {players.length === 0 && (
                                <p className="text-center text-slate-400 py-4 text-sm">No hay jugadores activos en este equipo.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                {step === 2 && (
                    <button 
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Atrás
                    </button>
                )}
                
                {step === 1 ? (
                     <button 
                        onClick={handleNext}
                        disabled={loading}
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-60"
                    >
                        {loading ? 'Cargando...' : 'Continuar →'}
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                        <Save size={16} />
                        {loading ? 'Guardando...' : 'Guardar Asistencia'}
                    </button>
                )}
            </div>
        </div>
    </div>
  )
}
