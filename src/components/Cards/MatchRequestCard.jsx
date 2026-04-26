import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar, MapPin, CheckCircle, XCircle, Clock,
    Trophy, Handshake, Building2, MessageSquare, Loader2, MessageCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_CONFIG = {
    pending:   { label: 'Pendiente',  color: 'bg-amber-50 text-amber-600 border-amber-200',   Icon: Clock },
    accepted:  { label: 'Aceptada',   color: 'bg-green-50 text-green-600 border-green-200',   Icon: CheckCircle },
    declined:  { label: 'Rechazada',  color: 'bg-red-50 text-red-600 border-red-200',         Icon: XCircle },
    cancelled: { label: 'Cancelada',  color: 'bg-slate-50 text-slate-400 border-slate-200',   Icon: XCircle },
}

export default function MatchRequestCard({ request, myClubId, onUpdate }) {
    const [loading, setLoading] = useState(null)
    const navigate = useNavigate()

    const isReceived = request.hosting_club_id === myClubId
    const isSent     = request.requesting_club_id === myClubId
    const cfg        = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending
    const StatusIcon = cfg.Icon
    const otherClub  = isReceived ? request.requesting_club : request.hosting_club
    const post       = request.match_posts
    const isTournament = post?.type === 'tournament'

    const updateStatus = async (newStatus) => {
        const key = newStatus === 'accepted' ? 'accept' : newStatus === 'declined' ? 'decline' : 'cancel'
        setLoading(key)
        try {
            const { error } = await supabase
                .from('match_requests')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', request.id)
            if (error) throw error
            onUpdate?.()
        } catch (err) {
            console.error(err)
            alert('Error: ' + err.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            {/* Color strip */}
            <div className={`h-1.5 ${isTournament ? 'bg-gradient-to-r from-orange-400 to-pink-500' : 'bg-gradient-to-r from-blue-400 to-cyan-500'}`} />

            <div className="p-5 flex flex-col flex-1 gap-3">
                {/* Club + Status row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Building2 size={20} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-slate-400 font-medium">
                                {isReceived ? 'Solicitud de' : 'Enviada a'}
                            </p>
                            <p className="font-bold text-slate-900 text-sm truncate">{otherClub?.nombre || 'Club'}</p>
                            <p className="text-xs text-slate-400">{otherClub?.ciudad}</p>
                        </div>
                    </div>
                    <span className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                        <StatusIcon size={11} />
                        {cfg.label}
                    </span>
                </div>

                {/* Post info */}
                {post && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            {isTournament
                                ? <Trophy size={12} className="text-orange-500 flex-shrink-0" />
                                : <Handshake size={12} className="text-blue-500 flex-shrink-0" />
                            }
                            <span className="line-clamp-1">{post.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={11} />
                            <span>{new Date(post.date_start).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin size={11} />
                            <span className="truncate">{post.location}</span>
                        </div>
                    </div>
                )}

                {/* Message */}
                {request.message && (
                    <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl">
                        <MessageSquare size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600 italic line-clamp-3">"{request.message}"</p>
                    </div>
                )}

                {/* Date */}
                <p className="text-[10px] text-slate-400">
                    {new Date(request.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Actions */}
                <div className="mt-auto">
                    {request.status === 'pending' && isReceived && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => updateStatus('declined')}
                                disabled={!!loading}
                                className="flex-1 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {loading === 'decline'
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <XCircle size={15} />
                                }
                                Rechazar
                            </button>
                            <button
                                onClick={() => updateStatus('accepted')}
                                disabled={!!loading}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {loading === 'accept'
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <CheckCircle size={15} />
                                }
                                Aceptar
                            </button>
                        </div>
                    )}

                    {request.status === 'pending' && isSent && (
                        <button
                            onClick={() => updateStatus('cancelled')}
                            disabled={!!loading}
                            className="w-full py-2 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            {loading === 'cancel'
                                ? <Loader2 size={14} className="animate-spin" />
                                : <XCircle size={15} />
                            }
                            Cancelar solicitud
                        </button>
                    )}

                    {request.status === 'accepted' && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-xl text-xs font-medium">
                                <CheckCircle size={13} />
                                <span>{isReceived ? 'Solicitud aceptada.' : '¡Solicitud aceptada!'}</span>
                            </div>
                            <button
                                onClick={() => navigate(`/app/matchmaking/chat/${request.id}`)}
                                className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 active:scale-95 transition-all"
                            >
                                <MessageCircle size={16} />
                                Abrir Chat
                            </button>
                        </div>
                    )}

                    {request.status === 'declined' && (
                        <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                            <XCircle size={14} />
                            <span>{isReceived ? 'Rechazaste esta solicitud.' : 'Tu solicitud fue rechazada.'}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
