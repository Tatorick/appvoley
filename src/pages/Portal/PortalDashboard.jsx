import React from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { LogOut, User, Activity, DollarSign, Calendar, TrendingUp, Trophy, CheckCircle, AlertCircle } from 'lucide-react'

export default function PortalDashboard() {
  const { state } = useLocation()
  const navigate = useNavigate()

  // Protect route
  if (!state?.playerData) {
      return <Navigate to="/portal" replace />
  }

  const { player, teams, payments, matches } = state.playerData

  const handleLogout = () => {
      navigate('/portal')
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        
        {/* Navbar */}
        <div className="bg-slate-900 text-white sticky top-0 z-10 shadow-lg">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white border-2 border-slate-800">
                        {player.first_name[0]}{player.last_name[0]}
                    </div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight">{player.first_name} {player.last_name}</h1>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wide">{player.club_name}</p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-slate-300"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6 animate-in slide-in-from-bottom-2">
            
            {/* Status Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase">
                        {player.position || 'Jugador'}
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">#{player.jersey_number || '00'}</div>
                    <div className="text-sm text-slate-500 font-medium">
                        {teams?.map(t => `${t.team_name} (${t.category})`).join(', ') || 'Sin Equipo'}
                    </div>
                </div>
                <div className="flex gap-4">
                     <div className="text-center p-4 bg-slate-50 rounded-2xl w-24">
                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Altura</div>
                        <div className="text-xl font-bold text-slate-700">{player.height || '-'} <span className="text-xs">cm</span></div>
                     </div>
                     <div className="text-center p-4 bg-slate-50 rounded-2xl w-24">
                         <div className="text-xs text-slate-400 font-bold uppercase mb-1">Edad</div>
                         <div className="text-xl font-bold text-slate-700">
                            {player.dob ? new Date().getFullYear() - new Date(player.dob).getFullYear() : '-'}
                         </div>
                     </div>
                </div>
            </div>

            {/* Payments Summary (The most important part) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                     <DollarSign className="text-green-600" size={24}/>
                     <h2 className="font-bold text-lg text-slate-800">Estado de Pagos</h2>
                </div>
                
                {/* Matricula Check */}
                <div className="p-5 bg-green-50/50 flex items-center justify-between border-b border-green-100">
                    <div>
                        <h3 className="text-sm font-bold text-green-900">Matrícula {new Date().getFullYear()}</h3>
                        <p className="text-xs text-green-700 mt-1">Suscripción anual</p>
                    </div>
                    {payments.some(p => p.category === 'Matrícula' && String(p.date).startsWith(String(new Date().getFullYear()))) ? (
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                            <CheckCircle size={14} /> PAGADA
                        </div>
                    ) : (
                         <div className="bg-slate-200 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <AlertCircle size={14} /> NO REGISTRADA
                        </div>
                    )}
                </div>

                {/* Monthly Grid */}
                <div className="p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Mensualidades {new Date().getFullYear()}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => {
                             const currentYear = new Date().getFullYear()
                             const targetStr = `${currentYear}-${String(i+1).padStart(2,'0')}`
                             // Check payment
                             const paid = payments.find(p => {
                                 if (p.payment_month) return p.payment_month.startsWith(targetStr)
                                 return p.date.startsWith(targetStr)
                             })
                             
                             const isPast = i < new Date().getMonth()
                             
                             let statusColor = 'bg-slate-50 text-slate-300 border-slate-100' // Future
                             if (paid) statusColor = 'bg-green-500 text-white shadow-md shadow-green-200 border-green-500' // Paid
                             else if (isPast && currentYear >= 2026) statusColor = 'bg-red-50 text-red-400 border-red-100' // Late (logic from before)
                             
                             return (
                                 <div key={m} className={`aspect-square rounded-xl flex flex-col items-center justify-center border ${statusColor}`}>
                                     <span className="text-sm font-bold">{m}</span>
                                     {paid && <CheckCircle size={12} className="mt-1"/>}
                                 </div>
                             )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                     <Trophy className="text-yellow-500" size={24}/>
                     <h2 className="font-bold text-lg text-slate-800">Partidos Recientes</h2>
                </div>
                {matches && matches.length > 0 ? matches.slice(0, 5).map((m, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">vs {m.opponent}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{m.tournament || 'Partido'}</p>
                        </div>
                        <div className={`text-right ${m.result === 'W' ? 'text-green-600' : 'text-red-500'}`}>
                            <p className="font-black text-lg">{m.score_us} - {m.score_them}</p>
                            <p className="text-[10px] font-bold">{m.result === 'W' ? 'VICTORIA' : 'DERROTA'}</p>
                        </div>
                    </div>
                )) : (
                    <div className="p-8 text-center text-slate-400 italic text-sm">
                        No hay partidos registrados recientemente.
                    </div>
                )}
            </div>

        </div>
    </div>
  )
}
