import React, { useState } from 'react'
import { X, Trophy, Handshake, MapPin, Calendar, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function CreateMatchPostModal({ isOpen, onClose, onSuccess, clubId }) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        type: 'friendly',
        description: '',
        date_start: '',
        time: '',
        location: '',
        level: 'Intermedio',
        contact_info: '',
        hospitality: { housing: false, food: false, transport: false }
    })

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!clubId) return alert("Error: Club no identificado")
        if (!formData.title || !formData.date_start || !formData.contact_info) return alert("Campos obligatorios faltantes")

        setLoading(true)
        try {
            const { error } = await supabase.from('match_posts').insert({
                club_id: clubId,
                title: formData.title,
                type: formData.type,
                description: formData.description,
                date_start: formData.date_start,
                time: formData.time,
                location: formData.location,
                level: formData.level,
                contact_info: formData.contact_info,
                hospitality: formData.hospitality,
                created_by: user.id
            })

            if (error) throw error
            onSuccess()
        } catch (err) {
            console.error(err)
            alert("Error al publicar: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleHospitality = (key) => {
        setFormData(prev => ({
            ...prev,
            hospitality: { ...prev.hospitality, [key]: !prev.hospitality[key] }
        }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Nueva Publicación</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, type: 'friendly'})}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                formData.type === 'friendly' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                            }`}
                        >
                            <Handshake size={24}/>
                            <span>Tope / Amistoso</span>
                        </button>
                        <button
                             type="button"
                             onClick={() => setFormData({...formData, type: 'tournament'})}
                             className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                 formData.type === 'tournament' 
                                 ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' 
                                 : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                             }`}
                        >
                            <Trophy size={24}/>
                            <span>Torneo</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título de la Actividad</label>
                            <input 
                                required
                                type="text"
                                placeholder="Ej: Tope Sub-18 Femenino"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                                <input 
                                    required
                                    type="date"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.date_start}
                                    onChange={e => setFormData({...formData, date_start: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora (Opcional)</label>
                                <input 
                                    type="time"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.time}
                                    onChange={e => setFormData({...formData, time: e.target.value})}
                                />
                            </div>
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                <input 
                                    required
                                    type="text"
                                    placeholder="Ej: Gimnasio Municipal, Ciudad..."
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nivel / Sub-Categoría</label>
                            <input 
                                type="text"
                                placeholder="Ej: Sub-21 Avanzado"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.level}
                                onChange={e => setFormData({...formData, level: e.target.value})}
                            />
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción / Detalles</label>
                            <textarea 
                                rows="2"
                                placeholder="Detalles extra: arbitraje, costo, reglas..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                         {/* Hospitality */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hospitalidad Ofrecida</label>
                            <div className="flex flex-wrap gap-2">
                                <HospitalityToggle label="Hospedaje" active={formData.hospitality.housing} onClick={() => toggleHospitality('housing')} />
                                <HospitalityToggle label="Comida" active={formData.hospitality.food} onClick={() => toggleHospitality('food')} />
                                <HospitalityToggle label="Transporte Local" active={formData.hospitality.transport} onClick={() => toggleHospitality('transport')} />
                            </div>
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Whatsapp de Contacto</label>
                            <input 
                                required
                                type="tel"
                                placeholder="+593 99 999 9999"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                                value={formData.contact_info}
                                onChange={e => setFormData({...formData, contact_info: e.target.value})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">El botón de "Contactar" enviará a este número.</p>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-lg"
                    >
                        {loading ? 'Publicando...' : 'Publicar Oportunidad'}
                    </button>
                </form>
            </div>
        </div>
    )
}

function HospitalityToggle({ label, active, onClick }) {
    return (
        <button 
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${
                active 
                ? 'bg-green-50 border-green-500 text-green-700' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
        >
            {active && <Check size={14} />}
            {label}
        </button>
    )
}
