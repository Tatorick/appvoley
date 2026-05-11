import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Activity, FileText, User, Loader2, Plus, Trash2, TrendingUp, Edit2, DollarSign, Calendar, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, MessageSquare, X, Camera, Award, School } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useClubData } from '../../hooks/useClubData'
import PlayerStats from '../../components/Dashboard/PlayerStats'
import { validateId } from '../../utils/validations'
import RegisterTransactionModal from '../../components/Modals/RegisterTransactionModal'
import { compressImage, getAvatarColor, getInitials } from '../../utils/imageCompress'
import MembershipCertificateModal from '../../components/Modals/MembershipCertificateModal'

export default function PlayerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState(null)
  const [activeTab, setActiveTab] = useState('general')
  const [correctionRequests, setCorrectionRequests] = useState([])

  // Sub-data states
  const [medical, setMedical] = useState(null)
  const [injuries, setInjuries] = useState([])
  const [assessments, setAssessments] = useState([])

  useEffect(() => {
    fetchPlayerDetails()
  }, [id])

  async function fetchPlayerDetails() {
    setLoading(true)
    try {
        const { data, error } = await supabase
            .from('players')
            .select(`
                *,
                team_assignments (
                    id, 
                    teams (id, nombre, categories(nombre))
                ),
                medical_profiles (*),
                player_injuries (*),
                physical_assessments (*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error

        setPlayer(data)
        setMedical(Array.isArray(data.medical_profiles) ? data.medical_profiles[0] : data.medical_profiles)
        setInjuries(data.player_injuries || [])
        // Sort assessments by date desc
        const sortedAssessments = (data.physical_assessments || []).sort((a,b) => new Date(b.assessment_date) - new Date(a.assessment_date))
        setAssessments(sortedAssessments)

        // Fetch correction requests for this player
        const { data: reqData } = await supabase
            .from('player_correction_requests')
            .select('*')
            .eq('player_id', data.id)
            .order('created_at', { ascending: false })
        setCorrectionRequests(reqData || [])

    } catch (err) {
        console.error("Error details:", err)
        navigate('/app/players')
    } finally {
        setLoading(false)
    }
  }

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>
  if (!player) return null

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/app/players')} className="p-2 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{player.first_name} {player.last_name}</h1>
                <p className="text-slate-500 text-sm flex gap-2">
                    <span>{player.position}</span>
                    <span>•</span>
                    <span>#{player.jersey_number || '?'}</span>
                </p>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
            <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={User} label="Perfil General" />
            <TabButton active={activeTab === 'evolution'} onClick={() => setActiveTab('evolution')} icon={TrendingUp} label="Evolución" />
            <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={DollarSign} label="Pagos" />
            <TabButton active={activeTab === 'physical'} onClick={() => setActiveTab('physical')} icon={Activity} label="Ficha Física" />
            <TabButton active={activeTab === 'medical'} onClick={() => setActiveTab('medical')} icon={FileText} label="Ficha Médica" />
            <TabButton
                active={activeTab === 'corrections'}
                onClick={() => setActiveTab('corrections')}
                icon={MessageSquare}
                label={`Solicitudes${correctionRequests.filter(r => r.status === 'pending').length > 0 ? ` (${correctionRequests.filter(r => r.status === 'pending').length})` : ''}`}
            />
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
            {activeTab === 'general' && <GeneralTab player={player} assignments={player.team_assignments} refresh={fetchPlayerDetails} />}
            {activeTab === 'evolution' && <PlayerStats playerId={player.id} clubId={player.club_id} playerName={`${player.first_name} ${player.last_name}`} />}
            {activeTab === 'payments' && <PaymentsTab player={player} />}
            {activeTab === 'medical' && <MedicalTab playerId={player.id} medicalData={medical} injuries={injuries} refresh={fetchPlayerDetails} />}
            {activeTab === 'physical' && <PhysicalTab playerId={player.id} assessments={assessments} refresh={fetchPlayerDetails} />}
            {activeTab === 'corrections' && <CorrectionRequestsTab requests={correctionRequests} playerId={player.id} refresh={fetchPlayerDetails} />}
        </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button 
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap
                ${active 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
            `}
        >
            <Icon size={18} />
            {label}
        </button>
    )
}

// --- Payments Tab ---

