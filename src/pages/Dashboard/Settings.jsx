import React, { useState, useEffect, useRef } from 'react'
import { Save, User, Settings as SettingsIcon, Users, Link as LinkIcon, Copy, Trash2, Shield, Plus, Lock, Loader2, FileText, Upload, CheckCircle } from 'lucide-react'
import { compressImage } from '../../utils/imageCompress'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useClubData } from '../../hooks/useClubData' // Hook

export default function Settings() {
  const { club, role, loading } = useClubData()
  const [activeTab, setActiveTab] = useState('general')

  if(loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>
  if(!club) return <div className="p-10 text-center">No se encontró información del club.</div>

  // Security guard: assistants cannot manage club configuration
  if (role === 'assistant') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
          <Lock size={32} className="text-amber-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
          <p className="text-slate-500 max-w-xs">La configuración del club es exclusiva del entrenador principal. Contacta al administrador si necesitas realizar cambios.</p>
        </div>
      </div>
    )
  }
  
  // Permissions for Settings
  // Only Admin and Owner can manage club settings
  const canManage = role === 'owner' || role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
      </div>

       {/* Tabs */}
       <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <SettingsIcon size={18} /> General
            </button>
            <button 
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'staff' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Users size={18} /> Miembros y Staff
            </button>
            <button 
                onClick={() => setActiveTab('certificates')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'certificates' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <FileText size={18} /> Certificados
            </button>
       </div>

       {activeTab === 'general' && <GeneralSettings club={club} canManage={canManage} />}
       {activeTab === 'staff' && <StaffSettings club={club} canManage={canManage} />}
       {activeTab === 'certificates' && <CertificateSettings club={club} canManage={canManage} />}
    </div>
  )
}

