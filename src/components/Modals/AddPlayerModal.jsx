import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Loader2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { validateId } from '../../utils/validations'

export default function AddPlayerModal({ isOpen, onClose, onPlayerAdded }) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Data for Selects
    const [teams, setTeams] = useState([])

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        dni: '', // Cédula
        dob: '',
        gender: 'Femenino', // Default
        phone: '',
        height: '',
        position: 'Punta', // Default
        jersey_number: '',
        // Multi-team selection
        selectedTeams: [],
        // Legal Representative
        legal_rep_name: '',
        legal_rep_surname: '',
        legal_rep_phone: '',
        legal_rep_dni: '',
        // Education (for certificates)
        school_name: '',
        school_principal: '',
        school_principal_title: 'Lic.',
        school_grade: ''
    })

    // Club ID storage
    const [clubId, setClubId] = useState(null)

    useEffect(() => {
        if (isOpen) {
            fetchTeams()
            // Reset form
            setFormData({
                first_name: '',
                last_name: '',
                dni: '',
                dob: '',
                gender: 'Femenino',
                phone: '',
                height: '',
                position: 'Punta',
                jersey_number: '',
                selectedTeams: [],
                legal_rep_name: '',
                legal_rep_surname: '',
                legal_rep_phone: '',
                legal_rep_dni: '',
                school_name: '',
                school_principal: '',
                school_principal_title: 'Lic.',
                school_grade: ''
            })
            setError(null)
        }
    }, [isOpen])

    async function fetchTeams() {
        try {
            let { data: clubData } = await supabase.from('clubs').select('id').eq('created_by', user.id).maybeSingle()

            if (!clubData) {
                const { data: memberData } = await supabase.from('club_members').select('club_id').eq('profile_id', user.id).maybeSingle()
                if (memberData) clubData = { id: memberData.club_id }
            }

            if (clubData) {
                setClubId(clubData.id)
                const { data } = await supabase
                    .from('teams')
                    .select('id, nombre, categories(nombre, edad_min, edad_max)')
                    .eq('club_id', clubData.id)
                    .order('created_at', { ascending: false })

                if (data) setTeams(data)
            }
        } catch (err) {
            console.error('Error fetching teams for select:', err)
        }
    }

    const checkDni = async (val) => {
        const dniToCheck = val || formData.dni
        if (!dniToCheck || dniToCheck.length < 10) return

        try {
            const { data, error } = await supabase
                .from('players')
                .select('id, club_id')
                .eq('dni', dniToCheck)
                .maybeSingle()

            if (error) throw error

            if (data) {
                if (data.club_id === clubId) {
                    setError(`Ya existe un jugador con cédula ${dniToCheck} en este club.`)
                } else {
                    setError(`El jugador con cédula ${dniToCheck} ya está registrado en otro club.`)
                }
            } else {
                // DNI is available — clear any previous DNI-related error
                setError(null)
            }
        } catch (err) {
            console.error('Error checking DNI:', err)
        }
    }

    const toggleTeam = (teamId) => {
        setFormData(prev => {
            const exists = prev.selectedTeams.includes(teamId)
            if (exists) {
                return { ...prev, selectedTeams: prev.selectedTeams.filter(id => id !== teamId) }
            } else {
                return { ...prev, selectedTeams: [...prev.selectedTeams, teamId] }
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!clubId) throw new Error("No se pudo identificar el club.")

            // Validate required fields
            if (!formData.first_name.trim()) throw new Error("El nombre es obligatorio.")
            if (!formData.last_name.trim()) throw new Error("Los apellidos son obligatorios.")
            if (!formData.dni.trim()) throw new Error("La Cédula de Identidad es obligatoria.")
            if (!formData.dob) throw new Error("La fecha de nacimiento es obligatoria.")
            if (!formData.gender) throw new Error("El género es obligatorio.")

            // Validate ID format
            if (!validateId(formData.dni)) {
                throw new Error("La Cédula de Identidad ingresada no es válida (Ecuador).")
            }

            // PRE-CHECK: Verify DNI uniqueness before inserting to avoid orphan records
            if (formData.dni) {
                const { data: existing } = await supabase
                    .from('players')
                    .select('id, club_id')
                    .eq('dni', formData.dni)
                    .maybeSingle()

                if (existing) {
                    if (existing.club_id === clubId) {
                        throw new Error(`Ya existe un jugador con cédula ${formData.dni} en este club.`)
                    } else {
                        throw new Error(`El jugador con cédula ${formData.dni} ya está registrado en otro club. Si deseas transferirlo, primero debe ser dado de baja.`)
                    }
                }
            }

            // PRE-CHECK: Verify Jersey Number uniqueness within the club and gender
            if (formData.jersey_number) {
                const { data: existingPlayer, error: checkError } = await supabase
                    .from('players')
                    .select('id, first_name, last_name')
                    .eq('club_id', clubId)
                    .eq('gender', formData.gender)
                    .eq('jersey_number', parseInt(formData.jersey_number))
                    .maybeSingle()

                if (checkError) throw checkError
                if (existingPlayer) {
                    throw new Error(`El número de camiseta ${formData.jersey_number} ya está en uso por ${existingPlayer.first_name} ${existingPlayer.last_name} en la rama ${formData.gender}.`)
                }
            }

            // 1. Insert Player (Core Data)
            const { data: playerData, error: insertError } = await supabase
                .from('players')
                .insert({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    dni: formData.dni || null,
                    dob: formData.dob || null,
                    gender: formData.gender,
                    phone: formData.phone || null,
                    height: formData.height ? parseInt(formData.height) : null,
                    position: formData.position,
                    jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
                    club_id: clubId,
                    legal_rep_name: formData.legal_rep_name || null,
                    legal_rep_surname: formData.legal_rep_surname || null,
                    legal_rep_phone: formData.legal_rep_phone || null,
                    legal_rep_dni: formData.legal_rep_dni || null,
                    school_name: formData.school_name || null,
                    school_principal: formData.school_principal || null,
                    school_principal_title: formData.school_principal_title || 'Lic.',
                    school_grade: formData.school_grade || null
                })
                .select()
                .single()

            if (insertError) {
                // Fallback: catch any DB-level duplicate key violation
                if (insertError.code === '23505' || insertError.message?.includes('players_dni_key') || insertError.message?.includes('duplicate key')) {
                    throw new Error(`Ya existe un jugador con esa cédula en el sistema.`)
                }
                throw insertError
            }

            const newPlayerId = playerData.id

            // 2. Insert Assignments (Sequentially to catch individual team errors like Age Validation)
            const errors = []
            for (const teamId of formData.selectedTeams) {
                const { error: assignError } = await supabase
                    .from('team_assignments')
                    .insert({
                        player_id: newPlayerId,
                        team_id: teamId
                    })

                if (assignError) {
                    // If it's a trigger error (P0001), grab the message
                    const msg = assignError.code === 'P0001' ? assignError.message : `Error en asignación: ${assignError.message}`
                    // Get team name for context
                    const teamName = teams.find(t => t.id === teamId)?.nombre || 'Equipo'
                    errors.push(`${teamName}: ${msg}`)
                }
            }

            if (errors.length > 0) {
                // Note: Player was created successfully, but some team assignments failed.
                // We still call onPlayerAdded so the player appears in the list.
                onPlayerAdded()
                onClose()
                // Show error after close (can be converted to toast in UI)
                console.warn('Asignaciones parciales fallaron:', errors.join(', '))
                return
            }

            onPlayerAdded()
            onClose()
        } catch (err) {
            console.error("Error creating player:", err)
            setError(err.message || "Error al crear jugador")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-900">Nuevo Jugador</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 pt-2">

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="shrink-0 mt-0.5" size={20} />
                            <div className="whitespace-pre-line text-sm">
                                <h4 className="font-bold">Error</h4>
                                {error}
                            </div>
                        </div>
                    )}

                    <form id="add-player-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Datos Personales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
                                        Nombres <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Ej. Juan Carlos"
                                        value={formData.first_name}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
                                        Apellidos <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Ej. Pérez López"
                                        value={formData.last_name}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
                                        Cédula de Identidad <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" required maxLength={13}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium font-mono tracking-widest"
                                        placeholder="1712345678"
                                        value={formData.dni}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '') // only digits
                                            setFormData({ ...formData, dni: val })
                                            if (error) setError(null)
                                            if (val.length === 10) checkDni(val)
                                        }}
                                        onBlur={() => checkDni(formData.dni)}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">10 dígitos — Cédula ecuatoriana válida requerida.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
                                        Fecha de Nacimiento <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date" required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        value={formData.dob}
                                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
                                        Género <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Femenino">Femenino</option>
                                        <option value="Masculino">Masculino</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Teléfono / WhatsApp</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium font-mono"
                                        placeholder="09XXXXXXXX"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g,'') })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Technical Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Ficha Técnica
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Altura (cm)</label>
                                    <input
                                        type="number" min="100" max="250"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="175"
                                        value={formData.height}
                                        onChange={e => setFormData({ ...formData, height: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Posición</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    >
                                        <option value="Punta">Punta</option>
                                        <option value="Opuesto">Opuesto</option>
                                        <option value="Central">Central</option>
                                        <option value="Armador">Armador</option>
                                        <option value="Libero">Libero</option>
                                        <option value="Universal">Universal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Dorsal (#)</label>
                                    <input
                                        type="number" min="0" max="99"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="10"
                                        value={formData.jersey_number}
                                        onChange={e => setFormData({ ...formData, jersey_number: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legal Representative (Optional) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Representante Legal (Opcional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Nombres</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Ej. María Teresa"
                                        value={formData.legal_rep_name}
                                        onChange={e => setFormData({ ...formData, legal_rep_name: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Apellidos</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Ej. López Gómez"
                                        value={formData.legal_rep_surname}
                                        onChange={e => setFormData({ ...formData, legal_rep_surname: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Cédula / DNI</label>
                                    <input
                                        type="text" maxLength={13}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium font-mono"
                                        placeholder="1700000000"
                                        value={formData.legal_rep_dni}
                                        onChange={e => setFormData({ ...formData, legal_rep_dni: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Teléfono / WhatsApp</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium font-mono"
                                        placeholder="09XXXXXXXX"
                                        value={formData.legal_rep_phone}
                                        onChange={e => setFormData({ ...formData, legal_rep_phone: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Education Info (for certificates) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Institución Educativa
                                <span className="text-[10px] font-normal normal-case bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">Para certificados</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Nombre de la Institución</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Ej. Cambridge School of Languages"
                                        value={formData.school_name}
                                        onChange={e => setFormData({ ...formData, school_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Título del Rector</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        value={formData.school_principal_title}
                                        onChange={e => setFormData({ ...formData, school_principal_title: e.target.value })}
                                    >
                                        <option value="Lic.">Lic.</option>
                                        <option value="Dr.">Dr.</option>
                                        <option value="Dra.">Dra.</option>
                                        <option value="Ing.">Ing.</option>
                                        <option value="Mgs.">Mgs.</option>
                                        <option value="Prof.">Prof.</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Nombre del Rector/Director</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Ej. Tatiana Tinoco"
                                        value={formData.school_principal}
                                        onChange={e => setFormData({ ...formData, school_principal: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Curso / Nivel Actual</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Ej. 3ro de Bachillerato · Nivel Teens 8°"
                                        value={formData.school_grade}
                                        onChange={e => setFormData({ ...formData, school_grade: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assignment */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Asignación de Equipos
                                </h3>
                                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                                    {formData.selectedTeams.length} seleccionados
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                                {teams.length === 0 ? (
                                    <p className="text-sm text-slate-400 col-span-2 text-center py-4 italic">No hay equipos disponibles.</p>
                                ) : teams.map(team => {
                                    const isSelected = formData.selectedTeams.includes(team.id)
                                    return (
                                        <div
                                            key={team.id}
                                            onClick={() => toggleTeam(team.id)}
                                            className={`
                                        cursor-pointer relative p-3 rounded-xl border flex items-center justify-between transition-all group
                                        ${isSelected
                                                    ? 'bg-primary/5 border-primary shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                                }
                                    `}
                                        >
                                            <div>
                                                <h4 className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                                                    {team.nombre}
                                                </h4>
                                                <p className="text-xs text-slate-500">{team.categories?.nombre}</p>
                                            </div>
                                            <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center transition-all
                                        ${isSelected ? 'bg-primary text-white scale-110' : 'bg-slate-100 text-transparent group-hover:bg-slate-200'}
                                    `}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-slate-400">
                                * Puedes asignar al jugador a múltiples equipos. La edad máxima de cada categoría será validada.
                            </p>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="add-player-form"
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 transform active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Jugador</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
