import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Loader2, Save, Plus, AlertCircle, Clock, Trophy, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const DIAS = [
  { key: 'lunes',     label: 'L', full: 'Lunes' },
  { key: 'martes',    label: 'M', full: 'Martes' },
  { key: 'miercoles', label: 'X', full: 'Miércoles' },
  { key: 'jueves',    label: 'J', full: 'Jueves' },
  { key: 'viernes',   label: 'V', full: 'Viernes' },
  { key: 'sabado',    label: 'S', full: 'Sábado' },
  { key: 'domingo',   label: 'D', full: 'Domingo' },
]

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated, teamToEdit = null }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    gender: 'Mixto',
    tipo: 'competicion',
    dias_semana: [],
    hora_inicio: '',
    hora_fin: '',
    descripcion: ''
  })

  // Reset or Fill Form
  useEffect(() => {
    if (isOpen) {
       fetchCategories()
       setError(null)
       if (teamToEdit) {
           setFormData({
               name: teamToEdit.nombre,
               categoryId: teamToEdit.category_id || '',
               gender: teamToEdit.genero || 'Mixto',
               tipo: teamToEdit.tipo || 'competicion',
               dias_semana: teamToEdit.dias_semana || [],
               hora_inicio: teamToEdit.hora_inicio?.slice(0, 5) || '',
               hora_fin: teamToEdit.hora_fin?.slice(0, 5) || '',
               descripcion: teamToEdit.descripcion || ''
           })
           setShowNewCategoryInput(false)
       } else {
           setFormData({ name: '', categoryId: '', gender: 'Mixto', tipo: 'competicion', dias_semana: [], hora_inicio: '', hora_fin: '', descripcion: '' })
           setShowNewCategoryInput(false)
       }
    }
  }, [isOpen, teamToEdit])

  const fetchCategories = async () => {
      try {
          let { data, error } = await supabase.from('categories').select('*')
          if (error) throw error
          setCategories(data || [])
      } catch (error) {
          console.error('Error loading categories:', error)
      }
  }

  const toggleDia = (dia) => {
    setFormData(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
        const cleanName = formData.name.trim()
        if (cleanName.length < 3) throw new Error('El nombre del equipo debe tener al menos 3 caracteres.')

        // Validate schedule if formativo
        if (formData.tipo === 'formativo') {
          if (formData.dias_semana.length === 0) throw new Error('Selecciona al menos un día de entrenamiento.')
          if (!formData.hora_inicio) throw new Error('Indica la hora de inicio del entrenamiento.')
          if (!formData.hora_fin) throw new Error('Indica la hora de fin del entrenamiento.')
          if (formData.hora_inicio >= formData.hora_fin) throw new Error('La hora de fin debe ser posterior a la hora de inicio.')
        }

        // Get Club ID
        const { data: clubData, error: clubError } = await supabase.from('clubs').select('id').eq('created_by', user.id).single()
        if (clubError) throw new Error('No se encontró el club')

        let finalCategoryId = formData.categoryId || null

        // Handle New Category Creation
        if (showNewCategoryInput) {
            const cleanNewCategory = newCategoryName.trim()
            if (cleanNewCategory.length < 2) throw new Error('El nombre de la categoría debe tener al menos 2 caracteres.')
            
            const { data: newCat, error: catError } = await supabase.from('categories').insert({
                nombre: cleanNewCategory,
                club_id: clubData.id,
                edad_min: 0, 
                edad_max: 99
            }).select().single()

            if (catError) throw catError
            finalCategoryId = newCat.id
        }

        const payload = {
          nombre: cleanName,
          category_id: finalCategoryId,
          genero: formData.gender,
          tipo: formData.tipo,
          dias_semana: formData.tipo === 'formativo' ? formData.dias_semana : [],
          hora_inicio: formData.tipo === 'formativo' && formData.hora_inicio ? formData.hora_inicio : null,
          hora_fin: formData.tipo === 'formativo' && formData.hora_fin ? formData.hora_fin : null,
          descripcion: formData.descripcion.trim() || null,
        }

        if (teamToEdit) {
            const { error } = await supabase.from('teams').update(payload).eq('id', teamToEdit.id)
            if (error) throw error
        } else {
            const { error } = await supabase.from('teams').insert({ ...payload, club_id: clubData.id })
            if (error) throw error
        }

        onTeamCreated()
        onClose()
    } catch (err) {
        console.error(err)
        setError(err.message)
    } finally {
        setLoading(false)
    }
  }

  if (!isOpen) return null

  const isFormativo = formData.tipo === 'formativo'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <h3 className="text-xl font-bold text-slate-900">{teamToEdit ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
            </button>
        </div>

        {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-sm animate-fade-in shrink-0">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

            {/* Tipo de equipo */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Equipo</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, tipo: 'competicion'})}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            !isFormativo
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!isFormativo ? 'bg-primary/10' : 'bg-slate-100'}`}>
                            <Trophy size={16} className={!isFormativo ? 'text-primary' : 'text-slate-400'} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Competición</p>
                            <p className="text-xs opacity-70">Selección del club</p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, tipo: 'formativo'})}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            isFormativo
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isFormativo ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            <BookOpen size={16} className={isFormativo ? 'text-emerald-600' : 'text-slate-400'} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Formativo</p>
                            <p className="text-xs opacity-70">Grupo de entrenamiento</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Nombre */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Equipo / Grupo</label>
                <input 
                    type="text" required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder={isFormativo ? 'Ej: Grupo Infantil A' : 'Ej: Selección Damas'}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>

            {/* Género + Categoría */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Género</label>
                    <select 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                    >
                        <option value="Mixto">Mixto</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                    {!showNewCategoryInput ? (
                        <div className="flex gap-2">
                            <select 
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={formData.categoryId}
                                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                            >
                                <option value="">Sin categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                            <button 
                                type="button"
                                onClick={() => setShowNewCategoryInput(true)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                title="Nueva Categoría"
                            >
                                <Plus size={20}/>
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 animate-fade-in">
                            <input 
                                type="text"
                                autoFocus
                                placeholder="Ej: Sub 14"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowNewCategoryInput(false)}
                                className="p-2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Horario — solo para grupos formativos */}
            {isFormativo && (
                <div className="space-y-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-fade-in">
                    <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                        <Clock size={15} />
                        Horario de Entrenamiento
                    </p>

                    {/* Días */}
                    <div>
                        <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Días de la Semana</label>
                        <div className="flex gap-2 flex-wrap">
                            {DIAS.map(d => (
                                <button
                                    key={d.key}
                                    type="button"
                                    onClick={() => toggleDia(d.key)}
                                    title={d.full}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all border-2 ${
                                        formData.dias_semana.includes(d.key)
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Horas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Hora Inicio</label>
                            <input
                                type="time"
                                value={formData.hora_inicio}
                                onChange={e => setFormData({...formData, hora_inicio: e.target.value})}
                                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Hora Fin</label>
                            <input
                                type="time"
                                value={formData.hora_fin}
                                onChange={e => setFormData({...formData, hora_fin: e.target.value})}
                                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-slate-700"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Descripción opcional */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                    type="text"
                    placeholder="Ej: Grupo de niñas 10-12 años, nivel iniciación"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                />
            </div>

            <div className="pt-2 flex justify-end gap-3">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> {teamToEdit ? 'Actualizar' : 'Guardar'}</>}
                </button>
            </div>
        </form>
      </div>
    </div>
  )
}
