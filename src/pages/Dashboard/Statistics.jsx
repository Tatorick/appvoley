import React, { useState, useEffect, useMemo } from 'react'
import { BarChart3, TrendingUp, Users, Ruler, Activity, Trophy, PieChart, Plus, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClubData } from '../../hooks/useClubData'
import RegisterMatchResultModal from '../../components/Modals/RegisterMatchResultModal'

export default function Statistics() {
    const { club, loading: clubLoading } = useClubData()
    const [loading, setLoading] = useState(true)
    const [matches, setMatches] = useState([])
    const [players, setPlayers] = useState([])
    const [teams, setTeams] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    // const [activeTab, setActiveTab] = useState('general') // Removed unused for now

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        try {
            const [matchesRes, playersRes, teamsRes] = await Promise.all([
                supabase.from('matches').select('*').eq('club_id', club.id).neq('status', 'canceled'),
                supabase.from('players').select('*').eq('club_id', club.id),
                supabase.from('teams').select('*, categories(nombre)').eq('club_id', club.id)
            ])

            setMatches(matchesRes.data || [])
            setPlayers(playersRes.data || [])
            setTeams(teamsRes.data || [])

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [club])

    useEffect(() => {
        if (club) fetchData()
    }, [club, fetchData])

    // --- Calculations ---

    // 1. General Stats
    const generalStats = useMemo(() => {
        const completed = matches.filter(m => m.status === 'completed')
        const won = completed.filter(m => m.score_us > m.score_them).length
        const lost = completed.length - won
        const winRate = completed.length > 0 ? Math.round((won / completed.length) * 100) : 0

        return { total: completed.length, won, lost, winRate }
    }, [matches])

    // 2. Player Demographics
    const playerStats = useMemo(() => {
        if (players.length === 0) return null

        // Gender
        const male = players.filter(p => p.genero === 'M').length
        const female = players.filter(p => p.genero === 'F').length

        // Height (convert "1.80" or "180" to cm if needed, assuming stored as number or text)
        // Assuming height is in cm or m. Let's check data type later, usually safely parse float.
        const heights = players.map(p => parseFloat(p.altura)).filter(h => h > 0)
        const avgHeight = heights.length ? (heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(2) : 0

        // Age (from fecha_nacimiento)
        const now = new Date()
        const ages = players.map(p => {
            if (!p.fecha_nacimiento) return 0
            const birth = new Date(p.fecha_nacimiento)
            return Math.floor((now - birth) / 31557600000) // approx year
        }).filter(a => a > 0)
        const avgAge = ages.length ? Math.floor(ages.reduce((a, b) => a + b, 0) / ages.length) : 0

        return { male, female, avgHeight, avgAge, total: players.length }
    }, [players])

    // 3. Team Performance
    const teamStats = useMemo(() => {
        return teams.map(team => {
            const teamMatches = matches.filter(m => m.team_id === team.id && m.status === 'completed')
            const won = teamMatches.filter(m => m.score_us > m.score_them).length
            const lost = teamMatches.length - won
            const winRate = teamMatches.length > 0 ? Math.round((won / teamMatches.length) * 100) : 0
            return { ...team, won, lost, total: teamMatches.length, winRate }
        }).sort((a, b) => b.winRate - a.winRate)
    }, [teams, matches])


    if (clubLoading || loading) return <div className="p-10 text-center">Cargando...</div>

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="text-primary" /> Estadísticas
                    </h1>
                    <p className="text-slate-500 text-sm">Análisis de rendimiento y demografía del club.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2"
                >
                    <Plus size={20} /> Registrar Resultado
                </button>
            </div>

            {/* General Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Trophy} label="Rendimiento Global"
                    value={`${generalStats.winRate}%`}
                    subtext={`${generalStats.won} Ganados - ${generalStats.lost} Perdidos`}
                    color="text-yellow-600" bg="bg-yellow-50"
                />
                <StatCard
                    icon={Users} label="Total Jugadores"
                    value={playerStats?.total || 0}
                    subtext={`${playerStats?.male || 0} Hombres - ${playerStats?.female || 0} Mujeres`}
                    color="text-blue-600" bg="bg-blue-50"
                />
                <StatCard
                    icon={Ruler} label="Altura Promedio"
                    value={playerStats?.avgHeight ? `${playerStats.avgHeight}m` : '-'}
                    subtext="Promedio general"
                    color="text-indigo-600" bg="bg-indigo-50"
                />
                <StatCard
                    icon={Activity} label="Edad Promedio"
                    value={playerStats?.avgAge ? `${playerStats.avgAge} años` : '-'}
                    subtext="Promedio general"
                    color="text-green-600" bg="bg-green-50"
                />
            </div>

            {/* Team Performance Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" /> Rendimiento por Equipo
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Equipo</th>
                                <th className="px-6 py-4 text-center">Jugados</th>
                                <th className="px-6 py-4 text-center">G / P</th>
                                <th className="px-6 py-4 text-center">Victoria %</th>
                                <th className="px-6 py-4">Barra de Rendimiento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {teamStats.map(team => (
                                <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-700">{team.nombre}</p>
                                        <p className="text-xs text-slate-400">{team.categories?.nombre} {team.genero}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-600">
                                        {team.total}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-green-600 font-bold">{team.won}</span>
                                        <span className="text-slate-300 mx-1">/</span>
                                        <span className="text-red-500 font-bold">{team.lost}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                                        {team.winRate}%
                                    </td>
                                    <td className="px-6 py-4 w-1/3">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${team.winRate >= 50 ? 'bg-green-500' : 'bg-orange-500'
                                                    }`}
                                                style={{ width: `${team.winRate}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {teamStats.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">
                                        No hay equipos o partidos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECENT MATCHES LIST (NEW) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Trophy size={20} className="text-primary" /> Últimos Partidos Registrados
                    </h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {matches.filter(m => m.status === 'completed').slice(0, 5).map(m => {
                        const teamName = teams.find(t => t.id === m.team_id)?.nombre || 'Equipo'
                        const isWin = m.score_us > m.score_them
                        return (
                            <div key={m.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {isWin ? 'W' : 'L'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 flex flex-col md:flex-row md:items-center md:gap-2">
                                            {teamName} <span className="text-slate-300 hidden md:inline">vs</span> <span className="text-slate-600">{m.opponent_name}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center gap-2">
                                            <Calendar size={12} /> {new Date(m.date).toLocaleDateString()}
                                            {(m.tournament_name || m.notes) && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-bold text-slate-500 uppercase">{m.tournament_name || m.notes}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-slate-900">{m.score_us} - {m.score_them}</p>
                                    <p className="text-xs text-slate-400">{m.set_scores}</p>
                                </div>
                            </div>
                        )
                    })}
                    {matches.filter(m => m.status === 'completed').length === 0 && (
                        <div className="p-8 text-center text-slate-400 italic">No hay historial de partidos.</div>
                    )}
                </div>
            </div>

            <RegisterMatchResultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { fetchData(); setIsModalOpen(false); }}
                clubId={club?.id}
            />
        </div>
    )
}

function StatCard({ icon, label, value, subtext, color, bg }) {
    const IconComponent = icon
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
                <p className="text-xs text-slate-500">{subtext}</p>
            </div>
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <IconComponent size={24} />
            </div>
        </div>
    )
}
