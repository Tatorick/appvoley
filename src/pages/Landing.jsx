import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LogIn, LayoutDashboard } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar - Transparent/Glassmorphism */}
      <nav className="w-full py-4 px-6 fixed top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">
            VoleyManager
          </div>
          <div className="flex gap-4">
             <Link 
              to="/auth" 
              className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-700 hover:text-primary transition-colors font-medium"
            >
              <LogIn size={20} />
              Ingresar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-200">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
              Gestiona tu club <br/>
              <span className="text-primary">al siguiente nivel</span>
            </h1>
            <p className="text-xl text-secondary max-w-lg leading-relaxed">
              La plataforma integral para clubes de voleibol. Gestión de jugadores, pagos, canteras y matchmaking profesional en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/auth?mode=register" 
                className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-1 font-semibold flex items-center gap-2"
              >
                Registrar Club <ArrowRight size={20}/>
              </Link>
              <Link 
                to="/app" 
                className="px-8 py-4 bg-white hover:bg-gray-50 text-slate-800 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold"
              >
                Ver Demo
              </Link>
            </div>
            
            <div className="flex gap-8 pt-8 border-t border-gray-200/50">
              <div>
                <span className="block text-3xl font-bold text-slate-900">50+</span>
                <span className="text-sm text-secondary">Clubes Activos</span>
              </div>
              <div>
                <span className="block text-3xl font-bold text-slate-900">1k+</span>
                <span className="text-sm text-secondary">Jugadores</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block relative">
             {/* Abstract UI representation */}
             <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 transform rotate-3 hover:rotate-0 transition-all duration-500">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold"><LayoutDashboard/></div>
                    <div>
                        <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 w-20 bg-slate-100 rounded"></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                            <div className="h-2 w-full bg-slate-100 rounded"></div>
                        </div>
                    </div>
                    <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 rounded-full"></div>
                         <div className="flex-1">
                            <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                            <div className="h-2 w-full bg-slate-100 rounded"></div>
                        </div>
                    </div>
                </div>
             </div>
             {/* Floating elements */}
             <div className="absolute -top-10 -right-10 bg-white p-4 rounded-xl shadow-xl animate-bounce-slow">
                 <span className="font-bold text-primary">Matchmaking</span> 🏐
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
