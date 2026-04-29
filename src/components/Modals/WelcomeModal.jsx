import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Trophy, Calendar, ArrowRight, X, Sparkles } from 'lucide-react'

export default function WelcomeModal({ onClose }) {
  const navigate = useNavigate()

  const handleGoPlayers = () => {
    onClose()
    navigate('/app/players')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-blue-600 p-8 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X size={16} />
          </button>

          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Sparkles size={28} className="text-yellow-300" />
            </div>
            <h2 className="text-2xl font-bold mb-1">¡Club Registrado! 🎉</h2>
            <p className="text-blue-100 text-sm">
              Tu club está listo. Ahora empieza a construir tu equipo.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <p className="text-slate-600 text-sm mb-6">
            Te recomendamos empezar registrando a tus jugadoras. Podrás asignarlas a equipos, 
            hacer seguimiento de pagos, evaluar su físico y más.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {[
              { icon: Users, label: 'Registra tus jugadoras', desc: 'Una a una o desde Excel', color: 'bg-violet-50 text-violet-600' },
              { icon: Trophy, label: 'Crea tus equipos', desc: 'Sub-14, Sub-16, Libre...', color: 'bg-amber-50 text-amber-600' },
              { icon: Calendar, label: 'Gestiona torneos', desc: 'Convocartoias y logística', color: 'bg-emerald-50 text-emerald-600' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{label}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              Explorar primero
            </button>
            <button
              onClick={handleGoPlayers}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
            >
              Ir a Jugadoras <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
