import React from 'react'
import { Calendar, MapPin, MessageCircle, Bed, Utensils, Bus, Trophy, Handshake } from 'lucide-react'

export default function MatchPostCard({ post }) {
  const isTournament = post.type === 'tournament'
  
  // Parse hospitality JSON if it's a string, or use as is
  const hospitality = typeof post.hospitality === 'string' 
    ? JSON.parse(post.hospitality) 
    : post.hospitality || {}

  const handleContact = () => {
    if (!post.contact_info) return
    // Simple basic cleaning for whatsapp
    const phone = post.contact_info.replace(/[^0-9]/g, '')
    const msg = `Hola, vi tu publicación "${post.title}" en VoleyManager y me interesa.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col h-full">
      {/* Header Banner */}
      <div className={`h-2 ${isTournament ? 'bg-gradient-to-r from-orange-400 to-pink-500' : 'bg-gradient-to-r from-blue-400 to-cyan-500'}`} />
      
      <div className="p-5 flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
            isTournament ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {isTournament ? <Trophy size={12}/> : <Handshake size={12}/>}
            {isTournament ? 'Torneo' : 'Tope / Amistoso'}
          </span>
          {post.level && (
             <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                {post.level}
             </span>
          )}
        </div>

        {/* Content */}
        <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight group-hover:text-primary transition-colors">
            {post.title}
        </h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow">
            {post.description || 'Sin descripción adicional.'}
        </p>

        {/* Details grid */}
        <div className="space-y-2 mb-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span>{new Date(post.date_start).toLocaleDateString()} {post.time ? `• ${post.time}` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                <span className="truncate">{post.location}</span>
            </div>
        </div>

        {/* Hospitality Icons */}
        <div className="flex gap-3 mb-5 pt-3 border-t border-slate-50">
            {hospitality.housing && (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg" title="Hospedaje Incluido">
                    <Bed size={14} /> <span className="hidden sm:inline">Hospedaje</span>
                </div>
            )}
            {hospitality.food && (
                <div className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-lg" title="Comida Incluida">
                    <Utensils size={14} /> <span className="hidden sm:inline">Comida</span>
                </div>
            )}
            {hospitality.transport && (
                <div className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-lg" title="Transporte Incluido">
                    <Bus size={14} /> <span className="hidden sm:inline">Transporte</span>
                </div>
            )}
            {!hospitality.housing && !hospitality.food && !hospitality.transport && (
                 <span className="text-xs text-slate-400 italic">Solo partido</span>
            )}
        </div>

        {/* Action */}
        <button 
            onClick={handleContact}
            className="w-full mt-auto py-2.5 bg-slate-900 hover:bg-green-600 hover:shadow-green-500/25 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
            <MessageCircle size={18} />
            Contactar
        </button>
      </div>
    </div>
  )
}
