import React, { useState } from 'react'
import {
    X, Save, Trophy, MapPin, Calendar, DollarSign, AlertCircle,
    Plus, Trash2, ChevronRight, ChevronLeft, Clock, Swords, ListPlus, LayoutList
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const PHASES = ['Fase de grupos', 'Cuartos de final', 'Semifinal', 'Tercer puesto', 'Final', 'Partido amistoso', 'Otro']

const emptyMatch = () => ({
    match_date: '',
    match_time: '',
    opponent: '',
    venue: '',
    phase: 'Fase de grupos',
    notes: '',
    _key: Math.random()
})

export default function CreateTournamentModal({ isOpen, onClose, onSuccess, clubId, tournamentToEdit }) {
    const [step, setStep] = useState(1) // 1 = datos, 2 = calendario
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_date: '',
        end_date: '',
        cost_per_player: '',
        description: '',
        status: 'planned'
    })
    const [matches, setMatches] = useState([]) // Partidos del calendario

    const defaultBreakdown = [
        { id: '1', name: 'Inscripción', amount: '' },
        { id: '2', name: 'Transporte', amount: '' },
        { id: '3', name: 'Hospedaje', amount: '' },
        { id: '4', name: 'Alimentación', amount: '' }
    ]
    const [costMode, setCostMode] = useState('simple') // 'simple' | 'detailed'
    const [costBreakdown, setCostBreakdown] = useState(defaultBreakdown)

    React.useEffect(() => {
        if (isOpen) {
            if (tournamentToEdit) {
                setFormData({
                    name: tournamentToEdit.name || '',
                    location: tournamentToEdit.location || '',
                    start_date: tournamentToEdit.start_date || '',
                    end_date: tournamentToEdit.end_date || '',
                    cost_per_player: tournamentToEdit.cost_per_player?.toString() || '',
                    description: tournamentToEdit.description || '',
                    status: tournamentToEdit.status || 'planned'
                })
                if (tournamentToEdit.cost_breakdown && tournamentToEdit.cost_breakdown.length > 0) {
                    setCostMode('detailed')
                    setCostBreakdown(tournamentToEdit.cost_breakdown)
                } else {
                    setCostMode('simple')
                    setCostBreakdown(defaultBreakdown)
                }
                setStep(1)
            } else {
                setFormData({
                    name: '', location: '', start_date: '', end_date: '',
                    cost_per_player: '', description: '', status: 'planned'
                })
                setCostMode('simple')
                setCostBreakdown(defaultBreakdown)
                setStep(1)
                setMatches([])
            }
            setError(null)
        }
    }, [isOpen, tournamentToEdit])

    const resetAll = () => {
        setStep(1)
        setError(null)
        if (!tournamentToEdit) {
            setFormData({
                name: '', location: '', start_date: '', end_date: '',
                cost_per_player: '', description: '', status: 'planned'
            })
            setCostMode('simple')
            setCostBreakdown(defaultBreakdown)
            setMatches([])
        }
    }

    const handleClose = () => {
        resetAll()
        onClose()
    }

    // ── Paso 1: validar y avanzar ──
    const handleStep1Next = (e) => {
        e.preventDefault()
        setError(null)
        const cleanName = formData.name.trim()
        const cleanLocation = formData.location.trim()
        if (cleanName.length < 3) return setError('El nombre del torneo debe tener al menos 3 caracteres.')
        if (cleanLocation.length < 3) return setError('La ubicación debe tener al menos 3 caracteres.')
        if (!formData.start_date || !formData.end_date) return setError('Las fechas son requeridas.')
        if (formData.end_date < formData.start_date) return setError('La fecha de fin no puede ser anterior a la de inicio.')
        
        if (tournamentToEdit) {
            handleSubmit() // Si edita, guardar directamente en el paso 1
        } else {
            setStep(2)
        }
    }

    // ── Manejo de partidos del calendario ──
    const addMatch = () => setMatches(prev => [...prev, emptyMatch()])

    const removeMatch = (key) => setMatches(prev => prev.filter(m => m._key !== key))

    const updateMatch = (key, field, value) => {
        setMatches(prev => prev.map(m => m._key === key ? { ...m, [field]: value } : m))
    }

    // ── Guardar todo ──
    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        try {
            const finalCostBreakdown = costMode === 'detailed' ? costBreakdown.filter(item => item.name.trim() !== '') : []
            const computedCost = costMode === 'detailed'
                ? finalCostBreakdown.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
                : (formData.cost_per_player ? parseFloat(formData.cost_per_player) : 0)

            if (tournamentToEdit) {
                // Actualizar torneo existente
                const { error: tError } = await supabase
                    .from('tournaments')
                    .update({
                        name: formData.name.trim(),
                        location: formData.location.trim(),
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        cost_per_player: computedCost,
                        cost_breakdown: finalCostBreakdown,
                        description: formData.description,
                        status: formData.status
                    })
                    .eq('id', tournamentToEdit.id)

                if (tError) throw tError
            } else {
                // Crear el torneo
                const { data: tournament, error: tError } = await supabase
                    .from('tournaments')
                    .insert({
                        club_id: clubId,
                        name: formData.name.trim(),
                        location: formData.location.trim(),
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        cost_per_player: computedCost,
                        cost_breakdown: finalCostBreakdown,
                        description: formData.description,
                        status: formData.status
                    })
                    .select('id')
                    .single()

                if (tError) throw tError

                // Insertar partidos del calendario si los hay
                const validMatches = matches.filter(m => m.match_date && m.opponent.trim())
                if (validMatches.length > 0) {
                    const scheduleRows = validMatches.map(m => ({
                        tournament_id: tournament.id,
                        match_date: m.match_date,
                        match_time: m.match_time || null,
                        opponent: m.opponent.trim(),
                        venue: m.venue.trim() || null,
                        phase: m.phase || 'Fase de grupos',
                        notes: m.notes.trim() || null,
                        status: 'scheduled'
                    }))

                    const { error: sError } = await supabase
                        .from('tournament_schedule')
                        .insert(scheduleRows)

                    if (sError) throw sError
                }
            }

            onSuccess()
            handleClose()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Error al guardar el torneo')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <Trophy size={20} className="text-yellow-500" />
                        <div>
                            <h2 className="font-bold text-slate-800 leading-tight">{tournamentToEdit ? 'Editar Torneo' : 'Nuevo Torneo'}</h2>
                            <p className="text-xs text-slate-400">
                                {tournamentToEdit ? 'Modifica los detalles del evento' : `Paso ${step} de 2 — ${step === 1 ? 'Información general' : 'Calendario de partidos'}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Step indicators */}
                <div className="flex px-6 pt-4 gap-2 shrink-0">
                    {[1, 2].map(s => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                step === s ? 'bg-yellow-500 border-yellow-500 text-white' :
                                step > s ? 'bg-green-500 border-green-500 text-white' :
                                'border-slate-200 text-slate-400'
                            }`}>
                                {step > s ? '✓' : s}
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-slate-800' : 'text-slate-400'}`}>
                                {s === 1 ? 'Datos del torneo' : 'Calendario (opcional)'}
                            </span>
                            {s < 2 && <div className="flex-1 h-px bg-slate-200 mx-1" />}
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* ── STEP 1: Datos del torneo ── */}
                {step === 1 && (
                    <form id="tournament-form" onSubmit={handleStep1Next} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Evento *</label>
                            <input
                                type="text" required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20 font-bold text-slate-700"
                                placeholder="Ej. Copa Nacional 2025"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ciudad / País *</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="text" required
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                                    placeholder="Ciudad, País"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha Inicio *</label>
                                <input
                                    type="date" required
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha Fin *</label>
                                <input
                                    type="date" required
                                    value={formData.end_date}
                                    min={formData.start_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-4">
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Estructura de Costos</label>
                                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setCostMode('simple')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${costMode === 'simple' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Simple
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCostMode('detailed')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${costMode === 'detailed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <LayoutList size={12} /> Detallada
                                        </button>
                                    </div>
                                </div>

                                {costMode === 'simple' ? (
                                    <div className="relative mt-2">
                                        <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="number" step="0.01" min="0"
                                            value={formData.cost_per_player}
                                            onChange={e => setFormData({ ...formData, cost_per_player: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20"
                                            placeholder="Costo total por jugadora"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        {costBreakdown.map((item, idx) => (
                                            <div key={item.id} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={e => setCostBreakdown(prev => prev.map(p => p.id === item.id ? { ...p, name: e.target.value } : p))}
                                                    placeholder="Concepto (ej. Hospedaje)"
                                                    className="flex-1 p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500/20"
                                                />
                                                <div className="relative w-24 shrink-0">
                                                    <DollarSign className="absolute left-2 top-2.5 text-slate-400" size={14} />
                                                    <input
                                                        type="number" step="0.01" min="0"
                                                        value={item.amount}
                                                        onChange={e => setCostBreakdown(prev => prev.map(p => p.id === item.id ? { ...p, amount: e.target.value } : p))}
                                                        className="w-full pl-6 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500/20"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCostBreakdown(prev => prev.filter(p => p.id !== item.id))}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setCostBreakdown(prev => [...prev, { id: Math.random().toString(), name: '', amount: '' }])}
                                                className="text-xs text-yellow-600 font-bold flex items-center gap-1 hover:text-yellow-700"
                                            >
                                                <Plus size={14} /> Añadir Ítem
                                            </button>
                                            <div className="text-sm font-bold text-slate-700">
                                                Total: ${costBreakdown.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estado Inicial</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
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
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/20 h-20 resize-none"
                                placeholder="Detalles del viaje, itinerario, etc."
                            />
                        </div>
                    </form>
                )}

                {/* ── STEP 2: Calendario ── */}
                {step === 2 && (
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">
                                    Agrega los partidos ahora o hazlo después desde los detalles del torneo.
                                </p>
                            </div>
                            <button
                                onClick={addMatch}
                                className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0"
                            >
                                <Plus size={14} /> Partido
                            </button>
                        </div>

                        {matches.length === 0 ? (
                            <div
                                onClick={addMatch}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-400 hover:bg-yellow-50/30 transition-all group"
                            >
                                <Calendar size={32} className="mx-auto text-slate-300 group-hover:text-yellow-400 mb-2 transition-colors" />
                                <p className="text-slate-400 text-sm font-medium">No hay partidos agregados.</p>
                                <p className="text-slate-300 text-xs mt-1">Clic para agregar el primer partido</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {matches.map((m, idx) => (
                                    <div key={m._key} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                                <Swords size={13} /> Partido {idx + 1}
                                            </span>
                                            <button
                                                onClick={() => removeMatch(m._key)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Rival *</label>
                                                <input
                                                    type="text"
                                                    value={m.opponent}
                                                    onChange={e => updateMatch(m._key, 'opponent', e.target.value)}
                                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400/30"
                                                    placeholder="Nombre del rival"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Fase</label>
                                                <select
                                                    value={m.phase}
                                                    onChange={e => updateMatch(m._key, 'phase', e.target.value)}
                                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400/30"
                                                >
                                                    {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Fecha *</label>
                                                <input
                                                    type="date"
                                                    value={m.match_date}
                                                    min={formData.start_date}
                                                    max={formData.end_date}
                                                    onChange={e => updateMatch(m._key, 'match_date', e.target.value)}
                                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Hora</label>
                                                <input
                                                    type="time"
                                                    value={m.match_time}
                                                    onChange={e => updateMatch(m._key, 'match_time', e.target.value)}
                                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Cancha</label>
                                                <input
                                                    type="text"
                                                    value={m.venue}
                                                    onChange={e => updateMatch(m._key, 'venue', e.target.value)}
                                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400/30"
                                                    placeholder="Coliseo Norte"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Notas</label>
                                            <input
                                                type="text"
                                                value={m.notes}
                                                onChange={e => updateMatch(m._key, 'notes', e.target.value)}
                                                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400/30"
                                                placeholder="Observaciones opcionales"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addMatch}
                                    className="w-full py-2 border border-dashed border-slate-300 text-slate-400 text-sm rounded-xl hover:border-yellow-400 hover:text-yellow-600 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={15} /> Agregar otro partido
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    {step === 1 ? (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit" form="tournament-form"
                                disabled={loading}
                                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                {tournamentToEdit ? (loading ? 'Guardando...' : 'Guardar Cambios') : (<>Siguiente <ChevronRight size={18} /></>)}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setError(null); setStep(1) }}
                                className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft size={18} /> Atrás
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                                {matches.filter(m => m.match_date && m.opponent.trim()).length > 0
                                    ? `Crear Torneo + ${matches.filter(m => m.match_date && m.opponent.trim()).length} partido(s)`
                                    : 'Crear Torneo'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
