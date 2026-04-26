import React, { useState, useEffect } from 'react'
import { Search, Plus, Trophy, Handshake, Calendar, RefreshCcw, Loader2, Inbox } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useClubData } from '../../hooks/useClubData'
import MatchPostCard from '../../components/Cards/MatchPostCard'
import CreateMatchPostModal from '../../components/Modals/CreateMatchPostModal'
import SendMatchRequestModal from '../../components/Modals/SendMatchRequestModal'
import MatchmakingInbox from './MatchmakingInbox'

export default function Matchmaking() {
  const { user } = useAuth()
  const { role, club } = useClubData()

  // Feed state
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  // Tab state
  const [activeTab, setActiveTab] = useState('explore') // 'explore' | 'inbox'
  const [pendingCount, setPendingCount] = useState(0)

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)

  const canCreate = !!club && (role === 'owner' || role === 'admin' || role === 'coach')

  // ── Fetch posts ──────────────────────────────────────────────────────────────
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
      console.error('Error fetching match posts:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch pending requests badge count ───────────────────────────────────────
  const fetchPendingCount = async () => {
    if (!club) return
    try {
      const { count } = await supabase
        .from('match_requests')
        .select('id', { count: 'exact', head: true })
        .eq('hosting_club_id', club.id)
        .eq('status', 'pending')
      setPendingCount(count || 0)
    } catch (err) {
      console.error('Error fetching pending count:', err)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [filterType])

  useEffect(() => {
    if (club) fetchPendingCount()
  }, [club])

  const handleRequestClick = (post) => {
    setSelectedPost(post)
    setIsRequestModalOpen(true)
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matchmaking</h1>
          <p className="text-slate-500">Encuentra topes, torneos y coordina con otros clubs.</p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl transition-colors font-bold shadow-lg shadow-primary/25"
          >
            <Plus size={20} />
            Publicar Oportunidad
          </button>
        )}
      </div>

      {/* ── Main Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <MainTab
          active={activeTab === 'explore'}
          onClick={() => setActiveTab('explore')}
          label="Explorar"
          icon={<Search size={15} />}
        />
        {club && (
          <MainTab
            active={activeTab === 'inbox'}
            onClick={() => { setActiveTab('inbox'); fetchPendingCount() }}
            label="Solicitudes"
            icon={<Inbox size={15} />}
            badge={pendingCount}
          />
        )}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'explore' ? (
        <>
          {/* Filter Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <FilterButton
              active={filterType === 'all'}
              onClick={() => setFilterType('all')}
              icon={<Calendar size={16} />}
              label="Todo"
            />
            <FilterButton
              active={filterType === 'friendly'}
              onClick={() => setFilterType('friendly')}
              icon={<Handshake size={16} />}
              label="Solo Topes"
            />
            <FilterButton
              active={filterType === 'tournament'}
              onClick={() => setFilterType('tournament')}
              icon={<Trophy size={16} />}
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
            <div className="py-20 flex justify-center text-primary">
              <Loader2 className="animate-spin" size={40} />
            </div>
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
                <button onClick={() => setIsCreateModalOpen(true)} className="text-primary font-bold hover:underline">
                  + Crear Publicación
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map(post => (
                <MatchPostCard
                  key={post.id}
                  post={post}
                  onRequest={club && post.club_id !== club.id ? () => handleRequestClick(post) : undefined}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <MatchmakingInbox />
      )}

      {/* ── Modals ── */}
      <CreateMatchPostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { setIsCreateModalOpen(false); fetchPosts() }}
        clubId={club?.id}
      />

      <SendMatchRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => { setIsRequestModalOpen(false); fetchPendingCount() }}
        post={selectedPost}
        myClub={club}
      />
    </div>
  )
}

// ── Local Components ─────────────────────────────────────────────────────────

function MainTab({ active, onClick, label, icon, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all relative ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
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
