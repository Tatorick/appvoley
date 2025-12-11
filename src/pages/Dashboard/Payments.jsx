import React, { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Search, CheckCircle, Loader2, Filter, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import RegisterTransactionModal from '../../components/Modals/RegisterTransactionModal'

export default function Payments() {
  const { club, role } = useClubData()
  const [activeTab, setActiveTab] = useState('treasury') // 'treasury', 'fees'
  
    // Data
  const [movements, setMovements] = useState([])
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 })
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)

  // Filters for Fees
  const [searchTerm, setSearchTerm] = useState('')
  const [hidePaid, setHidePaid] = useState(false)
  const [expandedTeams, setExpandedTeams] = useState({}) // { 'TeamId': true/false }

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preselectedPlayer, setPreselectedPlayer] = useState(null)

  const canEdit = role === 'owner' || role === 'admin'

  const fetchMovements = useCallback(async () => {
    if (!club) return
    setLoading(true)
    try {
        const { data } = await supabase
            .from('treasury_movements')
            .select('*')
            .eq('club_id', club.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
        
        setMovements(data || [])
        
        // Calculate Stats
        let income = 0
        let expense = 0
        if(data) {
            data.forEach(m => {
                if (m.type === 'income') income += Number(m.amount)
                else expense += Number(m.amount)
            })
        }
        setStats({ income, expense, balance: income - expense })

    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
  }, [club])

  const fetchPlayers = useCallback(async () => {
      if (!club) return
      // Join team assignments to group by team
      const { data } = await supabase
        .from('players')
        .select(`
            *,
            team_assignments (
                teams (id, nombre)
            )
        `)
        .eq('club_id', club.id)
        .order('last_name')
      
      setPlayers(data || [])
      
      // Auto-expand all teams initially if loading for first time
      if (data) {
          const uniqueTeams = {}
          data.forEach(p => {
              const tId = p.team_assignments?.[0]?.teams?.id || 'noteam'
              uniqueTeams[tId] = true
          })
          setExpandedTeams(prev => ({ ...prev, ...uniqueTeams }))
      }
  }, [club])

  useEffect(() => {
    if (club) {
        fetchMovements()
        fetchPlayers()
    }
  }, [club, fetchMovements, fetchPlayers])



  // --- Fees Logic ---
  const getCurrentMonthPlayers = () => {
    const now = new Date()
    const currentMonth = now.getMonth() 
    const currentYear = now.getFullYear()

    return players.map(player => {
        const payment = movements.find(m => {
            if (m.type !== 'income') return false
            if (m.player_id !== player.id) return false
            const mDate = new Date(m.date + 'T00:00:00')
            return mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear
        })

        return {
            ...player,
            paid: !!payment,
            paymentDetails: payment,
            teamName: player.team_assignments?.[0]?.teams?.nombre || 'Sin Equipo',
            teamId: player.team_assignments?.[0]?.teams?.id || 'noteam'
        }
    })
  }

  const processedPlayers = getCurrentMonthPlayers()
    .filter(p => {
        const matchSearch = (p.first_name + ' ' + p.last_name).toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = hidePaid ? !p.paid : true
        return matchSearch && matchStatus
    })

  // Group by Team
  const groupedPlayers = processedPlayers.reduce((acc, player) => {
      const tName = player.teamName
      const tId = player.teamId
      if (!acc[tId]) acc[tId] = { name: tName, players: [], count: 0, paidCount: 0 }
      acc[tId].players.push(player)
      acc[tId].count++
      if (player.paid) acc[tId].paidCount++
      return acc
  }, {})

  const toggleTeam = (tId) => {
      setExpandedTeams(prev => ({ ...prev, [tId]: !prev[tId] }))
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tesorería y Pagos</h1>
          <p className="text-slate-500">Controla las finanzas de tu club.</p>
        </div>
        {canEdit && (
             <button 
             onClick={() => { setPreselectedPlayer(null); setIsModalOpen(true); }}
             className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-colors font-bold shadow-lg shadow-slate-900/25"
             >
                <Plus size={20} />
                Registrar Movimiento
             </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Balance Total" amount={stats.balance} icon={<DollarSign/>} color="blue" />
          <StatCard label="Ingresos (Mes)" amount={stats.income} icon={<TrendingUp/>} color="green" />
          <StatCard label="Egresos (Mes)" amount={stats.expense} icon={<TrendingDown/>} color="red" />
      </div>

      {/* Tabs */}
       <div className="flex gap-2 border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('treasury')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${activeTab === 'treasury' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <DollarSign size={18} /> Movimientos
            </button>
            <button 
                onClick={() => setActiveTab('fees')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${activeTab === 'fees' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Calendar size={18} /> Cuotas Mensuales
            </button>
       </div>

       {loading ? (
             <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>
       ) : activeTab === 'treasury' ? (
           
           /* Treasury List */
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               {movements.length === 0 ? (
                   <div className="p-10 text-center text-slate-500 italic">No hay movimientos registrados.</div>
               ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase">
                           <tr>
                               <th className="px-6 py-4">Fecha</th>
                               <th className="px-6 py-4">Descripción</th>
                               <th className="px-6 py-4">Categoría</th>
                               <th className="px-6 py-4 text-right">Monto</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                           {movements.map(m => (
                               <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                   <td className="px-6 py-4 text-slate-500 text-sm font-medium">{new Date(m.date).toLocaleDateString()}</td>
                                   <td className="px-6 py-4">
                                       <div className="font-bold text-slate-700">{m.description}</div>
                                       {m.player_id && <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Asoc. Jugador</span>}
                                   </td>
                                   <td className="px-6 py-4 text-xs">
                                       <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold">{m.category}</span>
                                   </td>
                                   <td className={`px-6 py-4 text-right font-mono font-bold ${m.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                       {m.type === 'income' ? '+' : '-'}${Number(m.amount).toFixed(2)}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
                </div>
               )}
           </div>

       ) : (

           /* Fees List with Grouping */
           <div className="space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar jugador..." 
                            className="w-full pl-10 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setHidePaid(!hidePaid)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${hidePaid ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Filter size={16} />
                        {hidePaid ? 'Mostrando solo Pendientes' : 'Mostrar Todos'}
                    </button>
                </div>

                {Object.keys(groupedPlayers).length === 0 ? (
                    <div className="text-center p-10 text-slate-400 italic">No se encontraron jugadores con estos filtros.</div>
                ) : (
                    Object.entries(groupedPlayers).map(([tId, group]) => (
                        <div key={tId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Team Header */}
                            <button 
                                onClick={() => toggleTeam(tId)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors border-b border-slate-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`transition-transform duration-200 ${expandedTeams[tId] ? 'rotate-90' : ''}`}>
                                        <ChevronRight size={18} className="text-slate-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">{group.name}</h3>
                                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{group.count}</span>
                                </div>
                                <div className="text-sm text-slate-500">
                                    <span className="font-bold text-green-600">{group.paidCount}</span> Pagados
                                </div>
                            </button>
                            
                            {/* Players Grid */}
                            {expandedTeams[tId] && (
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-slide-in">
                                    {group.players.map(player => (
                                         <div key={player.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${player.paid ? 'bg-green-50/50 border-green-100' : 'bg-white border-slate-100 border-l-4 border-l-slate-200'}`}>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{player.last_name}, {player.first_name}</h4>
                                                <p className="text-[10px] text-slate-400 capitalize">{player.teamName}</p>
                                            </div>
                                            
                                            {player.paid ? (
                                                <div className="text-right">
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                        <CheckCircle size={10} /> PAGADO
                                                    </span>
                                                    <p className="text-[10px] text-green-700/70 mt-1">{new Date(player.paymentDetails.date).toLocaleDateString()}</p>
                                                </div>
                                            ) : (
                                                canEdit ? (
                                                    <button 
                                                        onClick={() => { setPreselectedPlayer(player); setIsModalOpen(true); }}
                                                        className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-primary hover:shadow-lg transition-all font-bold"
                                                    >
                                                        Registrar
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400">PENDIENTE</span>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
           </div>
       )}

       <RegisterTransactionModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => { fetchMovements(); setIsModalOpen(false); }}
            clubId={club?.id}
            preselectedPlayer={preselectedPlayer}
       />
    </div>
  )
}

function StatCard({ label, amount, icon, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600'
    }
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold ${amount < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                    ${Number(amount).toFixed(2)}
                </p>
            </div>
        </div>
    )
}
