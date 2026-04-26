import React, { useState, useEffect } from 'react'
import { Loader2, Inbox, Send as SendIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import MatchRequestCard from '../../components/Cards/MatchRequestCard'

export default function MatchmakingInbox() {
    const { club } = useClubData()
    const [subTab, setSubTab] = useState('received') // 'received' | 'sent'
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        if (!club) return
        setLoading(true)
        try {
            const column = subTab === 'received' ? 'hosting_club_id' : 'requesting_club_id'
            const { data, error } = await supabase
                .from('match_requests')
                .select(`
                    *,
                    match_posts(id, title, date_start, location, type),
                    requesting_club:clubs!match_requests_requesting_club_id_fkey(id, nombre, logo_url, ciudad),
                    hosting_club:clubs!match_requests_hosting_club_id_fkey(id, nombre, logo_url, ciudad)
                `)
                .eq(column, club.id)
                .order('created_at', { ascending: false })
                .limit(40)

            if (error) throw error
            setRequests(data || [])
        } catch (err) {
            console.error('Error fetching match requests:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [club, subTab])

    const pendingReceived = requests.filter(r => r.status === 'pending').length

    return (
        <div className="space-y-5">
            {/* Sub-tabs */}
            <div className="flex gap-2">
                <SubTabBtn
                    active={subTab === 'received'}
                    onClick={() => setSubTab('received')}
                    icon={<Inbox size={15} />}
                    label="Recibidas"
                />
                <SubTabBtn
                    active={subTab === 'sent'}
                    onClick={() => setSubTab('sent')}
                    icon={<SendIcon size={15} />}
                    label="Enviadas"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="py-16 flex justify-center text-primary">
                    <Loader2 className="animate-spin" size={36} />
                </div>
            ) : requests.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                        {subTab === 'received' ? <Inbox size={28} /> : <SendIcon size={28} />}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">
                        {subTab === 'received' ? 'Sin solicitudes recibidas' : 'No has enviado solicitudes'}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">
                        {subTab === 'received'
                            ? 'Cuando otro club solicite uno de tus topes, aparecerá aquí.'
                            : 'Explora el tab "Explorar" y pulsa "Solicitar" en cualquier tope.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {requests.map(req => (
                        <MatchRequestCard
                            key={req.id}
                            request={req}
                            myClubId={club.id}
                            onUpdate={fetchRequests}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function SubTabBtn({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
        >
            {icon} {label}
        </button>
    )
}
