import React, { useState, useEffect } from 'react'
import { CalendarCheck, Plus, Users, Search, Filter, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import TakeAttendanceModal from '../../components/Modals/TakeAttendanceModal'

export default function Attendance() {
  const { club, role, loading: clubLoading } = useClubData()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const canManage = role === 'owner' || role === 'admin' || role === 'coach'

  const fetchSessions = React.useCallback(async () => {
    setLoading(true)
    try {
        // Fetch sessions with attendance count
        // Note: Counting related rows in Supabase simple query is tricky without joining everything.
        // We will just fetch sessions and maybe a separate aggregate or just raw data if volume is low.
        // For now, let's fetch sessions and their attendance records.
        
        const { data, error } = await supabase
            .from('training_sessions')
            .select(`
                *,
                teams (nombre, categoria),
                attendance (status)
            `)
            .eq('club_id', club.id)
            .order('date', { ascending: false })
            .limit(20) // Last 20 sessions

        if(error) throw error
        setSessions(data || [])
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
  }, [club])

  useEffect(() => {
    if (club) fetchSessions()
  }, [club, fetchSessions])

  if (clubLoading) return <div className="p-10 text-center">Cargando...</div>

  return (
    <div className="space-y-6">
         {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="text-primary" /> Control de Asistencia
                </h1>
                <p className="text-slate-500 text-sm">Gestiona la asistencia a los entrenamientos.</p>
            </div>
            {canManage && (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} /> Pasar Lista
                </button>
            )}
        </div>

        {/* Sessions List */}
        {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : (
            <div className="grid gap-4">
                {sessions.map(session => {
                    const total = session.attendance?.length || 0
                    const present = session.attendance?.filter(a => a.status === 'present').length || 0
                    const rate = total > 0 ? Math.round((present / total) * 100) : 0
                    
                    return (
                        <div key={session.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg text-center min-w-[60px]">
                                    <p className="text-xs font-bold text-slate-400 uppercase">{new Date(session.date).toLocaleString('default', { month: 'short' })}</p>
                                    <p className="text-xl font-bold text-slate-800">{new Date(session.date).getDate()}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{session.teams?.nombre} <span className="text-xs text-slate-400 font-normal">({session.teams?.categoria})</span></h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">{session.time.slice(0,5)}</span>
                                        {session.topic && <span>• {session.topic}</span>}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                <div className="text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Asistencia</p>
                                    <p className="text-lg font-bold text-green-600">{present} <span className="text-slate-300 text-sm">/ {total}</span></p>
                                </div>
                                <div className="w-16 h-16 relative flex items-center justify-center">
                                    {/* Simple Circular Progress using conic-gradient */}
                                    <div 
                                        className="w-full h-full rounded-full flex items-center justify-center"
                                        style={{ background: `conic-gradient(#22c55e ${rate}%, #f1f5f9 ${rate}% 100%)` }}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xs font-bold text-slate-700">
                                            {rate}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {sessions.length === 0 && (
                     <div className="py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100 border-dashed">
                        No hay sesiones registradas.
                    </div>
                )}
            </div>
        )}

        <TakeAttendanceModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchSessions}
            clubId={club.id}
        />
    </div>
  )
}
