import React, { useState, useEffect } from 'react'
import { X, Send, Calendar, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function SendMatchRequestModal({ isOpen, onClose, onSuccess, post, myClub }) {
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [alreadySent, setAlreadySent] = useState(false)
    const [checking, setChecking] = useState(false)

    useEffect(() => {
        if (isOpen && post && myClub) {
            setMessage('')
            checkExistingRequest()
        }
    }, [isOpen, post?.id, myClub?.id])

    const checkExistingRequest = async () => {
        setChecking(true)
        try {
            const { data } = await supabase
                .from('match_requests')
                .select('id')
                .eq('post_id', post.id)
                .eq('requesting_club_id', myClub.id)
                .maybeSingle()
            setAlreadySent(!!data)
        } catch (e) {
            console.error('Check request error:', e)
        } finally {
            setChecking(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!myClub || !post) return
        setLoading(true)
        try {
            const { error } = await supabase.from('match_requests').insert({
                post_id: post.id,
                requesting_club_id: myClub.id,
                hosting_club_id: post.club_id,
                message: message.trim() || null,
                status: 'pending'
            })
            if (error) throw error
            onSuccess?.()
            onClose()
        } catch (err) {
            console.error(err)
            alert('Error al enviar solicitud: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const isSameClub = myClub?.id === post?.club_id

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Solicitar Participación</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Post Summary */}
                    {post && (
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                            <p className="font-bold text-slate-900 text-sm line-clamp-1">{post.title}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar size={12} />
                                <span>{new Date(post.date_start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <MapPin size={12} />
                                <span className="truncate">{post.location}</span>
                            </div>
                        </div>
                    )}

                    {checking ? (
                        <div className="flex justify-center py-4 text-primary">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : isSameClub ? (
                        <>
                            <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-xl text-sm">
                                <AlertCircle size={20} className="flex-shrink-0" />
                                <span>No puedes enviar una solicitud a tu propia publicación.</span>
                            </div>
                            <button onClick={onClose} className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                                Cerrar
                            </button>
                        </>
                    ) : alreadySent ? (
                        <>
                            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl text-sm">
                                <CheckCircle size={20} className="flex-shrink-0" />
                                <span>Ya enviaste una solicitud para este tope. Revísala en tu bandeja de Solicitudes.</span>
                            </div>
                            <button onClick={onClose} className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                                Cerrar
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                    Mensaje para el organizador <span className="normal-case font-normal text-slate-400">(opcional)</span>
                                </label>
                                <textarea
                                    rows="4"
                                    placeholder="Ej: Hola, somos el Club Águila Sub-18, nos interesa el tope. ¿Cuántos sets van a jugar?"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    maxLength={400}
                                />
                                <p className="text-right text-[10px] text-slate-400 mt-1">{message.length}/400</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {loading
                                        ? <Loader2 size={18} className="animate-spin" />
                                        : <><Send size={18} /> Enviar</>
                                    }
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
