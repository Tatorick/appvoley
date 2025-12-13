import React, { useState } from 'react'
import { X, Save, Trophy, MapPin, Calendar, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function CreateTournamentModal({ isOpen, onClose, onSuccess, clubId }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_date: '',
        end_date: '',
        cost_per_player: '',
        description: '',
        status: 'planned'
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tournaments')
                .insert({
                    club_id: clubId,
                    ...formData,
                    cost_per_player: formData.cost_per_player ? parseFloat(formData.cost_per_player) : 0
                })

            if (error) throw error
            onSuccess()
            onClose()
            setFormData({
                name: '',
                location: '',
                start_date: '',
                end_date: '',
                cost_per_player: '',
                description: '',
                status: 'planned'
            })
        } catch (err) {
            console.error(err)
            alert("Error al crear torneo")
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
                        <Trophy size={20} className="text-yellow-500" />
                        Nuevo Torneo
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form id="tournament-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Evento</label>
                        <input
                            type="text" required
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20 font-bold text-slate-700"
                            placeholder="Ej. Copa Nacional 2025"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ubicación</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text" required
                                value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                                placeholder="Ciudad, País"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha Inicio</label>
                            <input
                                type="date" required
                                value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha Fin</label>
                            <input
                                type="date" required
                                value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Costo por Jugador</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="number" step="0.01"
                                    value={formData.cost_per_player} onChange={e => setFormData({ ...formData, cost_per_player: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estado Inicial</label>
                            <select
                                value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                            >
                                <option value="planned">Planificado</option>
                                <option value="confirmed">Confirmado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción / Notas</label>
                        <textarea
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20 h-24 resize-none"
                            placeholder="Detalles del viaje, itinerario, etc."
                        />
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit" form="tournament-form" disabled={loading}
                        className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                        Crear Torneo
                    </button>
                </div>
            </div>
        </div>
    )
}
