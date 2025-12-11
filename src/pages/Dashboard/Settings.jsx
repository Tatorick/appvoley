import React, { useState, useEffect } from 'react'
import { Save, User, Settings as SettingsIcon, Users, Link as LinkIcon, Copy, Trash2, Shield, Plus, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useClubData } from '../../hooks/useClubData' // Hook

export default function Settings() {
  const { club, role, loading } = useClubData()
  const [activeTab, setActiveTab] = useState('general')

  if(loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>
  if(!club) return <div className="p-10 text-center">No se encontró información del club.</div>
  
  // Permissions for Settings
  // Only Admin and Owner can manage club settings
  const canManage = role === 'owner' || role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
      </div>

       {/* Tabs */}
       <div className="flex gap-2 border-b border-slate-200 mb-6">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <SettingsIcon size={18} /> General
            </button>
            <button 
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${activeTab === 'staff' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Users size={18} /> Miembros y Staff
            </button>
       </div>

       {activeTab === 'general' && <GeneralSettings club={club} canManage={canManage} />}
       {activeTab === 'staff' && <StaffSettings club={club} canManage={canManage} />}
    </div>
  )
}

function GeneralSettings({ club, canManage }) {
    const [formData, setFormData] = useState({
        nombre: club.nombre || '',
        codigo: club.codigo || ''
    })
    const [saving, setSaving] = useState(false)

    const handleSave = async (e) => {
        e.preventDefault()
        if(!canManage) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('clubs')
                .update({ nombre: formData.nombre }) // Code usually not editable or handled separately? Let's allow Name edit.
                .eq('id', club.id)

            if (error) throw error
            alert('Configuración guardada')
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl relative overflow-hidden">
            {!canManage && (
                <div className="absolute top-4 right-4 text-slate-400" title="Solo lectura">
                    <Lock size={20} />
                </div>
            )}
            <h3 className="font-bold text-slate-900 mb-4">Datos del Club</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Club</label>
                     <input 
                        type="text" 
                        value={formData.nombre} 
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        disabled={!canManage}
                        className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 font-medium ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`} 
                    />
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código / ID</label>
                     <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            disabled 
                            value={formData.codigo} 
                            className="w-full p-2 bg-slate-100 border rounded-lg text-slate-500 font-mono text-sm cursor-not-allowed" 
                        />
                        <button 
                            type="button" 
                            onClick={() => navigator.clipboard.writeText(formData.codigo)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="Copiar código"
                        >
                            <Copy size={18} />
                        </button>
                     </div>
                     <p className="text-[10px] text-slate-400 mt-1">Este código es único y no se puede cambiar.</p>
                </div>

                {canManage && (
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    )
}

function StaffSettings({ club, canManage }) {
    const { user } = useAuth()
    const [members, setMembers] = useState([])
    const [invitations, setInvitations] = useState([])
    const [loading, setLoading] = useState(false)
    
    // Invite Form
    const [showInviteForm, setShowInviteForm] = useState(false)
    const [inviteData, setInviteData] = useState({ role: 'assistant', email: '' }) // Email optional for link

    const [domain] = useState(window.location.origin)

    const fetchMembers = React.useCallback(async () => {
        // Now 'rol' column is correct (replaces 'role')
        const { data } = await supabase
            .from('club_members')
            .select('*, profiles(nombre_completo)')
            .eq('club_id', club.id)
        setMembers(data || [])
    }, [club])

    const fetchInvitations = React.useCallback(async () => {
        const { data } = await supabase
            .from('club_invitations')
            .select('*')
            .eq('club_id', club.id)
            .eq('status', 'pending')
        setInvitations(data || [])
    }, [club])

    useEffect(() => {
        if (club) {
            fetchMembers()
            fetchInvitations()
        }
    }, [club, fetchMembers, fetchInvitations])

    const handleCreateInvite = async (e) => {
        e.preventDefault()
        if (!canManage) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('club_invitations')
                .insert({
                    club_id: club.id,
                    role: inviteData.role,
                    email: inviteData.email || null, // Optional
                    created_by: user.id
                })
            
            if (error) throw error
            setShowInviteForm(false)
            setInviteData({ role: 'assistant', email: '' })
            fetchInvitations()
        } catch (err) {
            console.error(err)
            alert("Error al crear invitación")
        } finally {
            setLoading(false)
        }
    }

    const deleteInvitation = async (id) => {
        if(!confirm("¿Borrar invitación?")) return
        await supabase.from('club_invitations').delete().eq('id', id)
        fetchInvitations()
    }

    const copyLink = (token) => {
        const link = `${domain}/join?token=${token}`
        navigator.clipboard.writeText(link)
        alert("Enlace copiado al portapapeles: " + link)
    }

    if (!club) return null

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Left: Active Members */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Shield size={18} className="text-green-600"/> Miembros Activos
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {/* Owner card manual display since owner might not be in club_members depending on initial migration? 
                            Actually, check if owner is in the list.
                        */}
                         <div className="p-4 flex items-center justify-between bg-yellow-50/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xs border border-yellow-200">
                                    DT
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-bold text-slate-800 text-sm">Director Técnico (Dueño)</p>
                                    <p className="text-[10px] text-slate-400">Creador del Club</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded">Propietario</span>
                        </div>

                        {members.map(m => (
                             <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                        {m.profiles?.nombre_completo?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{m.profiles?.nombre_completo}</p>
                                        {/* Email might not be in profile, maybe show role only */}
                                        <p className="text-xs text-slate-500 capitalize">{m.rol || m.role}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                    (m.role || m.rol) === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                    (m.role || m.rol) === 'coach' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {/* Handle older 'rol' or 'role' just in case */}
                                    {m.role || m.rol || 'assistant'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Invitations */}
            <div className="space-y-6">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative">
                    {!canManage && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Lock size={16} /> Solo Administradores
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                             <LinkIcon size={18} className="text-primary"/> Invitaciones
                        </h3>
                        <button 
                            onClick={() => setShowInviteForm(!showInviteForm)} 
                            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors font-bold flex items-center gap-1 disabled:opacity-50"
                            disabled={!canManage}
                        >
                            <Plus size={14}/> Nueva
                        </button>
                    </div>

                    {showInviteForm && (
                        <form onSubmit={handleCreateInvite} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 animate-in fade-in">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rol</label>
                                    <select className="w-full p-2 border rounded-lg text-sm" value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value})}>
                                        <option value="assistant">Asistente</option>
                                        <option value="coach">Entrenador (Coach)</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Referencia (Opcional)</label>
                                    <input type="email" placeholder="ejemplo@correo.com" className="w-full p-2 border rounded-lg text-sm" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} />
                                    <p className="text-[10px] text-slate-400 mt-1">Solo para que sepas a quién es. El link funcionará igual.</p>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark">
                                    {loading ? 'Generando...' : 'Crear Link de Invitación'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {invitations.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-4">No hay invitaciones pendientes.</p>
                        ) : invitations.map(inv => (
                            <div key={inv.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary/50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{inv.role === 'coach' ? 'Entrenador' : inv.role === 'admin' ? 'Admin' : 'Asistente'}</p>
                                        <p className="text-xs text-slate-400">{inv.email || 'Sin email registro'}</p>
                                    </div>
                                    <button onClick={() => deleteInvitation(inv.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => copyLink(inv.token)}
                                    className="w-full flex items-center justify-center gap-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-primary text-xs font-bold rounded-lg border border-slate-100 hover:border-slate-200 transition-all"
                                >
                                    <Copy size={12}/> Copiar Link
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    )
}
