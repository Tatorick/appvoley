import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import { AlertTriangle, Trophy, Users, MapPin, Loader2, ArrowRight, Wallet, Swords, Plus, Calendar, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

// Enhanced Stat Card
const StatCard = ({ icon: Icon, label, value, subtext, gradient, to }) => (
  <Link to={to} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all h-full overflow-hidden">
    <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${gradient}`}>
        <Icon size={80} />
    </div>
    
    <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg ${gradient}`}>
            <Icon size={24} />
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
        {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  </Link>
)

const QuickAction = ({ icon: Icon, label, to, color }) => (
    <Link to={to} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all group">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-50 ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            <span className="font-bold text-slate-700">{label}</span>
        </div>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
    </Link>
)

export default function ClubHome() {
  const { club, loading: clubLoading } = useClubData()
  const [stats, setStats] = useState({
      teamCount: 0,
      playerCount: 0,
      postsCount: 0,
      balance: 0
  })

  // Define fetchStats BEFORE using it in useEffect
  // Define fetchStats BEFORE using it in useEffect
  const fetchStats = React.useCallback(async () => {
      if (!club) return
      // Parallel requests for counts
      const [
          { count: players }, 
          { count: teams }, 
          { count: posts },
          { data: movements }
      ] = await Promise.all([
          supabase.from('players').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
          supabase.from('teams').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
          supabase.from('match_posts').select('*', { count: 'exact', head: true }).eq('club_id', club.id).eq('status', 'open'),
          supabase.from('treasury_movements').select('amount, type').eq('club_id', club.id)
      ])

      // Calc Balance
      let balance = 0
      movements?.forEach(m => {
          if (m.type === 'income') balance += Number(m.amount)
          else balance -= Number(m.amount)
      })

      setStats({
          playerCount: players || 0,
          teamCount: teams || 0,
          postsCount: posts || 0,
          balance: balance
      })
  }, [club])

  useEffect(() => {
    if (club) fetchStats()
  }, [club, fetchStats])

  if (clubLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32}/></div>
  if (!club) return null

  return (
    <div className="space-y-8">
      {/* Club Header & Status */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-blue-400/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-primary/30 transform group-hover:scale-105 transition-transform duration-500">
                {club.nombre.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-bold text-slate-900">{club.nombre}</h1>
                    {club.status === 'pendiente' ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1 border border-yellow-200">
                             <AlertTriangle size={12} /> Verificación Pendiente
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200">
                            Verificado
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-4 text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={18} className="text-slate-400" />
                        {club.ciudad}, {club.pais}
                    </div>
                </div>
            </div>

            <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Código del Club</p>
                <div className="text-3xl font-mono font-bold text-slate-900 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 inline-block">
                    {club.codigo}
                </div>
            </div>
        </div>
      </div>
    
      {/* Warning Banner if Pending */}
      {club.status === 'pendiente' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl flex items-center gap-4 shadow-sm">
             <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                <AlertTriangle size={24} />
             </div>
             <div>
                 <h4 className="font-bold text-yellow-800 text-lg">Tu club está en proceso de validación</h4>
                 <p className="text-yellow-700">
                     Estamos verificando tu información para habilitar todas las funciones sociales del sistema.
                 </p>
             </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (Stats & Feed) */}
          <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Activity size={20} className="text-primary"/>
                  Resumen de Actividad
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard 
                    to="/app/players"
                    icon={Users} 
                    label="Jugadores Totales" 
                    value={stats.playerCount} 
                    subtext="Ver plantel completo"
                    gradient="bg-linear-to-br from-blue-500 to-indigo-600" 
                />
                <StatCard 
                    to="/app/teams"
                    icon={Trophy} 
                    label="Equipos Formados" 
                    value={stats.teamCount} 
                    subtext="Categorías activas"
                    gradient="bg-linear-to-br from-orange-400 to-pink-500" 
                />
                 <StatCard 
                    to="/app/payments"
                    icon={Wallet} 
                    label="Balance de Tesorería" 
                    value={`$${stats.balance.toFixed(2)}`} 
                    subtext="Saldo actual disponible"
                    gradient={stats.balance >= 0 ? "bg-linear-to-br from-green-500 to-emerald-600" : "bg-linear-to-br from-red-500 to-rose-600"}
                />
                 <StatCard 
                    to="/app/matchmaking"
                    icon={Swords} 
                    label="Oportunidades" 
                    value={stats.postsCount} 
                    subtext="Publicaciones activas"
                    gradient="bg-linear-to-br from-violet-500 to-purple-600" 
                />
              </div>
          </div>

          {/* Sidebar Column (Quick Actions) */}
          <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Accesos Rápidos</h2>
                <div className="grid grid-cols-1 gap-3">
                    <QuickAction icon={Plus} label="Agregar Jugador" to="/app/players" color="text-blue-600" />
                    <QuickAction icon={Calendar} label="Crear Publicación" to="/app/matchmaking" color="text-violet-600" />
                    <QuickAction icon={Wallet} label="Registrar Pago" to="/app/payments" color="text-green-600" />
                    <QuickAction icon={Users} label="Gestionar Equipos" to="/app/teams" color="text-orange-600" />
                </div>
                
                {/* Pro Tip Card */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
                    <h3 className="text-lg font-bold mb-2 relative z-10">¿Sabías qué? 💡</h3>
                    <p className="text-slate-300 text-sm relative z-10">
                        Puedes generar un enlace de invitación en Configuración para que tus otros entrenadores se unan automáticamente.
                    </p>
                    <Link to="/app/settings" className="inline-block mt-4 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-light">
                        Ir a Configuración →
                    </Link>
                </div>
          </div>
      </div>
    </div>
  )
}