function PaymentsTab({ player }) {
    const [year, setYear] = useState(new Date().getFullYear())
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState(null) // 'YYYY-MM'
    const [selectedCategory, setSelectedCategory] = useState(null)

    const fetchPayments = async () => {
        setLoading(true)
        try {
            const startOfYear = `${year}-01-01`
            const endOfYear = `${year}-12-31`

            const { data, error } = await supabase
                .from('treasury_movements')
                .select('*')
                .eq('player_id', player.id)
                .eq('type', 'income')
                .is('deleted_at', null)
                .or(`payment_month.gte.${startOfYear},and(payment_month.lte.${endOfYear}),date.gte.${startOfYear},and(date.lte.${endOfYear})`)
            
            // Note: The OR logic above might be mixed. Simpler: fetch all incomes for player, filter in JS.
            // But let's refine the query: we want mainly payment_month matches.
            // If payment_month is null, fallback to date.
            
            if (error) throw error
            setPayments(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [player.id, year])

    const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]

    const getMonthStatus = (monthIndex) => {
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() // 0-11
        
        // Target "YYYY-MM"
        const targetMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
        
        // Find payment — must be a monthly fee (Cuotas), not matricula or uniform
        const payment = payments.find(p => {
            if (p.category !== 'Cuotas') return false  // Only count monthly fees
            if (p.payment_month) {
                return p.payment_month.startsWith(targetMonthStr)
            } else {
                return p.date.startsWith(targetMonthStr)
            }
        })

        if (payment) return { status: 'paid', date: payment.date, amount: payment.amount }
        
        if (year < currentYear || (year === currentYear && monthIndex < currentMonth)) {
            return { status: 'overdue' }
        }
        
        if (year === currentYear && monthIndex === currentMonth) {
            return { status: 'current' } 
        }

        return { status: 'future' }
    }

    const handleMonthClick = (monthIndex) => {
        const targetStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}` // YYYY-MM
        setSelectedMonth(targetStr)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Header / Year Selector */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <ChevronLeft size={20}/>
                    </button>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-primary"/> {year}
                    </h3>
                    <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <ChevronRight size={20}/>
                    </button>
                </div>
                <div className="text-sm text-slate-500 font-medium hidden sm:block">
                    Historial de Cuotas
                </div>
            </div>

            {/* Matrícula & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Matrículas Card */}
                 <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h4 className="text-slate-500 font-bold text-xs uppercase tracking-wide mb-1">Matrícula {year}</h4>
                        {(() => {
                            const matricula = payments.find(p => p.category === 'Matrícula' && p.date.startsWith(String(year)))
                            if (matricula) {
                                return (
                                    <div>
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
                                            <CheckCircle size={24} /> PAGADA
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Registrada el {new Date(matricula.date).toLocaleDateString()}</p>
                                    </div>
                                )
                            } else {
                                return (
                                    <div>
                                        <div className={`flex items-center gap-2 font-bold text-xl ${year < 2026 && year === new Date().getFullYear() ? 'text-slate-400' : 'text-red-500'}`}>
                                            {year < 2026 && year === new Date().getFullYear() ? 'NO APLICA' : (
                                                <><AlertCircle size={24} /> PENDIENTE</>
                                            )}
                                        </div>
                                        {year >= 2026 && (
                                            <button 
                                                onClick={() => { setSelectedCategory('Matrícula'); setIsModalOpen(true); }}
                                                className="mt-3 w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors"
                                            >
                                                Registrar Pago
                                            </button>
                                        )}
                                    </div>
                                )
                            }
                        })()}
                    </div>
                 </div>

                 {/* Uniforms / Extras Summary */}
                 <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-slate-500 font-bold text-xs uppercase tracking-wide mb-3">Uniformes e Indumentaria ({year})</h4>
                    <div className="space-y-2">
                        {payments.filter(p => p.category === 'Uniformes' || p.category === 'Material').length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No hay registros este año.</p>
                        ) : (
                            payments.filter(p => p.category === 'Uniformes' || p.category === 'Material').map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{p.description}</p>
                                        <p className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className="font-mono font-bold text-green-600">+${p.amount}</span>
                                </div>
                            ))
                        )}
                        <button 
                            onClick={() => { setSelectedCategory('Uniformes'); setIsModalOpen(true); }}
                            className="w-full mt-2 py-1.5 border border-dashed border-slate-300 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                            + Agregar Item
                        </button>
                    </div>
                 </div>
            </div>

            {/* Grid */}
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-4">Cuotas Mensuales</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {months.map((m, i) => {
                    const { status, date, amount } = getMonthStatus(i)
                    
                    let bg = 'bg-slate-50 border-slate-200'
                    let text = 'text-slate-400'
                    
                    if (status === 'paid') {
                        bg = 'bg-yellow-400 border-yellow-500 text-slate-900 shadow-sm'
                        text = 'text-slate-900'
                    } else if (status === 'overdue') {
                        if (year >= 2026 || (year === 2025 && i < new Date().getMonth() && false)) { // Disable overdue style for 2025 as per user request
                             bg = 'bg-red-500 border-red-600 text-white'
                             text = 'text-white'
                        } else {
                             // Soft overdue for 2025 (or just look like future/pending)
                             bg = 'bg-slate-100 border-slate-200'
                        }
                    } else if (status === 'current') {
                        bg = 'bg-yellow-100 border-yellow-300'
                        text = 'text-yellow-800'
                    }

                    return (
                        <button 
                            key={m}
                            disabled={status === 'paid'}
                            onClick={() => { setSelectedCategory('Cuotas'); handleMonthClick(i); }}
                            className={`
                                relative p-2 rounded-xl border-2 transition-all duration-200 
                                flex flex-col items-center justify-center gap-1 h-24
                                ${bg} 
                                ${status !== 'paid' ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
                            `}
                        >
                            <span className={`text-sm font-bold uppercase ${text}`}>{m}</span>
                            
                             {status === 'paid' && (
                                <div className="flex flex-col items-center">
                                    <CheckCircle size={16} className="text-slate-900/50 mb-1"/>
                                </div>
                             )}
                             
                             {status === 'overdue' && year >= 2026 && (
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold bg-white/20 px-1 rounded">PENDIENTE</span>
                                </div>
                             )}

                             {status === 'future' && (
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-slate-300">-</span>
                                </div>
                             )}
                        </button>
                    )
                })}
            </div>

            <RegisterTransactionModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedCategory(null); }}
                onSuccess={() => { fetchPayments(); setIsModalOpen(false); setSelectedCategory(null); }}
                clubId={player.club_id}
                preselectedPlayer={player}
                preselectedMonth={selectedMonth}
                preselectedCategory={selectedCategory}
            />
        </div>
    )
}

function GeneralTab({ player, assignments, refresh }) {
    const { user } = useAuth()
    const [allTeams, setAllTeams] = useState([])
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [photoPreview, setPhotoPreview] = useState(player.photo_url || null)
    const photoInputRef = useRef(null)
    
    // Edit Mode State
    const [editing, setEditing] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        first_name: player.first_name,
        last_name: player.last_name,
        dni: player.dni || '',
        dob: player.dob,
        gender: player.gender,
        height: player.height || '',
        position: player.position || '',
        phone: player.phone || '',
        legal_rep_name: player.legal_rep_name || '',
        legal_rep_surname: player.legal_rep_surname || '',
        legal_rep_dni: player.legal_rep_dni || '',
        legal_rep_phone: player.legal_rep_phone || '',
        // Education for certificates
        school_name: player.school_name || '',
        school_principal: player.school_principal || '',
        school_principal_title: player.school_principal_title || 'Lic.',
        school_grade: player.school_grade || '',
        jersey_number: player.jersey_number || ''
    })

    // Membership certificate modal
    const [membershipCertOpen, setMembershipCertOpen] = useState(false)
    const { club } = useClubData()

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida.')
            return
        }
        setUploadingPhoto(true)
        try {
            // Compress: resize to 400px max, JPEG 75% quality (~30-60KB result)
            const compressed = await compressImage(file, 400, 0.75)
            const sizeMB = (compressed.size / 1024 / 1024).toFixed(2)
            console.log(`Foto comprimida: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`)

            // Upload to Supabase Storage
            const path = `${player.club_id}/${player.id}.jpg`
            const { error: uploadError } = await supabase.storage
                .from('player-photos')
                .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('player-photos')
                .getPublicUrl(path)

            // Add cache-busting param so it refreshes immediately
            const urlWithBust = `${publicUrl}?t=${Date.now()}`

            // Save URL to player record
            const { error: updateError } = await supabase
                .from('players')
                .update({ photo_url: publicUrl })
                .eq('id', player.id)
            if (updateError) throw updateError

            setPhotoPreview(urlWithBust)
            refresh()
        } catch (err) {
            console.error(err)
            alert('Error al subir la foto: ' + err.message)
        } finally {
            setUploadingPhoto(false)
            // Reset input so same file can be re-selected
            if (photoInputRef.current) photoInputRef.current.value = ''
        }
    }

    // Calculate Age
    const age = player.dob ? new Date().getFullYear() - new Date(player.dob).getFullYear() : '?'

    useEffect(() => {
        fetchTeams()
    }, [])

    const fetchTeams = async () => {
        if (!player.club_id) return
        const { data } = await supabase
            .from('teams')
            .select('*, categories(nombre, edad_max, edad_min)')
            .eq('club_id', player.club_id)
        setAllTeams(data || [])
    }

    const handleSaveInfo = async () => {
        setLoading(true)
        setError(null)
        try {
            // Validate DNI if present
            if (formData.dni && !validateId(formData.dni)) {
                throw new Error("La Cédula de Identidad no es válida.")
            }

            // Validate Jersey Number uniqueness within the club and gender
            if (formData.jersey_number) {
                const { data: existingPlayer, error: checkError } = await supabase
                    .from('players')
                    .select('id, first_name, last_name')
                    .eq('club_id', player.club_id)
                    .eq('gender', formData.gender)
                    .eq('jersey_number', parseInt(formData.jersey_number))
                    .neq('id', player.id)
                    .maybeSingle()
                
                if (checkError) throw checkError
                if (existingPlayer) {
                    throw new Error(`El número de camiseta ${formData.jersey_number} ya está en uso por ${existingPlayer.first_name} ${existingPlayer.last_name} en la rama ${formData.gender}.`)
                }
            }

            const { error } = await supabase
                .from('players')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    dni: formData.dni,
                    dob: formData.dob,
                    gender: formData.gender,
                    height: formData.height ? parseInt(formData.height) : null,
                    position: formData.position,
                    jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
                    phone: formData.phone || null,
                    legal_rep_name: formData.legal_rep_name || null,
                    legal_rep_surname: formData.legal_rep_surname || null,
                    legal_rep_dni: formData.legal_rep_dni || null,
                    legal_rep_phone: formData.legal_rep_phone || null,
                    school_name: formData.school_name || null,
                    school_principal: formData.school_principal || null,
                    school_principal_title: formData.school_principal_title || 'Lic.',
                    school_grade: formData.school_grade || null
                })
                .eq('id', player.id)

            if (error) throw error
            setEditing(false)
            refresh()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const availableTeams = allTeams.filter(t => !assignments.some(a => a.teams?.id === t.id))

    const handleAddTeam = async (teamId) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('team_assignments')
                .insert({
                    player_id: player.id,
                    team_id: teamId
                })
            
            if (error) throw error
            setIsAdding(false)
            refresh()
        } catch (err) {
            console.error(err)
            alert(err.message || "Error al asignar equipo. Verifica la edad.")
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveTeam = async (assignmentId) => {
        if (!confirm("¿Seguro que quieres quitar al jugador de este equipo?")) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('team_assignments')
                .delete()
                .eq('id', assignmentId)
            
            if (error) throw error
            refresh()
        } catch (err) {
            console.error(err)
            alert("Error al quitar equipo")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    {/* Player Avatar Upload */}
                    <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
                        <div className="relative group">
                            {/* Avatar */}
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Foto"
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            ) : (
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md ${getAvatarColor(`${player.first_name}${player.last_name}`)}`}>
                                    {getInitials(player.first_name, player.last_name)}
                                </div>
                            )}

                            {/* Upload overlay */}
                            <button
                                type="button"
                                onClick={() => photoInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer"
                                title="Cambiar foto"
                            >
                                {uploadingPhoto ? (
                                    <Loader2 size={22} className="text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <Camera size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </button>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{player.first_name} {player.last_name}</h2>
                            <p className="text-sm text-slate-500">{player.position} • #{player.jersey_number || '?'}</p>
                            <p className="text-xs text-slate-400 mt-1">Click en la foto para cambiarla • Auto-comprimida</p>
                        </div>
                    </div>

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

                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900">Información Personal</h3>
                        {!editing ? (
                            <button 
                                onClick={() => setEditing(true)}
                                className="text-sm font-bold text-primary hover:bg-slate-50 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
                            >
                                <Edit2 size={16}/> Editar
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(false)} className="text-sm text-slate-500 hover:text-slate-700 font-medium">Cancelar</button>
                                <button onClick={handleSaveInfo} disabled={loading} className="text-sm bg-primary text-white px-3 py-1 rounded font-bold hover:bg-primary-dark">
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        {editing ? (
                             <>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Nombres</label>
                                    <input 
                                        type="text" className="w-full p-2 border rounded font-bold text-slate-700"
                                        value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value.toUpperCase()})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Apellidos</label>
                                    <input 
                                        type="text" className="w-full p-2 border rounded font-bold text-slate-700"
                                        value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value.toUpperCase()})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Fecha Nacimiento</label>
                                    <input 
                                        type="date" className="w-full p-2 border rounded font-medium text-slate-700"
                                        value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Cédula / DNI</label>
                                    <input 
                                        type="text" className="w-full p-2 border rounded font-medium text-slate-700"
                                        value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Género</label>
                                    <select 
                                        className="w-full p-2 border rounded font-medium text-slate-700"
                                        value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                                    >
                                        <option value="Femenino">Femenino</option>
                                        <option value="Masculino">Masculino</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Altura (cm)</label>
                                    <input 
                                        type="number" className="w-full p-2 border rounded font-medium text-slate-700"
                                        value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Posición</label>
                                    <select 
                                        className="w-full p-2 border rounded font-medium text-slate-700"
                                        value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}
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
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Dorsal (#)</label>
                                    <input 
                                        type="number" min="0" max="99" className="w-full p-2 border rounded font-medium text-slate-700"
                                        value={formData.jersey_number} onChange={e => setFormData({...formData, jersey_number: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-slate-400 text-xs uppercase mb-1">Teléfono / WhatsApp</label>
                                    <input 
                                        type="tel" className="w-full p-2 border rounded font-medium text-slate-700"
                                        placeholder="09XXXXXXXX"
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                                    />
                                </div>
                                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Representante Legal</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Nombres</label>
                                            <input type="text" className="w-full p-2 border rounded font-medium text-slate-700" value={formData.legal_rep_name} onChange={e => setFormData({...formData, legal_rep_name: e.target.value.toUpperCase()})}/>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Apellidos</label>
                                            <input type="text" className="w-full p-2 border rounded font-medium text-slate-700" value={formData.legal_rep_surname} onChange={e => setFormData({...formData, legal_rep_surname: e.target.value.toUpperCase()})}/>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Cédula / DNI</label>
                                            <input type="text" className="w-full p-2 border rounded font-medium text-slate-700" value={formData.legal_rep_dni} onChange={e => setFormData({...formData, legal_rep_dni: e.target.value.replace(/\D/g, '')})}/>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Teléfono</label>
                                            <input type="tel" className="w-full p-2 border rounded font-medium text-slate-700" value={formData.legal_rep_phone} onChange={e => setFormData({...formData, legal_rep_phone: e.target.value.replace(/\D/g, '')})}/>
                                        </div>
                                    </div>
                                </div>

                                {/* Education - Edit Mode */}
                                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                                    <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-1.5">
                                        <School size={13} /> Institución Educativa
                                        <span className="text-[10px] font-normal normal-case bg-blue-50 text-blue-400 px-1.5 py-0.5 rounded-full ml-1">Para certificados</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Nombre de la Institución</label>
                                            <input type="text" className="w-full p-2 border rounded font-medium text-slate-700" placeholder="Ej. Cambridge School of Languages" value={formData.school_name} onChange={e => setFormData({...formData, school_name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Título Rector</label>
                                            <select className="w-full p-2 border rounded font-medium text-slate-700" value={formData.school_principal_title} onChange={e => setFormData({...formData, school_principal_title: e.target.value})}>
                                                <option value="Lic.">Lic.</option>
                                                <option value="Dr.">Dr.</option>
                                                <option value="Dra.">Dra.</option>
                                                <option value="Ing.">Ing.</option>
                                                <option value="Mgs.">Mgs.</option>
                                                <option value="Prof.">Prof.</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Nombre Rector/Director</label>
                                            <input type="text" className="w-full p-2 border rounded font-medium text-slate-700" placeholder="Ej. Tatiana Tinoco" value={formData.school_principal} onChange={e => setFormData({...formData, school_principal: e.target.value})} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-400 text-xs uppercase mb-1">Curso / Nivel Actual</label>
                                            <input type="text" className="w-full p-2 border rounded font-medium text-slate-700" placeholder="Ej. 3ro de Bachillerato" value={formData.school_grade} onChange={e => setFormData({...formData, school_grade: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase mb-1">Nacimiento</span>
                                    <span className="font-medium text-slate-700">{player.dob} ({age} años)</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase mb-1">Cédula / DNI</span>
                                    <span className="font-medium text-slate-700">{player.dni || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase mb-1">Género</span>
                                    <span className="font-medium text-slate-700">{player.gender}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase mb-1">Altura</span>
                                    <span className="font-medium text-slate-700">{player.height} cm</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase mb-1">Posición</span>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold inline-block">
                                        {player.position}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase mb-1">Teléfono / WhatsApp</span>
                                    <span className="font-medium text-slate-700">
                                        {player.phone ? (
                                            <a href={`https://wa.me/593${player.phone.replace(/^0/, '')}`} target="_blank" rel="noreferrer"
                                                className="text-green-600 hover:underline flex items-center gap-1">
                                                📱 {player.phone}
                                            </a>
                                        ) : '-'}
                                    </span>
                                </div>
                                {(player.legal_rep_name || player.legal_rep_surname) && (
                                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Representante Legal</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <span className="block text-slate-400 text-xs uppercase mb-1">Nombre</span>
                                                <span className="font-medium text-slate-700">{player.legal_rep_name} {player.legal_rep_surname}</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-400 text-xs uppercase mb-1">Cédula / DNI</span>
                                                <span className="font-medium text-slate-700">{player.legal_rep_dni || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-400 text-xs uppercase mb-1">Teléfono</span>
                                                <span className="font-medium text-slate-700">{player.legal_rep_phone || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Education - View Mode */}
                                {(player.school_name || player.school_grade) && (
                                    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-1.5">
                                            <School size={13} /> Institución Educativa
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <span className="block text-slate-400 text-xs uppercase mb-1">Institución</span>
                                                <span className="font-medium text-slate-700">{player.school_name || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-400 text-xs uppercase mb-1">Curso</span>
                                                <span className="font-medium text-slate-700">{player.school_grade || '-'}</span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="block text-slate-400 text-xs uppercase mb-1">Rector/Director</span>
                                                <span className="font-medium text-slate-700">{player.school_principal_title || ''} {player.school_principal || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Membership Certificate Button */}
                                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                                    <button
                                        onClick={() => setMembershipCertOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Award size={16} /> Generar Certificado de Pertenencia
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Membership Certificate Modal */}
            <MembershipCertificateModal
                isOpen={membershipCertOpen}
                onClose={() => setMembershipCertOpen(false)}
                player={player}
                club={club}
            />

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900">Equipos Actuales</h3>
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            className="text-xs font-bold text-primary hover:bg-slate-50 px-2 py-1 rounded transition-colors"
                        >
                            {isAdding ? 'Cancelar' : '+ Agregar'}
                        </button>
                     </div>

                     {isAdding && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-in zoom-in-95">
                            <p className="text-xs text-slate-500 mb-2 font-medium">Asignar a:</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {availableTeams.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No hay más equipos disponibles.</p>
                                ) : availableTeams.map(team => (
                                    <button 
                                        key={team.id}
                                        disabled={loading}
                                        onClick={() => handleAddTeam(team.id)}
                                        className="w-full text-left flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-primary hover:text-primary transition-all text-sm group"
                                    >
                                        <span>{team.nombre}</span>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">{team.categories?.nombre}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                     )}

                     <div className="space-y-2">
                        {assignments && assignments.length > 0 ? (
                            assignments.map((a, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{a.teams?.nombre}</p>
                                        <p className="text-xs text-slate-500">{a.teams?.categories?.nombre}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveTeam(a.id)}
                                        className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Quitar del equipo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 italic text-sm">Sin asignaciones.</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    )
}

function MedicalTab({ playerId, medicalData, injuries, refresh }) {
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        blood_type: medicalData?.blood_type || '',
        allergies: medicalData?.allergies ? medicalData.allergies.split(',').map(s => s.trim()).filter(s => s) : [],
        conditions: medicalData?.conditions || '',
        emergency_contact_name: medicalData?.emergency_contact_name || '',
        emergency_contact_phone: medicalData?.emergency_contact_phone || '',
        notes: medicalData?.notes || ''
    })
    const [allergyInput, setAllergyInput] = useState('')

    // Injury Form
    const [showInjuryForm, setShowInjuryForm] = useState(false)
    const [editingInjuryId, setEditingInjuryId] = useState(null)
    const [injuryData, setInjuryData] = useState({
        injury_date: new Date().toISOString().split('T')[0],
        injury_type: 'Muscular',
        description: '',
        status: 'Activa'
    })

    const handleSaveProfile = async () => {
        setLoading(true)
        try {
            const dataToSave = { ...formData, allergies: formData.allergies.join(', ') }
            const { error } = await supabase
                .from('medical_profiles')
                .upsert({
                    player_id: playerId,
                    ...dataToSave,
                    updated_at: new Date()
                }, { onConflict: 'player_id' }) // Handle UNIQUE constraint

            if (error) throw error
            setEditing(false)
            refresh()
        } catch (err) {
            console.error(err)
            alert("Error al guardar ficha médica")
        } finally {
            setLoading(false)
        }
    }

    const handleAddInjury = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            let error
            if (editingInjuryId) {
                const { error: updateError } = await supabase.from('player_injuries').update({
                    injury_date: injuryData.injury_date,
                    injury_type: injuryData.injury_type,
                    description: injuryData.description,
                    status: injuryData.status
                }).eq('id', editingInjuryId)
                error = updateError
            } else {
                const { error: insertError } = await supabase.from('player_injuries').insert({
                    player_id: playerId,
                    ...injuryData
                })
                error = insertError
            }

            if (error) throw error
            setShowInjuryForm(false)
            setEditingInjuryId(null)
            setInjuryData({
                injury_date: new Date().toISOString().split('T')[0],
                injury_type: 'Muscular',
                description: '',
                status: 'Activa'
            })
            refresh()
        } catch (err) {
            console.error(err)
            alert("Error al guardar lesión")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteInjury = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta lesión?')) return
        setLoading(true)
        try {
            const { error } = await supabase.from('player_injuries').delete().eq('id', id)
            if (error) throw error
            refresh()
        } catch (err) {
            console.error(err)
            alert('Error al eliminar lesión')
        } finally {
            setLoading(false)
        }
    }
    
    const handleEditInjury = (injury) => {
        setInjuryData({
            injury_date: injury.injury_date,
            injury_type: injury.injury_type,
            description: injury.description || '',
            status: injury.status
        })
        setEditingInjuryId(injury.id)
        setShowInjuryForm(true)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Left: Medical Profile */}
            <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={20} className="text-primary"/> Ficha Médica
                        </h3>
                        {!editing ? (
                             <button onClick={() => setEditing(true)} className="text-sm text-primary font-medium hover:underline">
                                Editar
                             </button>
                        ) : (
                             <div className="flex gap-2">
                                <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancelar</button>
                                <button onClick={handleSaveProfile} disabled={loading} className="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark">
                                    {loading ? '...' : 'Guardar'}
                                </button>
                             </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Sangre</label>
                                {editing ? (
                                    <select 
                                        className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm"
                                        value={formData.blood_type}
                                        onChange={e => setFormData({...formData, blood_type: e.target.value})}
                                    >
                                        <option value="">-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                ) : (
                                    <p className="font-medium text-slate-700">{medicalData?.blood_type || '-'}</p>
                                )}
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alergias</label>
                                {editing ? (
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                            {formData.allergies.map((allergy, index) => (
                                                <span key={index} className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                                    {allergy}
                                                    <button type="button" onClick={() => setFormData({...formData, allergies: formData.allergies.filter((_, i) => i !== index)})} className="hover:text-red-900"><X size={12}/></button>
                                                </span>
                                            ))}
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Escribe y presiona Enter"
                                            className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm"
                                            value={allergyInput}
                                            onChange={e => setAllergyInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    if (allergyInput.trim()) {
                                                        setFormData({...formData, allergies: [...formData.allergies, allergyInput.trim()]})
                                                        setAllergyInput('')
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {medicalData?.allergies ? medicalData.allergies.split(',').map((a, i) => (
                                            <span key={i} className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold">{a.trim()}</span>
                                        )) : <p className="font-medium text-slate-700">Ninguna</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Condiciones Crónicas</label>
                            {editing ? (
                                <textarea 
                                    className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm"
                                    rows={2}
                                    value={formData.conditions}
                                    onChange={e => setFormData({...formData, conditions: e.target.value})}
                                />
                            ) : (
                                <p className="font-medium text-slate-700">{medicalData?.conditions || 'Ninguna'}</p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Contacto de Emergencia</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                                    {editing ? (
                                        <input type="text" className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm" value={formData.emergency_contact_name} onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})}/>
                                    ) : <p className="text-sm font-medium">{medicalData?.emergency_contact_name || '-'}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Teléfono</label>
                                    {editing ? (
                                        <input type="text" className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm" value={formData.emergency_contact_phone} onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})}/>
                                    ) : <p className="text-sm font-medium">{medicalData?.emergency_contact_phone || '-'}</p>}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Injuries History */}
            <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                             <Activity size={20} className="text-red-500"/> Historial de Lesiones
                        </h3>
                        <button onClick={() => {
                            setEditingInjuryId(null)
                            setInjuryData({
                                injury_date: new Date().toISOString().split('T')[0],
                                injury_type: 'Muscular',
                                description: '',
                                status: 'Activa'
                            })
                            setShowInjuryForm(!showInjuryForm)
                        }} className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold hover:bg-red-100 transition-colors">
                            <Plus size={14}/> Registrar
                        </button>
                    </div>

                    {showInjuryForm && (
                        <form onSubmit={handleAddInjury} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in slide-in-from-top-2">
                             <div className="grid grid-cols-2 gap-3 mb-3">
                                <input type="date" required className="p-2 border rounded text-sm" value={injuryData.injury_date} onChange={e => setInjuryData({...injuryData, injury_date: e.target.value})} />
                                <select className="p-2 border rounded text-sm" value={injuryData.status} onChange={e => setInjuryData({...injuryData, status: e.target.value})}>
                                    <option value="Activa">Activa</option>
                                    <option value="En Tratamiento">En Tratamiento</option>
                                    <option value="Recuperado">Recuperado</option>
                                </select>
                             </div>
                             <div className="grid grid-cols-2 gap-3 mb-3">
                                 <input type="text" placeholder="Tipo (Esguince, etc)" required className="p-2 border rounded text-sm" value={injuryData.injury_type} onChange={e => setInjuryData({...injuryData, injury_type: e.target.value})} />
                                 <input type="text" placeholder="Descripción breve" className="p-2 border rounded text-sm" value={injuryData.description} onChange={e => setInjuryData({...injuryData, description: e.target.value})} />
                             </div>
                             <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowInjuryForm(false)} className="px-3 py-1 text-xs text-slate-500">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Guardar</button>
                             </div>
                        </form>
                    )}

                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                        {injuries.length === 0 ? (
                            <p className="text-sm text-slate-400 italic pl-6">No hay lesiones registradas.</p>
                        ) : injuries.map((injury) => (
                            <div key={injury.id} className="relative pl-6">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${injury.status === 'Recuperado' ? 'bg-green-400' : 'bg-red-500'} shadow-sm`}></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{injury.injury_type}</p>
                                        <p className="text-xs text-slate-500">{injury.injury_date}</p>
                                        {injury.description && <p className="text-xs text-slate-600 mt-1">{injury.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                            injury.status === 'Recuperado' ? 'bg-green-100 text-green-700' : 
                                            injury.status === 'Activa' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {injury.status}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEditInjury(injury)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors">
                                                <Edit2 size={14}/>
                                            </button>
                                            <button onClick={() => handleDeleteInjury(injury.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function PhysicalTab({ playerId, assessments, refresh }) {
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        assessment_date: new Date().toISOString().split('T')[0],
        weight_kg: '',
        height_cm: '',
        standing_reach_cm: '',
        attack_jump_cm: '',
        block_jump_cm: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('physical_assessments').insert({
                player_id: playerId,
                assessment_date: formData.assessment_date,
                weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
                height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
                standing_reach_cm: formData.standing_reach_cm ? parseInt(formData.standing_reach_cm) : null,
                attack_jump_cm: formData.attack_jump_cm ? parseInt(formData.attack_jump_cm) : null,
                block_jump_cm: formData.block_jump_cm ? parseInt(formData.block_jump_cm) : null,
            })
            if (error) throw error
            setShowForm(false)
            setFormData({
                assessment_date: new Date().toISOString().split('T')[0],
                weight_kg: '',
                height_cm: '',
                standing_reach_cm: '',
                attack_jump_cm: '',
                block_jump_cm: ''
            })
            refresh()
        } catch (err) {
            console.error(err)
            alert("Error al guardar evaluación")
        } finally {
            setLoading(false)
        }
    }

    // Helper to calc jump
    const calcVertical = (reach, jump) => {
        if (!reach || !jump) return '-'
        return `${jump - reach} cm`
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Evaluaciones Físicas</h3>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                    <Plus size={18} /> Nueva Evaluación
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 px-1 border-l-4 border-primary">Registrar Datos</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                                <input type="date" required className="w-full p-2 border rounded-lg text-sm" value={formData.assessment_date} onChange={e => setFormData({...formData, assessment_date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Peso (kg)</label>
                                <input type="number" step="0.1" className="w-full p-2 border rounded-lg text-sm" placeholder="65.5" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Altura (cm)</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="175" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1" title="Alcance de pie con una mano">Alcance Parado</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="220" value={formData.standing_reach_cm} onChange={e => setFormData({...formData, standing_reach_cm: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alcance Ataque</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="280" value={formData.attack_jump_cm} onChange={e => setFormData({...formData, attack_jump_cm: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alcance Bloqueo</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="270" value={formData.block_jump_cm} onChange={e => setFormData({...formData, block_jump_cm: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors">Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Peso / Altura</th>
                                <th className="px-6 py-4">Alcance Parado</th>
                                <th className="px-6 py-4">Ataque (Salto)</th>
                                <th className="px-6 py-4">Bloqueo (Salto)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                            {assessments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">No hay evaluaciones registradas.</td>
                                </tr>
                            ) : assessments.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium">{a.assessment_date}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {a.weight_kg && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">{a.weight_kg} kg</span>}
                                            {a.height_cm && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">{a.height_cm} cm</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{a.standing_reach_cm ? `${a.standing_reach_cm} cm` : '-'}</td>
                                    <td className="px-6 py-4">
                                        {a.attack_jump_cm ? (
                                            <div>
                                                <span className="font-bold text-slate-900">{a.attack_jump_cm} cm</span>
                                                <span className="text-xs text-green-600 block">
                                                    (+ {calcVertical(a.standing_reach_cm, a.attack_jump_cm)})
                                                </span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                         {a.block_jump_cm ? (
                                            <div>
                                                <span className="font-bold text-slate-900">{a.block_jump_cm} cm</span>
                                                <span className="text-xs text-green-600 block">
                                                    (+ {calcVertical(a.standing_reach_cm, a.block_jump_cm)})
                                                </span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// --- Correction Requests Tab ---

function CorrectionRequestsTab({ requests, playerId, refresh }) {
    const handleStatusChange = async (reqId, newStatus) => {
        try {
            const { error } = await supabase
                .from('player_correction_requests')
                .update({ status: newStatus, reviewed_at: new Date().toISOString() })
                .eq('id', reqId)
            
            if (error) throw error
            refresh()
        } catch (err) {
            alert('Error actualizando estado: ' + err.message)
        }
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center animate-in fade-in">
                <MessageSquare size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">No hay solicitudes de corrección pendientes.</p>
            </div>
        )
    }

    const FIELD_LABELS = {
        'first_name': 'Nombre', 'last_name': 'Apellido', 'dni': 'Cédula / DNI',
        'position': 'Posición', 'jersey_number': 'Dorsal', 'dob': 'Fecha de nacimiento',
        'phone': 'Teléfono', 'height': 'Altura', 'payment_monthly': 'Pago mensualidad',
        'payment_tournament': 'Pago de torneo', 'other': 'Otro'
    }

    const STATUS_UI = {
        'pending': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        'reviewed': { label: 'Revisada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        'applied': { label: 'Aplicada', color: 'bg-green-100 text-green-700 border-green-200' },
        'rejected': { label: 'Rechazada', color: 'bg-red-100 text-red-700 border-red-200' },
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-primary"/> Historial de Solicitudes
            </h3>
            <div className="grid gap-4">
                {requests.map(req => {
                    const st = STATUS_UI[req.status] || STATUS_UI['pending']
                    return (
                        <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${st.color}`}>
                                            {st.label}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(req.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-800">
                                        Campo a corregir: {" "}
                                        <span className="text-primary">{FIELD_LABELS[req.field_name] || req.field_name}</span>
                                    </p>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid sm:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Valor Actual / Previo</p>
                                            <p className="font-medium text-slate-500">{req.current_value || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Valor Solicitado</p>
                                            <p className="font-bold text-slate-800">{req.requested_value}</p>
                                        </div>
                                    </div>
                                    {req.notes && (
                                        <p className="text-sm bg-blue-50/50 text-slate-600 p-3 rounded-lg border border-blue-100/50 italic">
                                            "{req.notes}"
                                        </p>
                                    )}
                                </div>
                                <div className="flex sm:flex-col gap-2 shrink-0">
                                    <select 
                                        className={`p-2 rounded-lg text-xs font-bold border outline-none ${req.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                                        value={req.status}
                                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                        title="Cambiar estado"
                                    >
                                        <option value="pending">Marcar Pendiente</option>
                                        <option value="reviewed">Marcar Revisada</option>
                                        <option value="applied">Marcar Aplicada</option>
                                        <option value="rejected">Rechazar</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
