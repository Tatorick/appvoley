import React, { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus, Zap, BrainCircuit, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import LogPerformanceModal from '../../components/Modals/LogPerformanceModal'

export default function PlayerStats({ playerId, clubId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('all')

  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
        .from('player_performance_logs')
        .select('*')
        .eq('player_id', playerId)
        .order('date', { ascending: true }) // Ascending for graph/trend
    setLogs(data || [])
    setLoading(false)
  }, [playerId])

  useEffect(() => {
    if(playerId) fetchLogs()
  }, [playerId, fetchLogs])

  // Get Unique Metrics
  const metrics = [...new Set(logs.map(l => l.metric_type))]

  // Filter Logic
  const filteredLogs = selectedMetric === 'all' 
    ? logs 
    : logs.filter(l => l.metric_type === selectedMetric)
  
  // Group by metric for display
  const logsByMetric = {}
  logs.forEach(l => {
      if(!logsByMetric[l.metric_type]) logsByMetric[l.metric_type] = []
      logsByMetric[l.metric_type].push(l)
  })

  // Basic "AI" Analysis Function
  const analyzeTrend = (metricLogs) => {
      if (!metricLogs || metricLogs.length < 2) return null
      
      const last = metricLogs[metricLogs.length - 1]
      const prev = metricLogs[metricLogs.length - 2]
      const diff = parseFloat(last.value) - parseFloat(prev.value)
      
      const isImprovement = diff > 0
      const isDecline = diff < 0
      
      // Tips Dictionary
      const tips = {
          'vertical_jump_cm': isDecline ? "Incorporar ejercicios pliométricos y sentadillas explosivas." : "¡Buen progreso en potencia de piernas!",
          'attack_power_1_10': isDecline ? "Revisar técnica de armado de brazo y rotación de tronco." : "El ataque se ve sólido.",
          'serve_accuracy_1_10': isDecline ? "Enfocar en rutina de saque y consistencia de lanzamiento." : "Saque estable.",
          'reception_quality_1_10': isDecline ? "Trabajar desplazamientos laterales y plataforma de brazos." : "Buena base defensiva."
      }

      return {
          status: isImprovement ? 'up' : isDecline ? 'down' : 'stable',
          diff: diff.toFixed(1),
          tip: tips[last.metric_type] || "Mantener constancia en el entrenamiento."
      }
  }

  // Label Dictionary
  const metricLabels = {
      'vertical_jump_cm': 'Salto Vertical (cm)',
      'attack_power_1_10': 'Potencia Remate (1-10)',
      'serve_accuracy_1_10': 'Precisión Saque (1-10)',
      'reception_quality_1_10': 'Recepción (1-10)',
      'speed_20m_sec': 'Velocidad 20m (s)',
      'block_height_cm': 'Alcance Bloqueo (cm)'
  }

  if (loading) return <div className="py-8 text-center text-slate-400">Cargando evolución...</div>

  return (
    <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-pink-500" size={20}/> Evolución y Métricas
            </h3>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
                <Plus size={14}/> Registrar Test
            </button>
        </div>

        {/* Empty State */}
        {logs.length === 0 && (
             <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center text-slate-400">
                <Activity size={40} className="mx-auto mb-3 opacity-20"/>
                <p>No hay registros de rendimiento.</p>
                <p className="text-xs">Registra tests físicos o técnicos para ver el progreso.</p>
            </div>
        )}

        {/* AI Insight Card - Show for the most recent actively changed metric or general summary */}
        {logs.length > 0 && (
             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainCircuit size={100} className="text-indigo-600"/>
                </div>
                <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-3 relative z-10">
                    <BrainCircuit size={18}/> Asistente Técnico IA
                </h4>
                
                <div className="space-y-3 relative z-10">
                    {Object.entries(logsByMetric).map(([key, mLogs]) => {
                        const analysis = analyzeTrend(mLogs)
                        if (!analysis || analysis.status === 'stable') return null
                        
                        return (
                            <div key={key} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100/50 flex gap-4 items-start">
                                <div className={`p-2 rounded-full ${analysis.status === 'down' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {analysis.status === 'down' ? <TrendingDown size={16}/> : <TrendingUp size={16}/>}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {metricLabels[key] || key}: 
                                        <span className={analysis.status === 'down' ? 'text-red-500' : 'text-green-600'}> {analysis.diff}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        💡 {analysis.tip}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    {Object.keys(logsByMetric).every(k => !analyzeTrend(logsByMetric[k]) || analyzeTrend(logsByMetric[k]).status === 'stable') && (
                        <p className="text-sm text-indigo-700 italic">
                            Los datos indican estabilidad en el rendimiento. Sigue monitoreando para detectar cambios.
                        </p>
                    )}
                </div>
            </div>
        )}

        {/* Metric Cards / Mini Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(logsByMetric).map(([key, mLogs]) => {
                const latest = mLogs[mLogs.length - 1]
                // Simple SVG Sparkline
                const maxVal = Math.max(...mLogs.map(l => parseFloat(l.value)))
                const minVal = Math.min(...mLogs.map(l => parseFloat(l.value)))
                const range = maxVal - minVal || 1
                
                const points = mLogs.map((l, i) => {
                    const x = (i / (mLogs.length - 1 || 1)) * 100
                    const y = 100 - ((parseFloat(l.value) - minVal) / range) * 80 - 10 // Padded
                    return `${x},${y}`
                }).join(' ')

                return (
                    <div key={key} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">{metricLabels[key] || key}</p>
                                <p className="text-2xl font-bold text-slate-800">{latest.value}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400">{new Date(latest.date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="h-16 w-full bg-slate-50 rounded-lg relative overflow-hidden flex items-end">
                            {mLogs.length > 1 ? (
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <polyline 
                                        fill="none" 
                                        stroke="#db2777" 
                                        strokeWidth="3" 
                                        points={points}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>
                            ) : (
                                <p className="w-full text-center text-[10px] text-slate-300 mb-2">Se necesitan más datos</p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>

        <LogPerformanceModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchLogs}
            clubId={clubId}
            preselectedPlayerId={playerId}
        />
    </div>
  )
}
