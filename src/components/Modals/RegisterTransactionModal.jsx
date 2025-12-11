import React, { useState, useEffect } from 'react'
import { X, DollarSign, Tag, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function RegisterTransactionModal({ isOpen, onClose, onSuccess, clubId, preselectedPlayer = null }) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [players, setPlayers] = useState([])
    
    const [formData, setFormData] = useState({
        type: 'expense', // 'income' or 'expense'
        amount: '',
        description: '',
        category: 'Varios',
        date: new Date().toISOString().split('T')[0],
        player_id: ''
    })

    const fetchPlayers = React.useCallback(async () => {
        const { data } = await supabase.from('players').select('id, first_name, last_name').eq('club_id', clubId)
        setPlayers(data || [])
    }, [clubId])

    useEffect(() => {
        if (isOpen && clubId) {
            fetchPlayers()
        }
        if (isOpen) {
             // Reset or Preset
             if (preselectedPlayer) {
                 setFormData({
                     type: 'income',
                     amount: '', // User enters amount
                     description: `Cuota Mensual - ${preselectedPlayer.first_name} ${preselectedPlayer.last_name}`,
                     category: 'Cuotas',
                     date: new Date().toISOString().split('T')[0],
                     player_id: preselectedPlayer.id
                 })
             } else {
                setFormData(prev => ({ ...prev, description: '', amount: '', player_id: '' }))
             }
        }
    }, [isOpen, clubId, preselectedPlayer, fetchPlayers])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('treasury_movements').insert({
                club_id: clubId,
                type: formData.type,
                amount: parseFloat(formData.amount),
                description: formData.description,
                category: formData.category,
                date: formData.date,
                player_id: formData.player_id || null,
                created_by: user.id
            })

            if (error) throw error
            onSuccess()
            onClose()
        } catch (err) {
            console.error(err)
            alert("Error: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Registrar Movimiento</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Type Toggle */}
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, type: 'income'})}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                formData.type === 'income' 
                                ? 'bg-green-500 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Ingreso (+)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, type: 'expense'})}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                formData.type === 'expense' 
                                ? 'bg-red-500 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Egreso (-)
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto ($)</label>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input 
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-mono text-lg font-bold text-slate-900"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Concepto / Descripción</label>
                        <input 
                            required
                            type="text"
                            placeholder="Ej: Pago de Luz, Cuota Mensual..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                            <div className="relative">
                                <Tag size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <select 
                                    className="w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="Varios">Varios</option>
                                    <option value="Cuotas">Cuotas</option>
                                    <option value="Torneos">Torneos</option>
                                    <option value="Material">Material</option>
                                    <option value="Sueldos">Sueldos</option>
                                    <option value="Alquiler">Alquiler</option>
                                    <option value="Transporte">Transporte</option>
                                </select>
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                             <input 
                                required
                                type="date"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Player Selection (Only for Income) */}
                    {formData.type === 'income' && !preselectedPlayer && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asociar Jugador (Opcional)</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <select 
                                    className="w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                    value={formData.player_id}
                                    onChange={e => setFormData({...formData, player_id: e.target.value})}
                                >
                                    <option value="">-- Ninguno --</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-3 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all text-lg ${
                            formData.type === 'income' 
                            ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' 
                            : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                        }`}
                    >
                        {loading ? 'Guardando...' : formData.type === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}
                    </button>
                </form>
            </div>
        </div>
    )
}
