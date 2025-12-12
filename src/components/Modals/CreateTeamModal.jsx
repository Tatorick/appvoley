import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Loader2, Save, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated, teamToEdit = null }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    gender: 'Mixto'
  })

  // Reset or Fill Form
  useEffect(() => {
    if (isOpen) {
       fetchCategories()
       if (teamToEdit) {
           setFormData({
               name: teamToEdit.nombre,
               categoryId: teamToEdit.category_id,
               gender: teamToEdit.genero || 'Mixto'
           })
           setShowNewCategoryInput(false)
       } else {
           setFormData({ name: '', categoryId: '', gender: 'Mixto' })
           setShowNewCategoryInput(false)
       }
    }
  }, [isOpen, teamToEdit])

  const fetchCategories = async () => {
      try {
          // Fetch system categories (club_id is null) OR club categories
          // We assume we can see all categories for now. 
          // RLS usually allows public read on categories or we need policy?
          // Schema says: "categories" -> RLS enabled. Policy?
          // We might need a SELECT policy for categories too if not public.
          // Let's assume we can read them.
          
          let { data, error } = await supabase.from('categories').select('*')
          if (error) throw error

          // Seeding if empty (Client side check for simplicity, though Backend is better)
          if (!data || data.length === 0) {
              // ... Reuse seeding logic or assume user creates one ...
              // Let's just allow empty list and user creates new.
          }
          setCategories(data || [])
      } catch (error) {
          console.error('Error loading categories:', error)
      }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
        // Get Club ID
        const { data: clubData, error: clubError } = await supabase.from('clubs').select('id').eq('created_by', user.id).single()
        if (clubError) throw new Error('No se encontró el club')

        let finalCategoryId = formData.categoryId

        // Handle New Category Creation
        if (showNewCategoryInput) {
            if (!newCategoryName.trim()) throw new Error('Escribe el nombre de la nueva categoría')
            
            const { data: newCat, error: catError } = await supabase.from('categories').insert({
                nombre: newCategoryName,
                club_id: clubData.id,
                // Default ages, can be edited later? Or ask? For now specific defaults.
                edad_min: 0, 
                edad_max: 99
            }).select().single()

            if (catError) throw catError
            finalCategoryId = newCat.id
        }

        if (teamToEdit) {
            // Update
            const { error } = await supabase.from('teams').update({
                nombre: formData.name,
                category_id: finalCategoryId,
                genero: formData.gender
            }).eq('id', teamToEdit.id)
            if (error) throw error
        } else {
            // Create
            const { error } = await supabase.from('teams').insert({
                nombre: formData.name,
                category_id: finalCategoryId,
                genero: formData.gender,
                club_id: clubData.id
            })
            if (error) throw error
        }

        onTeamCreated()
        onClose()
    } catch (err) {
        console.error(err)
        alert('Error: ' + err.message)
    } finally {
        setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">{teamToEdit ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Equipo</label>
                <input 
                    type="text" required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Ej: Águilas A"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Género</label>
                    <select 
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                    >
                        <option value="Mixto">Mixto</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                    </select>
                </div>
                
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                    
                    {!showNewCategoryInput ? (
                        <div className="flex gap-2">
                            <select 
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={formData.categoryId}
                                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                            >
                                <option value="">Seleccionar</option>
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
                                placeholder="Nombre: Ej. Post 35"
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

            <div className="pt-4 flex justify-end gap-3">
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
