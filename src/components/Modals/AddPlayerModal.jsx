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
        height: '',
        position: 'Punta', // Default
        jersey_number: '',
        // Multi-team selection
        selectedTeams: []
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
                height: '',
                position: 'Punta',
                jersey_number: '',
                selectedTeams: []
            })
            setError(null)
        }
    }, [isOpen])

    async function fetchTeams() {
        try {
            let { data: clubData } = await supabase.from('clubs').select('id').eq('created_by', user.id).single()

            if (!clubData) {
                const { data: memberData } = await supabase.from('club_members').select('club_id').eq('profile_id', user.id).single()
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

    const toggleTeam = (teamId) => {
        setFormData(prev => {
            const exists = prev.selectedTeams.includes(teamId)
            if (exists) {
                return { ...prev, selectedTeams: prev.selectedTeams.filter(id => id !== teamId) }
                className = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                value = { formData.dob }
                onChange = { e => setFormData({ ...formData, dob: e.target.value })
}
                                    />
                                </div >
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Género</label>
        <select
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            value={formData.gender}
            onChange={e => setFormData({ ...formData, gender: e.target.value })}
        >
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
        </select>
    </div>
                            </div >
                        </div >

    {/* Technical Info */ }
    < div className = "space-y-4" >
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
                        </div >

    {/* Assignment */ }
    < div className = "space-y-4" >
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
                        </div >

                    </form >
                </div >

    {/* Footer */ }
    < div className = "flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl sticky bottom-0 z-10" >
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
                </div >
            </div >
        </div >
    )
}
