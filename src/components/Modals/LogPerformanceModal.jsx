import React, { useState, useEffect } from 'react'
import { X, Save, Activity, TrendingUp, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function LogPerformanceModal({ isOpen, onClose, onSuccess, clubId, preselectedPlayerId = null, preselectedPlayerName = null }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Data
    const [players, setPlayers] = useState([])

    // Common Metrics Preset
    const METRIC_TYPES = [
        { id: 'vertical_jump_cm', label: 'Salto Vertical (cm)', category: 'Físico' },
        { id: 'attack_power_1_10', label: 'Potencia de Remate (1-10)', category: 'Técnico' },
        { id: 'serve_accuracy_1_10', label: 'Precisión de Saque (1-10)', category: 'Técnico' },
        { id: 'reception_quality_1_10', label: 'Calidad de Recepción (1-10)', category: 'Técnico' },
        { id: 'speed_20m_sec', label: 'Velocidad 20m (seg)', category: 'Físico' },
        { id: 'block_height_cm', label: 'Alcance Bloqueo (cm)', category: 'Físico' }
    ]

    const [formData, setFormData] = useState({
        player_id: '',
        date: new Date().toISOString().split('T')[0],
        metric_type: 'attack_power_1_10',
        value: '',
        notes: ''
    })

    // Fetch Players
    const fetchPlayers = React.useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('id, first_name, last_name, position')
                .eq('club_id', clubId)
                .order('first_name')

            if (error) throw error

            // Map to expected format if needed or just use raw
            const formatted = data?.map(p => ({
                ...p,
                nombre_completo: `${p.first_name} ${p.last_name}`,
                posicion: p.position
            })) || []

            setPlayers(formatted)

            if (preselectedPlayerId) {
                // If preselected, set it immediately without waiting for list verification if we trust the prop
                // But good to verify if possible. For now, let's set it.
                setFormData(prev => ({ ...prev, player_id: preselectedPlayerId }))
            }
        } catch (err) {
            console.error("Error fetching players:", err)
        }
    }, [clubId, preselectedPlayerId])

    useEffect(() => {
        if (isOpen && clubId) {
            fetchPlayers()
            // Reset (keep player if preselected)
            setFormData(prev => ({
                ...prev,
                date: new Date().toISOString().split('T')[0],
                value: '',
                notes: ''
            }))
            setError(null)
        }
    }, [isOpen, clubId, fetchPlayers])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!formData.player_id) throw new Error("Selecciona un jugador")
            if (!formData.value) throw new Error("Ingresa un valor")

            const payload = {
                ...formData,
                club_id: clubId
            }

            const { error: insertError } = await supabase.from('player_performance_logs').insert(payload)
            if (insertError) throw insertError

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

    const selectedMetric = METRIC_TYPES.find(m => m.id === formData.metric_type)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Activity size={20} className="text-pink-500" />
                        Registrar Evaluación
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form id="perf-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Jugador</label>
                            {preselectedPlayerId ? (
                                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700">
                                    {preselectedPlayerName || players.find(p => p.id === preselectedPlayerId)?.nombre_completo || 'Cargando...'}
                                </div>
                            ) : (
                                <select
                                    value={formData.player_id}
                                    onChange={e => setFormData({ ...formData, player_id: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                                >
                                    <option value="">Seleccionar Jugador...</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre_completo} ({p.posicion})</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Métrica</label>
                                <select
                                    value={formData.metric_type}
                                    onChange={e => setFormData({ ...formData, metric_type: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 text-sm"
                                >
                                    <optgroup label="Físico">
                                        {METRIC_TYPES.filter(m => m.category === 'Físico').map(m => (
                                            <option key={m.id} value={m.id}>{m.label}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Técnico">
                                        {METRIC_TYPES.filter(m => m.category === 'Técnico').map(m => (
                                            <option key={m.id} value={m.id}>{m.label}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                Valor Registrado
                                {selectedMetric?.label.includes('1-10') && <span className="ml-1 text-xs font-normal normal-case text-slate-400">(1 = Malo, 10 = Excelente)</span>}
                            </label>
                            <div className="relative">
                                <TrendingUp className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="number" step="0.01"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-pink-500 font-bold text-lg text-slate-800"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas (Opcional)</label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 h-20 resize-none text-sm"
                                placeholder="Observaciones sobre la prueba..."
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit" form="perf-form" disabled={loading}
                        className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/25 transition-all flex items-center gap-2"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                        Guardar Registro
                    </button>
                </div>
            </div >
        </div >
    )
}
