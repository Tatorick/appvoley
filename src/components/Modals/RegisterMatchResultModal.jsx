import React, { useState, useEffect } from 'react'
import { X, Save, Calendar, Trophy, Users, Swords, AlertCircle, Hash } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function RegisterMatchResultModal({ isOpen, onClose, onSuccess, clubId }) {
    const [loading, setLoading] = useState(false)
    const [teams, setTeams] = useState([])
    
    // Form State
    const [formData, setFormData] = useState({
        team_id: '',
        opponent_name: '',
        tournament_name: '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00', // Default noon
        score_us: 0,
        score_them: 0,
        set_scores: '', // e.g., "25-20, 25-22"
        status: 'completed',
        type: 'tournament' // Default
    })

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const { data } = await supabase
                    .from('teams')
                    .select('id, nombre, category:categories(nombre)')
                    .eq('club_id', clubId)
                
                if (data && data.length > 0) {
                    setTeams(data)
                    // Auto-select first team
                    setFormData(prev => ({ ...prev, team_id: data[0].id }))
                }
            } catch (error) {
                console.error('Error fetching teams:', error)
            }
        }

        if (isOpen && clubId) {
            fetchTeams()
        }
    }, [isOpen, clubId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.team_id) {
            alert('Por favor selecciona un equipo')
            setLoading(false)
            return
        }

        try {
            // Determine result logic automatically if needed, but we rely on manual input
            
            const { error } = await supabase
                .from('matches')
                .insert({
                    club_id: clubId,
                    team_id: formData.team_id,
                    opponent_name: formData.opponent_name || 'Rival',
                    tournament_name: formData.tournament_name,
                    date: formData.date,
                    time: formData.time,
                    type: formData.type,
                    status: 'completed',
                    score_us: parseInt(formData.score_us) || 0,
                    score_them: parseInt(formData.score_them) || 0,
                    set_scores: formData.set_scores
                })

            if (error) throw error

            onSuccess()
            onClose()
            // Reset form minimal
            setFormData(prev => ({
                 ...prev,
                 opponent_name: '',
                 tournament_name: '',
                 score_us: 0, 
                 score_them: 0,
                 set_scores: ''
            }))

        } catch (error) {
            console.error('Error registering match:', error)
            alert('Error al registrar el partido')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="text-primary" size={24} /> Registrar Resultado
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Team Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Equipo del Club</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-3 text-slate-400" size={18}/>
                            <select 
                                required
                                value={formData.team_id}
                                onChange={e => setFormData({...formData, team_id: e.target.value})}
                                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                            >
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.nombre} {team.category ? `(${team.category.nombre})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         {/* Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                            <input 
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                         {/* Type */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="tournament">Torneo / Copa</option>
                                <option value="league">Liga</option>
                                <option value="friendly">Amistoso</option>
                            </select>
                        </div>
                    </div>

                    {/* Rival & Tournament */}
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rival</label>
                            <div className="relative">
                                <Swords className="absolute left-3 top-3 text-slate-400" size={18}/>
                                <input 
                                    type="text"
                                    placeholder="Nombre del Rival"
                                    required
                                    value={formData.opponent_name}
                                    onChange={e => setFormData({...formData, opponent_name: e.target.value})}
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Torneo</label>
                            <div className="relative">
                                <Trophy className="absolute left-3 top-3 text-slate-400" size={18}/>
                                <input 
                                    type="text"
                                    placeholder="Ej. Copa Verano"
                                    value={formData.tournament_name}
                                    onChange={e => setFormData({...formData, tournament_name: e.target.value})}
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scores */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Hash size={16} /> Resultado (Sets)
                        </h4>
                        <div className="flex items-center gap-4 justify-center">
                            <div className="text-center">
                                <label className="block text-xs font-bold text-slate-400 mb-1">Nosotros</label>
                                <input 
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={formData.score_us}
                                    onChange={e => setFormData({...formData, score_us: e.target.value})}
                                    className="w-20 p-3 text-center text-2xl font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-primary"
                                />
                            </div>
                            <span className="text-2xl font-bold text-slate-300">-</span>
                            <div className="text-center">
                                <label className="block text-xs font-bold text-slate-400 mb-1">Ellos</label>
                                <input 
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={formData.score_them}
                                    onChange={e => setFormData({...formData, score_them: e.target.value})}
                                    className="w-20 p-3 text-center text-2xl font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 text-red-500"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Detalle por Sets (Opcional)</label>
                            <input 
                                type="text"
                                placeholder="Ej: 25-20, 24-26, 15-10"
                                value={formData.set_scores}
                                onChange={e => setFormData({...formData, set_scores: e.target.value})}
                                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Guardando...' : <><Save size={20}/> Guardar Resultado</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