function GeneralSettings({ club, canManage }) {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        nombre: club.nombre || '',
        codigo: club.codigo || '',
        pais: club.pais || '',
        ciudad: club.ciudad || '',
        telefono_contacto: club.telefono_contacto || '',
        ruc_dni: club.ruc_dni || '',
        coachName: ''
    })
    const [saving, setSaving] = useState(false)
    const [fetchingProfile, setFetchingProfile] = useState(true)

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return
            try {
                const { data } = await supabase.from('profiles').select('nombre_completo').eq('id', user.id).single()
                if (data) {
                    setFormData(prev => ({ ...prev, coachName: data.nombre_completo || user?.user_metadata?.full_name || '' }))
                } else {
                    setFormData(prev => ({ ...prev, coachName: user?.user_metadata?.full_name || '' }))
                }
            } catch (err) {
                console.error("Error fetching profile", err)
            } finally {
                setFetchingProfile(false)
            }
        }
        fetchProfile()
    }, [user?.id])

    const handleSave = async (e) => {
        e.preventDefault()
        if(!canManage) return

        setSaving(true)
        try {
            const { error: clubError } = await supabase
                .from('clubs')
                .update({ 
                    nombre: formData.nombre,
                    pais: formData.pais,
                    ciudad: formData.ciudad,
                    telefono_contacto: formData.telefono_contacto,
                    ruc_dni: formData.ruc_dni
                })
                .eq('id', club.id)

            if (clubError) throw clubError

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ nombre_completo: formData.coachName })
                .eq('id', user.id)

            if (profileError) throw profileError

            await supabase.auth.updateUser({
                data: { full_name: formData.coachName }
            })

            alert('Configuración guardada exitosamente')
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (fetchingProfile) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl relative overflow-hidden">
            {!canManage && (
                <div className="absolute top-4 right-4 text-slate-400" title="Solo lectura">
                    <Lock size={20} />
                </div>
            )}
            <form onSubmit={handleSave} className="space-y-8">
                {/* Datos del Club */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Datos del Club</h3>
                    <div className="space-y-4">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">País</label>
                                 <input 
                                    type="text" 
                                    value={formData.pais} 
                                    onChange={e => setFormData({...formData, pais: e.target.value})}
                                    disabled={!canManage}
                                    className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`} 
                                />
                            </div>
                            <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ciudad</label>
                                 <input 
                                    type="text" 
                                    value={formData.ciudad} 
                                    onChange={e => setFormData({...formData, ciudad: e.target.value})}
                                    disabled={!canManage}
                                    className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`} 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                                 <input 
                                    type="text" 
                                    value={formData.telefono_contacto} 
                                    onChange={e => setFormData({...formData, telefono_contacto: e.target.value})}
                                    disabled={!canManage}
                                    className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`} 
                                    placeholder="Ej: 0999999999"
                                />
                            </div>
                            <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">RUC / DNI</label>
                                 <input 
                                    type="text" 
                                    value={formData.ruc_dni} 
                                    onChange={e => setFormData({...formData, ruc_dni: e.target.value})}
                                    disabled={!canManage}
                                    className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`} 
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código de Invitación / ID</label>
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
                                    className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-100 rounded-lg hover:bg-slate-200"
                                    title="Copiar código"
                                >
                                    <Copy size={18} />
                                </button>
                             </div>
                             <p className="text-[10px] text-slate-400 mt-1">Comparte este código para que los asistentes se unan a tu club.</p>
                        </div>
                    </div>
                </div>

                {/* Datos del Entrenador */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Mi Perfil (Entrenador)</h3>
                    <div className="space-y-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                             <input 
                                type="text" 
                                value={formData.coachName} 
                                onChange={e => setFormData({...formData, coachName: e.target.value})}
                                disabled={!canManage}
                                className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 font-medium ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`} 
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
                             <input 
                                type="email" 
                                value={user?.email || ''} 
                                disabled
                                className="w-full p-2 bg-slate-100 border rounded-lg text-slate-500 text-sm cursor-not-allowed" 
                            />
                            <p className="text-[10px] text-slate-400 mt-1">El correo electrónico no puede ser modificado.</p>
                        </div>
                    </div>
                </div>

                {canManage && (
                    <div className="pt-4 flex justify-end">
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

// ─── Certificate Settings ──────────────────────────────────────────────────────

function CertificateSettings({ club, canManage }) {
    const signatureInputRef = useRef(null)
    const [formData, setFormData] = useState({
        coach_certificate_name: club.coach_certificate_name || '',
        coach_certificate_title: club.coach_certificate_title || 'Entrenador',
        ministerial_agreement: club.ministerial_agreement || '',
        club_email: club.club_email || ''
    })
    const [signaturePreview, setSignaturePreview] = useState(club.coach_signature_url || null)
    const [uploadingSignature, setUploadingSignature] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleSignatureUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { alert('Por favor selecciona una imagen válida (PNG recomendado).'); return }
        setUploadingSignature(true)
        try {
            const compressed = await compressImage(file, 600, 0.9)
            const path = `signatures/${club.id}/firma_entrenador.png`
            const { error: uploadError } = await supabase.storage
                .from('club-assets')
                .upload(path, compressed, { upsert: true, contentType: 'image/png' })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('club-assets').getPublicUrl(path)
            const urlWithBust = `${publicUrl}?t=${Date.now()}`
            await supabase.from('clubs').update({ coach_signature_url: publicUrl }).eq('id', club.id)
            setSignaturePreview(urlWithBust)
        } catch (err) {
            alert('Error al subir la firma: ' + err.message)
            console.error(err)
        } finally {
            setUploadingSignature(false)
            if (signatureInputRef.current) signatureInputRef.current.value = ''
        }
    }

    const handleRemoveSignature = async () => {
        if (!confirm('¿Eliminar la firma actual?')) return
        try {
            await supabase.from('clubs').update({ coach_signature_url: null }).eq('id', club.id)
            setSignaturePreview(null)
        } catch (err) { alert('Error al eliminar firma: ' + err.message) }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!canManage) return
        setSaving(true)
        try {
            const { error } = await supabase.from('clubs').update({
                coach_certificate_name: formData.coach_certificate_name || null,
                coach_certificate_title: formData.coach_certificate_title || null,
                ministerial_agreement: formData.ministerial_agreement || null,
                club_email: formData.club_email || null
            }).eq('id', club.id)
            if (error) throw error
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">

            {/* Signature Upload Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-1 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Upload size={18} className="text-primary" /> Firma Digital del Entrenador
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                    Sube una imagen PNG con fondo transparente de tu firma. Se usará automáticamente en todos los certificados generados.
                </p>

                {signaturePreview ? (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <img
                            src={signaturePreview}
                            alt="Firma actual"
                            className="h-16 object-contain bg-white border border-slate-200 rounded-lg px-3 py-1"
                        />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-700">Firma cargada correctamente</p>
                            <p className="text-xs text-slate-400">Se usará en todos los certificados</p>
                        </div>
                        {canManage && (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => signatureInputRef.current?.click()}
                                    disabled={uploadingSignature}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    {uploadingSignature ? 'Subiendo...' : 'Cambiar'}
                                </button>
                                <button
                                    onClick={handleRemoveSignature}
                                    className="text-xs font-bold text-red-400 hover:underline"
                                >
                                    Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        onClick={() => canManage && signatureInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                            canManage ? 'border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer' : 'border-slate-200 cursor-not-allowed'
                        }`}
                    >
                        {uploadingSignature ? (
                            <Loader2 className="mx-auto animate-spin text-primary mb-2" size={28} />
                        ) : (
                            <Upload size={28} className="mx-auto text-slate-300 mb-2" />
                        )}
                        <p className="text-sm font-medium text-slate-500">
                            {uploadingSignature ? 'Subiendo firma...' : (canManage ? 'Clic para subir imagen de firma (PNG recomendado)' : 'Sin firma configurada')}
                        </p>
                        {canManage && <p className="text-xs text-slate-400 mt-1">PNG con fondo transparente da mejores resultados</p>}
                    </div>
                )}

                <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload}
                />
            </div>

            {/* Certificate Data Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                {!canManage && (
                    <div className="absolute top-4 right-4 text-slate-400" title="Solo lectura">
                        <Lock size={20} />
                    </div>
                )}
                <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Datos para los Certificados
                </h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Entrenador (en certificados)</label>
                            <input
                                type="text"
                                value={formData.coach_certificate_name}
                                onChange={e => setFormData({ ...formData, coach_certificate_name: e.target.value })}
                                disabled={!canManage}
                                placeholder="Ej. Prof. Marcos Pérez Mosquera"
                                className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 font-medium ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cargo / Título</label>
                            <input
                                type="text"
                                value={formData.coach_certificate_title}
                                onChange={e => setFormData({ ...formData, coach_certificate_title: e.target.value })}
                                disabled={!canManage}
                                placeholder="Ej. Presidente, Entrenador Principal"
                                className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Acuerdo Ministerial</label>
                            <input
                                type="text"
                                value={formData.ministerial_agreement}
                                onChange={e => setFormData({ ...formData, ministerial_agreement: e.target.value })}
                                disabled={!canManage}
                                placeholder="Ej. MD-CZ6-2021-035"
                                className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo del Club (en certificados)</label>
                            <input
                                type="email"
                                value={formData.club_email}
                                onChange={e => setFormData({ ...formData, club_email: e.target.value })}
                                disabled={!canManage}
                                placeholder="clubejemplo@gmail.com"
                                className={`w-full p-2 bg-slate-50 border rounded-lg text-slate-900 ${!canManage ? 'cursor-not-allowed opacity-75' : 'focus:ring-2 focus:ring-primary/20 outline-none border-slate-200'}`}
                            />
                        </div>
                    </div>

                    {canManage && (
                        <div className="pt-2 flex justify-end items-center gap-3">
                            {saved && (
                                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                    <CheckCircle size={16} /> Guardado
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}

function StaffSettings({ club, canManage }) {
    const { user } = useAuth()
    const [members, setMembers] = useState([])
    const [invitations, setInvitations] = useState([])
    const [requests, setRequests] = useState([])
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

    const fetchRequests = React.useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('club_requests')
                .select('*, profiles(nombre_completo)')
                .eq('club_id', club.id)
                .eq('status', 'pending')
            if (!error && data) {
                setRequests(data)
            }
        } catch (err) {
            // Tabla podría no existir aún, ignorar.
        }
    }, [club])

    useEffect(() => {
        if (club) {
            fetchMembers()
            fetchInvitations()
            fetchRequests()
        }
    }, [club, fetchMembers, fetchInvitations, fetchRequests])

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

    const handleApproveRequest = async (req) => {
        if (!canManage) return
        setLoading(true)
        try {
            const { error: memberError } = await supabase.from('club_members').insert({
                club_id: club.id,
                profile_id: req.profile_id,
                role_in_club: req.role_requested || 'assistant'
            })
            if (memberError) throw memberError

            const { error: reqError } = await supabase.from('club_requests').update({ status: 'approved' }).eq('id', req.id)
            if (reqError) throw reqError

            fetchRequests()
            fetchMembers()
        } catch (err) {
            console.error(err)
            alert("Error al aprobar solicitud: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleRejectRequest = async (req) => {
        if (!confirm("¿Seguro que deseas rechazar esta solicitud?")) return
        await supabase.from('club_requests').update({ status: 'rejected' }).eq('id', req.id)
        fetchRequests()
    }

    const handleRevokeMember = async (memberId, memberName) => {
        if (!canManage) return
        if (!confirm(`¿Revocar el acceso de ${memberName}? Esto eliminará su acceso al club inmediatamente.`)) return
        try {
            const { error } = await supabase.from('club_members').delete().eq('id', memberId)
            if (error) throw error
            fetchMembers()
        } catch (err) {
            alert('Error al revocar acceso: ' + err.message)
        }
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
                             <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                        {m.profiles?.nombre_completo?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{m.profiles?.nombre_completo}</p>
                                        <p className="text-xs text-slate-500 capitalize">{m.role_in_club || m.rol || m.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                        (m.role_in_club || m.role || m.rol) === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                        (m.role_in_club || m.role || m.rol) === 'coach' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {(m.role_in_club || m.role || m.rol) === 'assistant' ? 'Asistente' : (m.role_in_club || m.role || m.rol)}
                                    </span>
                                    {canManage && (
                                        <button
                                            onClick={() => handleRevokeMember(m.id, m.profiles?.nombre_completo || 'este miembro')}
                                            title="Revocar acceso"
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Requests and Invitations */}
            <div className="space-y-6">
                 
                 {/* Solicitudes de Código (New Flow) */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative">
                    {!canManage && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Lock size={16} /> Solo Administradores
                            </div>
                        </div>
                    )}
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <Users size={18} className="text-amber-500"/> Solicitudes Pendientes
                    </h3>
                    <div className="space-y-3">
                        {requests.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-4">No hay solicitudes de acceso.</p>
                        ) : requests.map(req => (
                            <div key={req.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{req.profiles?.nombre_completo || 'Usuario Desconocido'}</p>
                                    <p className="text-xs text-slate-500">Solicita rol: {req.role_requested === 'assistant' ? 'Asistente' : req.role_requested}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleApproveRequest(req)} 
                                        disabled={loading}
                                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow transition-colors disabled:opacity-50"
                                    >
                                        Aprobar
                                    </button>
                                    <button 
                                        onClick={() => handleRejectRequest(req)} 
                                        disabled={loading}
                                        className="px-3 py-1 bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 text-xs font-bold rounded transition-colors disabled:opacity-50"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Invitaciones Link (Old Flow) */}
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
