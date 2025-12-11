import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, Trophy, Handshake, Calendar, RefreshCcw, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useClubData } from '../../hooks/useClubData'
import MatchPostCard from '../../components/Cards/MatchPostCard'
import CreateMatchPostModal from '../../components/Modals/CreateMatchPostModal'

export default function Matchmaking() {
  const { user } = useAuth()
  const { role, club } = useClubData()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all') // 'all', 'friendly', 'tournament'
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Can create posts? (Only if owner/admin/coach of a club)
  const canCreate = !!club && (role === 'owner' || role === 'admin' || role === 'coach')

  const fetchPosts = async () => {
    setLoading(true)
    try {
        let query = supabase
            .from('match_posts')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(50)

        if (filterType !== 'all') {
            query = query.eq('type', filterType)
        }

        const { data, error } = await query
        if (error) throw error
        setPosts(data || [])
    } catch (err) {
        console.error("Error fetching match posts:", err)
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [filterType])

  return (
    <div className="space-y-6">
       
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mercado de Oportunidades</h1>
          <p className="text-slate-500">Encuentra topes, torneos y nuevas experiencias para tu club.</p>
        </div>
        
        {canCreate && (
             <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl transition-colors font-bold shadow-lg shadow-primary/25"
             >
                <Plus size={20} />
                Publicar Oportunidad
             </button>
        )}
      </div>

       {/* Filters */}
       <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <FilterButton 
                active={filterType === 'all'} 
                onClick={() => setFilterType('all')} 
                icon={<Calendar size={16}/>} 
                label="Todo" 
            />
            <FilterButton 
                active={filterType === 'friendly'} 
                onClick={() => setFilterType('friendly')} 
                icon={<Handshake size={16}/>} 
                label="Solo Topes" 
            />
            <FilterButton 
                active={filterType === 'tournament'} 
                onClick={() => setFilterType('tournament')} 
                icon={<Trophy size={16}/>} 
                label="Torneos" 
            />
            
            <div className="ml-auto">
                <button onClick={fetchPosts} className="p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-slate-100">
                    <RefreshCcw size={18} />
                </button>
            </div>
       </div>

       {/* Feed Grid */}
       {loading ? (
            <div className="py-20 flex justify-center text-primary"><Loader2 className="animate-spin" size={40}/></div>
       ) : posts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm border-dashed">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No se encontraron publicaciones</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Aún no hay oportunidades activas en este momento. Sé el primero en crear una.
                </p>
                {canCreate && (
                    <button onClick={() => setIsModalOpen(true)} className="text-primary font-bold hover:underline">
                        + Crear Publicación
                    </button>
                )}
            </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map(post => (
                    <MatchPostCard key={post.id} post={post} />
                ))}
           </div>
       )}

       <CreateMatchPostModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => { setIsModalOpen(false); fetchPosts(); }} 
            clubId={club?.id}
       />
    </div>
  )
}

function FilterButton({ active, onClick, icon, label }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                active 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
            }`}
        >
            {icon} {label}
        </button>
    )
}
