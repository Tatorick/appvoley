import React, { useState, useEffect } from 'react'
import { X, Save, Calendar, Clock, MapPin, Trophy, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AddMatchModal({ isOpen, onClose, onSuccess, clubId, matchToEdit = null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Teams for selection
  const [teams, setTeams] = useState([])
  
  // Modes: 'create', 'edit', 'result'
  // If matchToEdit is present, check if we are just editing details or recording result?
  // Use a state or prop for 'mode'. For now, let's assume if matchToEdit exists we are editing.
  // We can add a specialized "Record Result" view if needed, but for now simple edit is fine.

  const [formData, setFormData] = useState({
      team_id: '',
      opponent_name: '',
      date: '',
      time: '',
      location: '',
      type: 'friendly',
      status: 'scheduled',
      score_us: 0,
      score_them: 0,
      set_scores: '',
      notes: ''
  })

  // Fetch Teams
  useEffect(() => {
      if(isOpen && clubId) {
          fetchTeams()
      }
  }, [isOpen, clubId])

  // Reset or Load Data
  useEffect(() => {
    if (isOpen) {
        if (matchToEdit) {
            setFormData({
                team_id: matchToEdit.team_id,
                opponent_name: matchToEdit.opponent_name,
                date: matchToEdit.date,
                time: matchToEdit.time || '', // formatted
                location: matchToEdit.location || '',
                type: matchToEdit.type || 'friendly',
                status: matchToEdit.status || 'scheduled',
                score_us: matchToEdit.score_us || 0,
                score_them: matchToEdit.score_them || 0,
                set_scores: matchToEdit.set_scores || '',
                notes: matchToEdit.notes || ''
            })
        } else {
            // Default
            setFormData({
                team_id: '',
                opponent_name: '',
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                location: '',
                type: 'friendly',
                status: 'scheduled',
                score_us: 0,
                score_them: 0,
                set_scores: '',
                notes: ''
            })
        }
        setError(null)
    }
  }, [isOpen, matchToEdit])

  const fetchTeams = async () => {
    const { data: rawData } = await supabase.from('teams')
        .select('id, nombre, genero, categories(nombre)')
        .eq('club_id', clubId)
    
    // Flatten for easier usage
    const data = rawData?.map(t => ({
        ...t,
        categoria: t.categories?.nombre
    })) || []

    setTeams(data)
    // Default first team if creating
    if (!matchToEdit && data && data.length > 0 && !formData.team_id) {
         setFormData(prev => ({ ...prev, team_id: data[0].id }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
        if (!formData.team_id) throw new Error("Debes seleccionar un equipo local")
        if (!formData.opponent_name) throw new Error("Debes nombrar al rival")
        if (!formData.date) throw new Error("Fecha requerida")

        const payload = {
            ...formData,
            club_id: clubId
        }

        // If status is completed, maybe validate scores?
        // Not simple to validate perfectly, allow flexibility.

        let result
        if (matchToEdit) {
            result = await supabase.from('matches').update(payload).eq('id', matchToEdit.id)
        } else {
            result = await supabase.from('matches').insert(payload)
        }

        if (result.error) throw result.error

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

  const isCompleted = formData.status === 'completed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-primary"/> 
                    {matchToEdit ? 'Editar Partido' : 'Programar Partido'}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                <form id="match-form" onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tu Equipo</label>
                            <select 
                                value={formData.team_id}
                                onChange={e => setFormData({...formData, team_id: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                required
                            >
                                <option value="">Seleccionar Equipo...</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombre} ({t.categoria} {t.genero === 'F' ? 'Fem' : t.genero === 'M' ? 'Masc' : 'Mixto'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rival (Nombre)</label>
                            <input 
                                type="text" 
                                value={formData.opponent_name}
                                onChange={e => setFormData({...formData, opponent_name: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Ej: Club Regatas"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                            <input 
                                type="date" 
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                required
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hora</label>
                            <input 
                                type="time" 
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                required
                            />
                        </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                             <select 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="friendly">Amistoso (Tope)</option>
                                <option value="tournament">Torneo</option>
                                <option value="league">Liga</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ubicación</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                            <input 
                                type="text" 
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Coliseo Dibos, Cancha propia..."
                            />
                        </div>
                    </div>

                    {/* Result Section - Only if status check or manual toggle? 
                        Lets allow toggling status 
                    */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Trophy size={18} className="text-yellow-500"/> Resultado
                            </h3>
                            <select 
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value})}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                    formData.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                    formData.status === 'canceled' ? 'bg-red-100 text-red-700 border-red-200' :
                                    'bg-blue-100 text-blue-700 border-blue-200'
                                }`}
                            >
                                <option value="scheduled">Programado</option>
                                <option value="completed">Finalizado</option>
                                <option value="canceled">Cancelado</option>
                            </select>
                        </div>

                        {formData.status === 'completed' && (
                            <div className="bg-slate-50 p-4 rounded-xl space-y-4 animate-in fade-in">
                                <div className="flex items-center justify-center gap-8">
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-500 mb-2">NOSOTROS</p>
                                        <input 
                                            type="number" min="0" max="5"
                                            value={formData.score_us}
                                            onChange={e => setFormData({...formData, score_us: parseInt(e.target.value) || 0})}
                                            className="w-16 h-16 text-center text-3xl font-bold bg-white border border-slate-200 rounded-2xl focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-300">-</div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-500 mb-2">RIVAL</p>
                                        <input 
                                            type="number" min="0" max="5"
                                            value={formData.score_them}
                                            onChange={e => setFormData({...formData, score_them: parseInt(e.target.value) || 0})}
                                            className="w-16 h-16 text-center text-3xl font-bold bg-white border border-slate-200 rounded-2xl focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Parciales (Sets)</label>
                                     <input 
                                        type="text" 
                                        value={formData.set_scores}
                                        onChange={e => setFormData({...formData, set_scores: e.target.value})}
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center text-sm"
                                        placeholder="Ej: 25-20, 18-25, 15-10"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                     
                     {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas</label>
                        <textarea 
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" form="match-form" disabled={loading}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                >
                    {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                    {matchToEdit ? 'Guardar Cambios' : 'Programar'}
                </button>
            </div>
        </div>
    </div>
  )
}
