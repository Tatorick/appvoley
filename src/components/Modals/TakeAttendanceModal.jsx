import React, { useState, useEffect } from 'react'
import { X, Save, Calendar, Clock, ClipboardCheck, Users, CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function TakeAttendanceModal({ isOpen, onClose, onSuccess, clubId }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Data
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])

  // Form Step 1: Session
  const [sessionData, setSessionData] = useState({
      team_id: '',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      topic: ''
  })

  // Form Step 2: Attendance Records
  // Map of playerId -> status ('present', 'absent', 'late', 'excused')
  const [attendanceMap, setAttendanceMap] = useState({})

  // Move definition inside component or use stable callback
  const fetchTeams = React.useCallback(async () => {
    const { data: rawData } = await supabase.from('teams')
        .select('id, nombre, categories(nombre)')
        .eq('club_id', clubId)

    const data = rawData?.map(t => ({
        ...t,
        categoria: t.categories?.nombre
    })) || []
    
    setTeams(data)
  }, [clubId])

  useEffect(() => {
    if(isOpen && clubId) {
        fetchTeams()
        // Reset
        setStep(1)
        setSessionData({ 
            team_id: '', 
            date: new Date().toISOString().split('T')[0], 
            time: '18:00',
            topic: ''
        })
        setAttendanceMap({})
        setPlayers([])
        setError(null)
    }
  }, [isOpen, clubId, fetchTeams])

  const handleNext = async () => {
      if (!sessionData.team_id) {
          setError("Selecciona un equipo")
          return
      }
      setLoading(true)
      try {
          // Fetch players for this team
          const { data, error } = await supabase
            .from('players')
            .select('id, nombre_completo, posicion, numero_camiseta')
            .eq('team_id', sessionData.team_id)
            .eq('active', true)
            .order('nombre_completo')
          
          if(error) throw error
          
          setPlayers(data || [])
          
          // Initialize map with 'present' by default
          const initialMap = {}
          data.forEach(p => initialMap[p.id] = 'present')
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
          // 1. Create Session
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

          // 2. Insert Records
          const records = players.map(p => ({
              session_id: session.id,
              player_id: p.id,
              status: attendanceMap[p.id] || 'present'
          }))

          if (records.length > 0) {
            const { error: attError } = await supabase.from('attendance').insert(records)
            if (attError) throw attError // Note: If this fails, session exists but empty. Ideal: Transaction or cleanup.
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <ClipboardCheck size={20} className="text-primary"/> 
                    Control de Asistencia
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Equipo</label>
                            <select 
                                value={sessionData.team_id}
                                onChange={e => setSessionData({...sessionData, team_id: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Seleccionar Equipo...</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre} ({t.categoria})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                                <input 
                                    type="date" 
                                    value={sessionData.date}
                                    onChange={e => setSessionData({...sessionData, date: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hora</label>
                                <input 
                                    type="time" 
                                    value={sessionData.time}
                                    onChange={e => setSessionData({...sessionData, time: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tema / Objetivo (Opcional)</label>
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
                            <span>Pulsa para cambiar estado</span>
                        </div>
                        
                        <div className="space-y-2">
                            {players.map(player => {
                                const status = attendanceMap[player.id]
                                return (
                                    <div 
                                        key={player.id}
                                        onClick={() => toggleStatus(player.id)}
                                        className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50 select-none group"
                                        style={{ 
                                            borderColor: 
                                                status === 'present' ? '#22c55e' : 
                                                status === 'absent' ? '#ef4444' : 
                                                status === 'late' ? '#eab308' : '#3b82f6'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {player.numero_camiseta || '#'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{player.nombre_completo}</p>
                                                <p className="text-[10px] text-slate-400">{player.posicion}</p>
                                            </div>
                                        </div>

                                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-28 justify-center transition-colors ${
                                            status === 'present' ? 'bg-green-100 text-green-700' : 
                                            status === 'absent' ? 'bg-red-100 text-red-700' : 
                                            status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {status === 'present' && <><CheckCircle2 size={14}/> Presente</>}
                                            {status === 'absent' && <><XCircle size={14}/> Ausente</>}
                                            {status === 'late' && <><Clock size={14}/> Tarde</>}
                                            {status === 'excused' && <><HelpCircle size={14}/> Justif.</>}
                                        </div>
                                    </div>
                                )
                            })}
                            {players.length === 0 && <p className="text-center text-slate-400 py-4">No hay jugadores activos en este equipo.</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
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
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        Continuar
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                        {loading && <span className="animate-spin">⌛</span>}
                        Guardar Asistencia
                    </button>
                )}
            </div>
        </div>
    </div>
  )
}
