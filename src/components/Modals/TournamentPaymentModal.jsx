import React, { useState } from 'react'
import { X, Save, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function TournamentPaymentModal({ isOpen, onClose, onSuccess, tournamentId, player }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tournament_payments')
                .insert({
                    tournament_id: tournamentId,
                    player_id: player.id,
                    amount: parseFloat(formData.amount),
                    date: formData.date,
                    notes: formData.notes
                })

            if (error) throw error
            onSuccess()
            onClose()
            setFormData({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            })
        } catch (err) {
            console.error(err)
            alert("Error al registrar pago")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !player) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <DollarSign size={20} className="text-green-600" />
                        Registrar Pago
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="px-6 pt-4">
                    <p className="text-sm text-slate-500">Jugador:</p>
                    <p className="font-bold text-slate-800 text-lg">{player.first_name} {player.last_name}</p>
                </div>

                <form id="payment-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Monto</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="number" step="0.01" required
                                value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 font-bold text-lg text-slate-800"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                        <input
                            type="date" required
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas (Opcional)</label>
                        <textarea
                            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 h-20 resize-none text-sm"
                            placeholder="Detalles del pago..."
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
                        type="submit" form="payment-form" disabled={loading}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    )
}
