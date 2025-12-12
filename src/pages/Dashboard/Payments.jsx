import React, { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Search, CheckCircle, Loader2, Filter, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import { useNavigate } from 'react-router-dom'
import RegisterTransactionModal from '../../components/Modals/RegisterTransactionModal'

export default function Payments() {
  const { club, role } = useClubData()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('treasury') // 'treasury', 'fees'
  
  // Data
  const [movements, setMovements] = useState([])
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 })
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)

  // Filters for Fees
  const [searchTerm, setSearchTerm] = useState('')
  const [hidePaid, setHidePaid] = useState(false)
  const [hideDebtFree, setHideDebtFree] = useState(false) // New filter for debtors
  const [expandedTeams, setExpandedTeams] = useState({}) 
  
  // Month/Year Filter (Defaults to Current)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preselectedPlayer, setPreselectedPlayer] = useState(null)
  const [modalTargetMonth, setModalTargetMonth] = useState(null)
  const [modalCategory, setModalCategory] = useState(null) // New

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

  // Helper: Calculate Debt for Current Year
  const calculateDebt = (playerId) => {
      const currentYear = new Date().getFullYear()
      const currentMonthIndex = new Date().getMonth() 
      
      // POLICY: Debt tracking starts from 2026.
      // If we are in 2025 or earlier, we don't show debts.
      if (currentYear < 2026) return 0

      // If viewing a previous year, debt is 12 months (simplified) or specific logic.
      // Requirements say "check current year". Let's stick to current year for "Live Debt".
      if (selectedYear !== currentYear) return 0 

      let debtCount = 0
      // Check from Jan (0) up to Current Month (inclusive)
      for (let i = 0; i <= currentMonthIndex; i++) {
          const targetStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`
          
          const hasPayment = movements.some(m => {
              if (m.type !== 'income' || m.player_id !== playerId) return false
              if (m.payment_month) return m.payment_month.startsWith(targetStr)
              return m.date.startsWith(targetStr)
          })

          if (!hasPayment) debtCount++
      }
      return debtCount
  }
  
  // --- HELPERS ---

  // 1. FEES LOGIC (Existing)
  const getFeesPlayers = () => {
    const targetMonth = parseInt(selectedMonth)
    const targetYear = parseInt(selectedYear)
    const targetMonthStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`

    return players.map(player => {
        const payment = movements.find(m => {
            if (m.type !== 'income' || m.player_id !== player.id) return false
            if (m.category !== 'Cuotas') return false
            
            if (m.payment_month) {
                return m.payment_month.startsWith(targetMonthStr)
            }
            const mDate = new Date(m.date + 'T00:00:00')
            return mDate.getMonth() === targetMonth && mDate.getFullYear() === targetYear
        })
        const debtMonths = calculateDebt(player.id)
        return {
            ...player,
            paid: !!payment,
            paymentDetails: payment,
            debtMonths,
            teamName: player.team_assignments?.[0]?.teams?.nombre || 'Sin Equipo',
            teamId: player.team_assignments?.[0]?.teams?.id || 'noteam'
        }
    })
  }

  // 2. MATRICULAS LOGIC
  const getMatriculaPlayers = () => {
      const targetYearStr = String(selectedYear)
      return players.map(player => {
          const payment = movements.find(m => {
              if (m.type !== 'income' || m.player_id !== player.id) return false
              if (m.category !== 'Matrícula') return false
              // Check Year
              return m.date.startsWith(targetYearStr) || (m.payment_month && m.payment_month.startsWith(targetYearStr))
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

  // 3. UNIFORMS LOGIC
  const getUniformPlayers = () => {
      const targetYearStr = String(selectedYear)
      return players.map(player => {
          // Get all uniform payments for this year
          const playerPayments = movements.filter(m => {
              if (m.type !== 'income' || m.player_id !== player.id) return false
              if (m.category !== 'Uniformes') return false
               return m.date.startsWith(targetYearStr)
          })
          return {
              ...player,
              uniformPayments: playerPayments, // Array
              hasPayments: playerPayments.length > 0,
              teamName: player.team_assignments?.[0]?.teams?.nombre || 'Sin Equipo',
              teamId: player.team_assignments?.[0]?.teams?.id || 'noteam'
          }
      })
  }

  // Universal Grouping
  const groupPlayers = (processedList) => {
      return processedList
        .filter(p => {
             const matchSearch = (p.first_name + ' ' + p.last_name).toLowerCase().includes(searchTerm.toLowerCase())
             if (activeTab === 'fees') {
                 if (hidePaid && p.paid) return false
                 if (hideDebtFree && p.debtMonths === 0) return false
             }
             if (activeTab === 'matriculas') {
                 if (hidePaid && p.paid) return false
             }
             return matchSearch
        })
        .reduce((acc, player) => {
          const tId = player.teamId
          if (!acc[tId]) acc[tId] = { name: player.teamName, players: [], count: 0, paidCount: 0 }
          acc[tId].players.push(player)
          acc[tId].count++
          if (player.paid || player.hasPayments) acc[tId].paidCount++
          return acc
      }, {})
  }

  const currentGrouped = () => {
      if (activeTab === 'fees') return groupPlayers(getFeesPlayers())
      if (activeTab === 'matriculas') return groupPlayers(getMatriculaPlayers())
      if (activeTab === 'uniforms') return groupPlayers(getUniformPlayers())
      return {}
  }

  const groupedData = currentGrouped()

  // Handlers
  const handleRegisterFee = (player) => {
      setPreselectedPlayer(player)
      setModalCategory('Cuotas')
      const targetStr = `${selectedYear}-${String(parseInt(selectedMonth) + 1).padStart(2, '0')}`
      setModalTargetMonth(targetStr)
      setIsModalOpen(true)
  }

  const handleRegisterMatricula = (player) => {
      setPreselectedPlayer(player)
      setModalCategory('Matrícula')
      setModalTargetMonth(`${selectedYear}-01`) // Hack to set year
      setIsModalOpen(true)
  }

  const handleRegisterUniform = (player) => {
      setPreselectedPlayer(player)
      setModalCategory('Uniformes')
      setIsModalOpen(true)
  }

  const toggleTeam = (tId) => {
      setExpandedTeams(prev => ({ ...prev, [tId]: !prev[tId] }))
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tesorería y Pagos</h1>
          <p className="text-slate-500">Controla las finanzas de tu club.</p>
        </div>
        {canEdit && (
             <button 
             onClick={() => { setPreselectedPlayer(null); setModalCategory(null); setIsModalOpen(true); }}
             className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-colors font-bold shadow-lg shadow-slate-900/25"
             >
                <Plus size={20} />
                Registrar Movimiento
             </button>
        )}
      </div>

      {/* Stats Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Balance Total" amount={stats.balance} icon={<DollarSign/>} color="blue" />
          <StatCard label="Ingresos (Mes)" amount={stats.income} icon={<TrendingUp/>} color="green" />
          <StatCard label="Egresos (Mes)" amount={stats.expense} icon={<TrendingDown/>} color="red" />
      </div>

      {/* Tabs Navigation */}
       <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
            {['treasury', 'fees', 'matriculas', 'uniforms'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    {tab === 'treasury' && <><DollarSign size={18} /> Movimientos</>}
                    {tab === 'fees' && <><Calendar size={18} /> Cuotas Mensuales</>}
                    {tab === 'matriculas' && <><CheckCircle size={18} /> Matrículas</>}
                    {tab === 'uniforms' && <><Filter size={18} /> Uniformes</>}
                </button>
            ))}
       </div>

       {loading ? (
             <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>
       ) : activeTab === 'treasury' ? (
           /* TREASURY TABLE */
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
           /* LISTS (Fees, Matriculas, Uniforms) */
           <div className="space-y-6">
                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    {/* Period Selector */}
                    <div className="flex items-center gap-2">
                        {activeTab === 'fees' && (
                            <select 
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
                            >
                                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>
                        )}
                        <select 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
                        >
                            {[2023, 2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar jugador..." 
                            className="w-full pl-10 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filters */}
                    {activeTab !== 'uniforms' && (
                        <button 
                            onClick={() => setHidePaid(!hidePaid)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${hidePaid ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter size={14} /> Only Pending
                        </button>
                    )}
                    
                    {activeTab === 'fees' && (
                         <button 
                            onClick={() => { setHideDebtFree(!hideDebtFree); setHidePaid(false); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${hideDebtFree ? 'bg-red-600 text-white' : 'bg-white text-red-600 hover:bg-red-50'}`}
                        >
                            <AlertCircle size={14} /> Morosos
                        </button>
                    )}
                </div>

                {/* Grouped Lists */}
                {Object.keys(groupedData).length === 0 ? (
                    <div className="text-center p-10 text-slate-400 italic">No se encontraron jugadores.</div>
                ) : (
                    Object.entries(groupedData).map(([tId, group]) => (
                        <div key={tId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
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
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-slate-500">
                                        <span className="font-bold text-green-600">{group.paidCount}</span> {activeTab === 'uniforms' ? 'Compras' : 'Pagados'}
                                    </div>
                                </div>
                            </button>

                            {expandedTeams[tId] && (
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {group.players.map(player => (
                                        <div key={player.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${player.paid || (activeTab==='uniforms' && player.hasPayments) ? 'bg-green-50/50 border-green-100' : 'bg-white border-slate-100 border-l-4 border-l-slate-200'}`}>
                                            <button 
                                                onClick={() => navigate(`/app/players/${player.id}`)}
                                                className="text-left group flex-1"
                                            >
                                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                                                    {player.last_name}, {player.first_name}
                                                </h4>
                                                
                                                {/* TAB SPECIFIC INFO */}
                                                {activeTab === 'fees' && player.debtMonths > 0 && (
                                                     <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 animate-pulse inline-block mt-1">
                                                        Debe {player.debtMonths} meses
                                                    </span>
                                                )}

                                                {activeTab === 'uniforms' && player.hasPayments && (
                                                    <div className="mt-2 space-y-1">
                                                        {player.uniformPayments.map(up => (
                                                            <div key={up.id} className="text-[10px] text-slate-500 bg-white/50 px-1.5 py-0.5 rounded border border-slate-100 truncate">
                                                                {up.description} (${up.amount})
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </button>

                                            <div className="ml-4">
                                                {/* ACTION BUTTONS */}
                                                {activeTab === 'fees' && (
                                                    player.paid ? (
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap"><CheckCircle size={10} className="inline mr-1"/>PAGADO</span>
                                                    ) : (
                                                        canEdit && <button onClick={() => handleRegisterFee(player)} className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-primary font-bold whitespace-nowrap">Registrar</button>
                                                    )
                                                )}

                                                {activeTab === 'matriculas' && (
                                                    player.paid ? (
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap"><CheckCircle size={10} className="inline mr-1"/>OK {selectedYear}</span>
                                                    ) : (
                                                        canEdit && <button onClick={() => handleRegisterMatricula(player)} className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-primary font-bold whitespace-nowrap">Cobrar</button>
                                                    )
                                                )}

                                                {activeTab === 'uniforms' && canEdit && (
                                                     <button onClick={() => handleRegisterUniform(player)} className="text-[10px] border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-bold whitespace-nowrap flex items-center gap-1">
                                                        <Plus size={10}/> Vender
                                                     </button>
                                                )}
                                            </div>
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
            onClose={() => { setIsModalOpen(false); setModalCategory(null); }}
            onSuccess={() => { fetchMovements(); setIsModalOpen(false); setModalCategory(null); }}
            clubId={club?.id}
            preselectedPlayer={preselectedPlayer}
            preselectedMonth={modalTargetMonth}
            preselectedCategory={modalCategory}
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
