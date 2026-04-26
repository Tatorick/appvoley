import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Send, Loader2, Building2,
    Calendar, Trophy, Handshake, RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useClubData } from '../../hooks/useClubData'

const POLL_INTERVAL = 4000 // ms — refresca mensajes cada 4 segundos

export default function MatchmakingChat() {
    const { requestId } = useParams()
    const { user }      = useAuth()
    const { club }      = useClubData()
    const navigate      = useNavigate()

    const [request,     setRequest]     = useState(null)
    const [messages,    setMessages]    = useState([])
    const [loadingPage, setLoadingPage] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(true)
    const [newMessage,  setNewMessage]  = useState('')
    const [sending,     setSending]     = useState(false)
    const [lastPoll,    setLastPoll]    = useState(null) // timestamp del último poll

    const messagesEndRef  = useRef(null)
    const inputRef        = useRef(null)
    const latestMsgId     = useRef(null) // para detectar mensajes nuevos en polling
    const isTabActive     = useRef(true) // evitar polls innecesarios cuando el tab está oculto

    // ── Visibilidad del tab ──────────────────────────────────────────────────
    useEffect(() => {
        const onVisibility = () => { isTabActive.current = !document.hidden }
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [])

    // ── Fetch request info ───────────────────────────────────────────────────
    useEffect(() => {
        async function fetchRequest() {
            try {
                const { data, error } = await supabase
                    .from('match_requests')
                    .select(`
                        *,
                        match_posts(id, title, date_start, location, type),
                        requesting_club:clubs!match_requests_requesting_club_id_fkey(id, nombre, ciudad),
                        hosting_club:clubs!match_requests_hosting_club_id_fkey(id, nombre, ciudad)
                    `)
                    .eq('id', requestId)
                    .single()

                if (error) throw error
                setRequest(data)
            } catch (err) {
                console.error('Error fetching request:', err)
            } finally {
                setLoadingPage(false)
            }
        }
        fetchRequest()
    }, [requestId])

    // ── Fetch messages (carga inicial + polling) ─────────────────────────────
    const fetchMessages = useCallback(async (silent = false) => {
        if (!silent) setLoadingMsgs(true)
        try {
            const { data, error } = await supabase
                .from('club_messages')
                .select('*')
                .eq('match_request_id', requestId)
                .order('created_at', { ascending: true })
                .limit(200)

            if (error) throw error
            const fresh = data || []

            setMessages(prev => {
                // Si son los mismos mensajes (por ID del último), no actualizar estado
                const newLastId = fresh[fresh.length - 1]?.id
                if (newLastId && newLastId === latestMsgId.current && prev.length === fresh.length) {
                    return prev
                }
                latestMsgId.current = newLastId || null
                return fresh
            })
            setLastPoll(new Date())
        } catch (err) {
            console.error('Error fetching messages:', err)
        } finally {
            setLoadingMsgs(false)
        }
    }, [requestId])

    // Carga inicial
    useEffect(() => {
        fetchMessages(false)
    }, [fetchMessages])

    // Polling cada POLL_INTERVAL ms
    useEffect(() => {
        const interval = setInterval(() => {
            if (isTabActive.current) {
                fetchMessages(true) // silent = no muestra spinner
            }
        }, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchMessages])

    // ── Auto-scroll al último mensaje ────────────────────────────────────────
    const prevMsgCount = useRef(0)
    useEffect(() => {
        const count = messages.length
        // Solo scroll automático si hay mensajes nuevos (no en edición del input)
        if (count > prevMsgCount.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
        prevMsgCount.current = count
    }, [messages])

    // ── Enviar mensaje ───────────────────────────────────────────────────────
    const sendMessage = useCallback(async (e) => {
        e?.preventDefault()
        const content = newMessage.trim()
        if (!content || !club || sending) return

        const senderName = user?.user_metadata?.full_name || club.nombre || 'Usuario'
        const tempId = `temp-${Date.now()}`

        // Optimistic update — aparece al instante
        setMessages(prev => [...prev, {
            id: tempId,
            match_request_id: requestId,
            sender_club_id: club.id,
            sender_profile_id: user.id,
            sender_name: senderName,
            content,
            created_at: new Date().toISOString()
        }])
        setNewMessage('')
        setSending(true)
        inputRef.current?.focus()

        try {
            const { error } = await supabase.from('club_messages').insert({
                match_request_id: requestId,
                sender_club_id:   club.id,
                sender_profile_id: user.id,
                sender_name: senderName,
                content
            })
            if (error) throw error
            // Refrescar para reemplazar el mensaje temporal con el real de BD
            await fetchMessages(true)
        } catch (err) {
            console.error('Send error:', err)
            setMessages(prev => prev.filter(m => m.id !== tempId))
            setNewMessage(content)
            alert('Error al enviar: ' + err.message)
        } finally {
            setSending(false)
        }
    }, [newMessage, club, user, requestId, sending, fetchMessages])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // ── Guards ───────────────────────────────────────────────────────────────
    if (loadingPage) {
        return (
            <div className="flex items-center justify-center py-20 text-primary">
                <Loader2 className="animate-spin" size={36} />
            </div>
        )
    }

    if (!request) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">No se encontró esta conversación.</p>
                <button onClick={() => navigate('/app/matchmaking')} className="text-primary font-bold mt-4 hover:underline">
                    ← Volver a Matchmaking
                </button>
            </div>
        )
    }

    if (request.status !== 'accepted') {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">El chat solo está disponible cuando la solicitud es aceptada.</p>
                <button onClick={() => navigate('/app/matchmaking')} className="text-primary font-bold mt-4 hover:underline">
                    ← Volver a Matchmaking
                </button>
            </div>
        )
    }

    const otherClub    = request.requesting_club_id === club?.id ? request.hosting_club : request.requesting_club
    const post         = request.match_posts
    const isTournament = post?.type === 'tournament'

    return (
        <div className="flex flex-col -mx-6 lg:-mx-8 -mt-8" style={{ height: 'calc(100vh - 64px)' }}>

            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
                <button
                    onClick={() => navigate('/app/matchmaking')}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    aria-label="Volver"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{otherClub?.nombre || 'Club'}</p>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <p className="text-xs text-slate-400">En línea · se actualiza cada 4s</p>
                    </div>
                </div>

                {/* Match info pill */}
                {post && (
                    <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 flex-shrink-0">
                        {isTournament
                            ? <Trophy size={13} className="text-orange-500" />
                            : <Handshake size={13} className="text-blue-500" />
                        }
                        <span className="font-medium max-w-[140px] truncate">{post.title}</span>
                        <span className="text-slate-300">|</span>
                        <Calendar size={11} className="text-slate-400" />
                        <span>{new Date(post.date_start).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                )}

                {/* Manual refresh */}
                <button
                    onClick={() => fetchMessages(false)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors"
                    title="Refrescar mensajes"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 lg:px-6 py-5 space-y-3">
                {loadingMsgs ? (
                    <div className="flex justify-center py-12 text-primary">
                        <Loader2 className="animate-spin" size={28} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                            <Building2 size={24} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">¡Solicitud aceptada!</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            Empieza la conversación para coordinar los detalles del{isTournament ? ' torneo' : ' tope'}.
                        </p>
                    </div>
                ) : (
                    <>
                        <DateSeparator date={messages[0].created_at} />
                        {messages.map((msg, i) => {
                            const isOwn   = msg.sender_club_id === club?.id
                            const prev    = messages[i - 1]
                            const showDate = i > 0 && !isSameDay(prev.created_at, msg.created_at)
                            const showName = !isOwn && (i === 0 || prev.sender_club_id !== msg.sender_club_id)
                            return (
                                <React.Fragment key={msg.id}>
                                    {showDate && <DateSeparator date={msg.created_at} />}
                                    <MessageBubble message={msg} isOwn={isOwn} showName={showName} />
                                </React.Fragment>
                            )
                        })}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div className="bg-white border-t border-slate-200 px-4 lg:px-6 py-3 flex-shrink-0">
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm leading-snug max-h-28 overflow-y-auto"
                        maxLength={1000}
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-11 h-11 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary/25 flex-shrink-0"
                        aria-label="Enviar mensaje"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    Enter para enviar · Shift+Enter para nueva línea
                </p>
            </div>
        </div>
    )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ message, isOwn, showName }) {
    const time   = new Date(message.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const isTemp = message.id?.toString().startsWith('temp-')

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                {showName && !isOwn && (
                    <p className="text-[11px] font-semibold text-slate-500 px-1 ml-1">{message.sender_name}</p>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
                }`}>
                    {message.content}
                </div>
                <p className={`text-[10px] px-1 text-slate-400 ${isTemp ? 'opacity-50' : ''}`}>
                    {isTemp ? 'Enviando...' : time}
                </p>
            </div>
        </div>
    )
}

function DateSeparator({ date }) {
    const label = new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long'
    })
    return (
        <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-medium capitalize whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-slate-200" />
        </div>
    )
}

function isSameDay(a, b) {
    const da = new Date(a), db = new Date(b)
    return da.getFullYear() === db.getFullYear()
        && da.getMonth()    === db.getMonth()
        && da.getDate()     === db.getDate()
}
