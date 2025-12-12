import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2, CheckCircle, XCircle, Search, Building2, User, MoreHorizontal, ShieldCheck } from 'lucide-react'

export default function AdminDashboard() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchClubs = async () => {
    setLoading(true)
    try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_data')
        if (error) throw error
        setClubs(data || [])
    } catch (err) {
        console.error("Error fetching admin data:", err)
        alert("Error cargando datos: " + (err.message || err.error_description || "Error desconocido"))
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    fetchClubs()
  }, [])

  const handleApprove = async (clubId) => {
      if (!confirm("¿Aprobar este club y habilitar todas sus funciones?")) return

      try {
          const { error } = await supabase.from('clubs').update({ status: 'activo' }).eq('id', clubId)
          if (error) throw error
          
          // Optimistic update
          setClubs(prev => prev.map(c => c.id === clubId ? { ...c, status: 'activo' } : c))
      } catch (err) {
          alert("Error: " + err.message)
      }
  }

  const filteredClubs = clubs.filter(c => 
      c.nombre.toLowerCase().includes(search.toLowerCase()) || 
      c.owner_email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
        <header className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold">Gestión de Clubes</h2>
                <p className="text-slate-400">Administra el acceso y estado de las organizaciones.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-slate-800 p-4 rounded-2xl flex items-center gap-4 border border-slate-700">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Building2 size={24}/></div>
                    <div>
                        <span className="block text-2xl font-bold">{clubs.length}</span>
                        <span className="text-xs text-slate-400 font-bold uppercase">Clubes</span>
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl flex items-center gap-4 border border-slate-700">
                    <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400"><ShieldCheck size={24}/></div>
                    <div>
                        <span className="block text-2xl font-bold">{clubs.filter(c => c.status === 'pendiente').length}</span>
                        <span className="text-xs text-slate-400 font-bold uppercase">Pendientes</span>
                    </div>
                </div>
            </div>
        </header>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
            <input 
                type="text" 
                placeholder="Buscar por nombre o email..." 
                className="w-full pl-12 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500/50 outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            {loading ? (
                <div className="p-20 flex justify-center text-slate-500"><Loader2 className="animate-spin" size={32}/></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                            <tr>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Club</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Dueño / Email</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Ubicación</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Estado</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Jugadores</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredClubs.map(club => (
                                <tr key={club.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white text-lg">{club.nombre}</div>
                                        <div className="text-xs text-slate-500 font-mono">{club.codigo || '—'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <User size={14} className="text-slate-500"/>
                                            {club.owner_name || 'Desconocido'}
                                        </div>
                                        <div className="text-xs text-indigo-400 pl-6">{club.owner_email}</div>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {club.ciudad}, {club.pais}
                                    </td>
                                    <td className="p-4">
                                        {club.status === 'activo' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                                <CheckCircle size={12}/> Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                <MoreHorizontal size={12}/> Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-300 font-mono">
                                        {club.player_count}
                                    </td>
                                    <td className="p-4 text-right">
                                        {club.status === 'pendiente' && (
                                            <button 
                                                onClick={() => handleApprove(club.id)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-all"
                                            >
                                                Aprobar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredClubs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500">
                                        No se encontraron clubes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  )
}
