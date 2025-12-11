import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, Users, User, 
  CreditCard, Swords, Settings, LogOut, Menu, X, ChevronRight, Calendar, BarChart3, CalendarCheck
} from 'lucide-react'

const SidebarItem = ({ icon: Icon, text, to, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-primary'} />
    <span className="font-medium">{text}</span>
    {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
  </Link>
)

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { icon: LayoutDashboard, text: 'Inicio', to: '/app' },
    { icon: Calendar, text: 'Agenda', to: '/app/agenda' },
    { icon: CalendarCheck, text: 'Asistencia', to: '/app/attendance' },
    { icon: Users, text: 'Equipos', to: '/app/teams' },
    { icon: User, text: 'Jugadores', to: '/app/players' },
    { icon: CreditCard, text: 'Pagos', to: '/app/payments' },
    { icon: BarChart3, text: 'Estadísticas', to: '/app/statistics' },
    { icon: Swords, text: 'Matchmaking', to: '/app/matchmaking' },
    { icon: Settings, text: 'Configuración', to: '/app/settings' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">
             VoleyManager
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => (
            <SidebarItem
              key={item.to}
              {...item}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
             <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{user?.user_metadata?.full_name || 'Usuario'}</div>
                <div className="text-xs text-slate-500 capitalize">{user?.user_metadata?.role?.replace('_', ' ') || 'Coach'}</div>
             </div>
             <div className="w-10 h-10 bg-linear-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-primary/20 shadow-lg shadow-primary/25">
                {(user?.user_metadata?.full_name?.[0] || 'U').toUpperCase()}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
