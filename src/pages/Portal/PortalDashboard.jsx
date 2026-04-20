import React, { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
    LogOut, User, Activity, DollarSign, Calendar, Trophy,
    CheckCircle, AlertCircle, XCircle, Clock, MapPin, Flag,
    ChevronRight, ChevronDown, ChevronUp, Send, Loader2,
    TrendingUp, ShieldCheck, Edit3, MessageSquare
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PortalProgressChart from '../../components/ui/PortalProgressChart'

const TABS = [
    { id: 'profile',    icon: User,        label: 'Perfil'        },
    { id: 'tournaments',icon: Trophy,       label: 'Torneos'       },
    { id: 'stats',      icon: TrendingUp,  label: 'Estadísticas'  },
    { id: 'payments',   icon: DollarSign,  label: 'Pagos'         },
    { id: 'requests',   icon: Edit3,       label: 'Solicitudes'   },
]

const FIELD_LABELS = {
    'first_name': 'Nombre', 'last_name': 'Apellido', 'dni': 'Cédula / DNI',
    'position': 'Posición', 'jersey_number': 'Dorsal', 'dob': 'Fecha de nacimiento',
    'phone': 'Teléfono', 'height': 'Altura', 'payment_monthly': 'Pago mensualidad',
    'payment_tournament': 'Pago de torneo', 'other': 'Otro'
}

const STATUS_ROSTER = {
    'confirmed': { label: 'Confirmada', cls: 'bg-green-100 text-green-700' },
    'pending':   { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
    'declined':  { label: 'No Viaja',   cls: 'bg-red-100 text-red-700' },
}

const STATUS_REQ = {
    'pending':  { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
    'reviewed': { label: 'Revisada',   cls: 'bg-blue-100 text-blue-700' },
    'applied':  { label: 'Aplicada',   cls: 'bg-green-100 text-green-700' },
    'rejected': { label: 'Rechazada',  cls: 'bg-red-100 text-red-700' },
}

export default function PortalDashboard() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('profile')
    const [expandedTournament, setExpandedTournament] = useState(null)

    // Request correction state
    const [reqForm, setReqForm] = useState({ field_name: 'other', current_value: '', requested_value: '', notes: '' })
    const [reqLoading, setReqLoading] = useState(false)
    const [reqResult, setReqResult] = useState(null) // { success, message } or null

    // Protect route — must be before any other hook usage
    const isAuthorized = !!(state?.playerData)

    // All hooks must be unconditional — initialize with safe defaults
    const { player, teams, payments, matches, coach, tournaments, stats, correction_requests } =
        state?.playerData || {}

    const [localRequests, setLocalRequests] = useState(correction_requests || [])

    const handleLogout = () => navigate('/portal')

    if (!isAuthorized) {
        return <Navigate to="/portal" replace />
    }

    // ── Submit correction request ──
    const handleSubmitRequest = async () => {
        if (!reqForm.requested_value.trim()) {
            setReqResult({ success: false, message: 'Debes indicar el valor correcto.' })
            return
        }
        setReqLoading(true)
        setReqResult(null)
        try {
            const { data, error } = await supabase.rpc('submit_player_correction', {
                p_club_code: state.loginData?.club_code || '',
                p_dni: state.loginData?.dni || '',
                p_dob: state.loginData?.dob || '',
                p_field_name: reqForm.field_name,
                p_current_value: reqForm.current_value || null,
                p_requested_value: reqForm.requested_value,
                p_notes: reqForm.notes || null
            })
            if (error) throw error
            if (data?.error) throw new Error(data.error)
            setReqResult({ success: true, message: data.message || 'Solicitud enviada correctamente.' })
            setLocalRequests(prev => [{
                field_name: reqForm.field_name,
                requested_value: reqForm.requested_value,
                current_value: reqForm.current_value,
                notes: reqForm.notes,
                status: 'pending',
                created_at: new Date().toISOString()
            }, ...prev])
            setReqForm({ field_name: 'other', current_value: '', requested_value: '', notes: '' })
        } catch (err) {
            setReqResult({ success: false, message: err.message || 'Error al enviar solicitud.' })
        } finally {
            setReqLoading(false)
        }
    }

    // Derived payment data
    const currentYear = new Date().getFullYear()
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900">

            {/* ── Navbar ── */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white sticky top-0 z-20 shadow-xl">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center font-black text-white text-sm border-2 border-white/20">
                            {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                        <div>
                            <h1 className="font-bold text-sm leading-tight">{player.first_name} {player.last_name}</h1>
                            <p className="text-[10px] text-slate-400 font-mono tracking-wide">{player.club_name}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <LogOut size={17} />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="max-w-2xl mx-auto px-2 flex overflow-x-auto no-scrollbar">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                                    isActive ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Icon size={13} />{tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-4 pb-10 animate-in fade-in slide-in-from-bottom-2">

                {/* ══════════════ TAB: PERFIL ══════════════ */}
                {activeTab === 'profile' && (
                    <div className="space-y-4">
                        {/* Hero card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/25">
                                    {player.jersey_number || '?'}
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-1">
                                        {player.position || 'Jugadora'}
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900">{player.first_name} {player.last_name}</h2>
                                    <p className="text-sm text-slate-400">{teams?.map(t => t.team_name).join(', ') || 'Sin equipo asignado'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats rápidas */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Altura', value: player.height ? `${player.height} cm` : '—' },
                                { label: 'Edad',   value: player.dob ? `${new Date().getFullYear() - new Date(player.dob).getFullYear()} años` : '—' },
                                { label: 'Dorsal', value: player.jersey_number ? `#${player.jersey_number}` : '—' },
                            ].map(s => (
                                <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-slate-100 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{s.label}</p>
                                    <p className="text-base font-black text-slate-800">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Entrenador */}
                        {coach?.name && (
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                                    <ShieldCheck size={17} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Entrenador</p>
                                    <p className="font-bold text-slate-800 text-sm">{coach.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════ TAB: TORNEOS ══════════════ */}
                {activeTab === 'tournaments' && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-bold text-slate-400 uppercase">Torneos Convocada</h2>
                        {!tournaments || tournaments.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                                <Trophy size={36} className="mx-auto mb-2 text-slate-200" />
                                <p className="text-slate-400 text-sm">No estás convocada a ningún torneo aún.</p>
                            </div>
                        ) : tournaments.map(t => {
                            const rostStatus = STATUS_ROSTER[t.roster_status] || STATUS_ROSTER['pending']
                            const isExpanded = expandedTournament === t.id
                            const paid = Number(t.amount_paid || 0)
                            const owed = Number(t.cost_per_player || 0)
                            const pendingAmt = owed - paid

                            return (
                                <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div
                                        className="p-4 cursor-pointer flex items-start justify-between gap-3"
                                        onClick={() => setExpandedTournament(isExpanded ? null : t.id)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${rostStatus.cls}`}>
                                                    {rostStatus.label}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                    t.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                                                    t.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>{t.status === 'confirmed' ? 'Confirmado' : t.status === 'completed' ? 'Finalizado' : 'Planificado'}</span>
                                            </div>
                                            <p className="font-bold text-slate-800 truncate">{t.name}</p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                <MapPin size={11} />{t.location} •
                                                <Calendar size={11} />
                                                {new Date(t.start_date + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} –
                                                {new Date(t.end_date + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {pendingAmt > 0 && (
                                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">-${pendingAmt.toFixed(0)}</span>
                                            )}
                                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                        </div>
                                    </div>

                                    {/* Expanded: Calendar */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-50 px-4 pb-4">
                                            {/* Payment summary */}
                                            {owed > 0 && (
                                                <div className={`my-3 px-3 py-2 rounded-xl text-sm flex items-center justify-between ${
                                                    pendingAmt <= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                                }`}>
                                                    <span className="font-medium">Pago del torneo</span>
                                                    <span className="font-bold">
                                                        {pendingAmt <= 0
                                                            ? '✓ Pagado'
                                                            : `Debe $${pendingAmt.toFixed(2)} de $${owed.toFixed(2)}`}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Schedule */}
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 mt-3">Calendario de Partidos</p>
                                            {!t.schedule || t.schedule.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">El entrenador aún no ha publicado el calendario.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {t.schedule.map((m, idx) => {
                                                        const done = m.status === 'completed'
                                                        const win = done && m.our_score > m.opponent_score
                                                        const lose = done && m.our_score < m.opponent_score
                                                        return (
                                                            <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm border ${
                                                                win ? 'bg-green-50 border-green-100' :
                                                                lose ? 'bg-red-50 border-red-100' :
                                                                'bg-slate-50 border-slate-100'
                                                            }`}>
                                                                <div className={`w-1.5 h-8 rounded-full shrink-0 ${
                                                                    win ? 'bg-green-400' : lose ? 'bg-red-400' : 'bg-blue-300'
                                                                }`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-800 truncate">vs {m.opponent}</p>
                                                                    <p className="text-[10px] text-slate-400 flex gap-2 flex-wrap">
                                                                        <span className="flex items-center gap-0.5">
                                                                            <Calendar size={10} />
                                                                            {new Date(m.match_date + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                        </span>
                                                                        {m.match_time && <span className="flex items-center gap-0.5"><Clock size={10} />{m.match_time.slice(0,5)}</span>}
                                                                        {m.venue && <span className="flex items-center gap-0.5"><MapPin size={10} />{m.venue}</span>}
                                                                    </p>
                                                                </div>
                                                                {done ? (
                                                                    <div className={`font-black text-sm px-2 py-0.5 rounded-lg shrink-0 ${
                                                                        win ? 'text-green-700 bg-green-100' : lose ? 'text-red-600 bg-red-100' : 'text-slate-600 bg-slate-100'
                                                                    }`}>{m.our_score}-{m.opponent_score}</div>
                                                                ) : (
                                                                    <span className="text-[10px] text-blue-500 font-bold shrink-0">Pronto</span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ══════════════ TAB: ESTADÍSTICAS ══════════════ */}
                {activeTab === 'stats' && (
                    <div className="space-y-4">
                        {/* Última evaluación */}
                        {stats?.latest ? (
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Última Evaluación Física</h3>
                                <p className="text-[10px] text-slate-300 mb-3">
                                    {new Date(stats.latest.assessment_date + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Peso', value: stats.latest.weight_kg, unit: 'kg' },
                                        { label: 'Altura', value: stats.latest.height_cm, unit: 'cm' },
                                        { label: 'Alcance pie', value: stats.latest.standing_reach_cm, unit: 'cm' },
                                        { label: 'Salto ataque', value: stats.latest.attack_jump_cm, unit: 'cm' },
                                        { label: 'Salto bloqueo', value: stats.latest.block_jump_cm, unit: 'cm' },
                                        {
                                            label: 'Salto vertical',
                                            value: stats.latest.attack_jump_cm && stats.latest.standing_reach_cm
                                                ? stats.latest.attack_jump_cm - stats.latest.standing_reach_cm
                                                : null,
                                            unit: 'cm'
                                        },
                                    ].filter(s => s.value != null).map(s => (
                                        <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{s.label}</p>
                                            <p className="text-xl font-black text-slate-800">{s.value}<span className="text-xs font-normal text-slate-400 ml-0.5">{s.unit}</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                                <Activity size={36} className="mx-auto mb-2 text-slate-200" />
                                <p className="text-slate-400 text-sm">Aún no hay evaluaciones físicas registradas.</p>
                            </div>
                        )}

                        {/* Gráficas de progresión */}
                        {stats?.history && stats.history.length > 1 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Progresión en el tiempo</h3>

                                {[
                                    { key: 'attack_jump_cm', label: 'Salto en Ataque', color: '#6366f1', unit: ' cm' },
                                    { key: 'block_jump_cm',  label: 'Salto en Bloqueo', color: '#0ea5e9', unit: ' cm' },
                                    { key: 'weight_kg',      label: 'Peso', color: '#f59e0b', unit: ' kg' },
                                ].map(metric => {
                                    const chartData = stats.history
                                        .filter(h => h[metric.key] != null)
                                        .map(h => ({ date: h.assessment_date, value: h[metric.key] }))

                                    if (chartData.length < 2) return null                                    
                                    return (
                                        <div key={metric.key} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                            <p className="text-xs font-bold text-slate-600 mb-2">{metric.label}</p>
                                            <PortalProgressChart
                                                data={chartData}
                                                color={metric.color}
                                                unit={metric.unit}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Logs de rendimiento */}
                        {stats?.performance_logs && stats.performance_logs.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-50">
                                    <h3 className="font-bold text-slate-700 text-sm">Evaluaciones del Entrenador</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {stats.performance_logs.slice(0, 10).map((log, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 capitalize">
                                                    {log.metric_type.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(log.date + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <span className="font-black text-lg text-slate-800">{log.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════ TAB: PAGOS ══════════════ */}
                {activeTab === 'payments' && (
                    <div className="space-y-4">
                        {/* Matrículas */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                                <DollarSign size={18} className="text-green-600" />
                                <h3 className="font-bold text-slate-700">Mensualidades {currentYear}</h3>
                            </div>
                            {/* Matrícula */}
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Matrícula {currentYear}</p>
                                    <p className="text-xs text-slate-400">Inscripción anual</p>
                                </div>
                                {payments?.some(p => p.category === 'Matrícula' && String(p.date).startsWith(String(currentYear))) ? (
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} />PAGADA</span>
                                ) : (
                                    <span className="bg-slate-200 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle size={12} />NO REG.</span>
                                )}
                            </div>
                            {/* Grid meses */}
                            <div className="p-4">
                                <div className="grid grid-cols-4 gap-2">
                                    {MONTHS.map((m, i) => {
                                        const targetStr = `${currentYear}-${String(i+1).padStart(2,'0')}`
                                        const paid = payments?.find(p => {
                                            if (p.payment_month) return p.payment_month.startsWith(targetStr)
                                            return p.date?.startsWith(targetStr)
                                        })
                                        const isPast = i < new Date().getMonth()
                                        let cls = 'bg-slate-50 text-slate-300 border-slate-100'
                                        if (paid) cls = 'bg-green-500 text-white shadow-sm shadow-green-200 border-green-500'
                                        else if (isPast) cls = 'bg-red-50 text-red-400 border-red-100'
                                        return (
                                            <div key={m} className={`aspect-square rounded-xl flex flex-col items-center justify-center border text-sm font-bold ${cls}`}>
                                                {m}
                                                {paid && <CheckCircle size={10} className="mt-0.5" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Pagos de torneos */}
                        {tournaments && tournaments.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Estado de Pago — Torneos</h3>
                                {tournaments.map(t => {
                                    const paid = Number(t.amount_paid || 0)
                                    const owed = Number(t.cost_per_player || 0)
                                    const pending = owed - paid
                                    const isFullyPaid = pending <= 0
                                    return (
                                        <div key={t.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{t.name}</p>
                                                <p className="text-xs text-slate-400">{new Date(t.start_date + 'T12:00:00').toLocaleDateString('es-EC', { month: 'short', year: 'numeric' })}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {owed === 0 ? (
                                                    <span className="text-xs text-slate-400">Sin costo</span>
                                                ) : isFullyPaid ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={11} />Pagado</span>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs text-slate-400">${paid.toFixed(2)} / ${owed.toFixed(2)}</p>
                                                        <p className="text-sm font-bold text-red-500">Debe ${pending.toFixed(2)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════ TAB: SOLICITUDES ══════════════ */}
                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        {/* Formulario nueva solicitud */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <MessageSquare size={17} className="text-primary" /> Nueva Solicitud de Corrección
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">
                                Si ves algún dato incorrecto, puedes pedir al entrenador que lo corrija.
                            </p>

                            {reqResult && (
                                <div className={`p-3 rounded-xl text-sm font-medium mb-4 flex items-center gap-2 ${
                                    reqResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                }`}>
                                    {reqResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    {reqResult.message}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">¿Qué dato es incorrecto?</label>
                                    <select
                                        value={reqForm.field_name}
                                        onChange={e => setReqForm({...reqForm, field_name: e.target.value, current_value: '', requested_value: ''})}
                                        className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {Object.entries(FIELD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Valor actual (lo que muestra el sistema)</label>
                                    <input
                                        type="text"
                                        value={reqForm.current_value}
                                        onChange={e => setReqForm({...reqForm, current_value: e.target.value})}
                                        className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Ej: 0987654321"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Valor correcto *</label>
                                    <input
                                        type="text"
                                        value={reqForm.requested_value}
                                        onChange={e => setReqForm({...reqForm, requested_value: e.target.value})}
                                        className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Ej: 0991234567"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Comentario adicional</label>
                                    <textarea
                                        value={reqForm.notes}
                                        onChange={e => setReqForm({...reqForm, notes: e.target.value})}
                                        className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                                        placeholder="Información adicional que ayude al entrenador..."
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitRequest}
                                    disabled={reqLoading || !reqForm.requested_value.trim()}
                                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {reqLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                    Enviar Solicitud
                                </button>
                            </div>
                        </div>

                        {/* Historial de solicitudes */}
                        {localRequests.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Mis Solicitudes Anteriores</h3>
                                <div className="space-y-2">
                                    {localRequests.map((r, i) => {
                                        const st = STATUS_REQ[r.status] || STATUS_REQ['pending']
                                        return (
                                            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-bold text-slate-700">{FIELD_LABELS[r.field_name] || r.field_name}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${st.cls}`}>{st.label}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Solicitado: <strong>{r.requested_value}</strong>
                                                    {r.current_value && <> · Actual: {r.current_value}</>}
                                                </p>
                                                {r.notes && <p className="text-xs text-slate-400 italic mt-0.5">{r.notes}</p>}
                                                <p className="text-[10px] text-slate-300 mt-1">
                                                    {new Date(r.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
