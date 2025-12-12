import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout() {
  const { signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    // Later we can add more like 'Bans', 'Global Settings'
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col fixed h-full">
        <div className="mb-10 flex items-center gap-3 text-red-400">
            <ShieldAlert size={32} />
            <div>
                <h1 className="font-bold text-xl leading-none">Super Admin</h1>
                <p className="text-xs text-slate-500 font-mono">VoleyManager</p>
            </div>
        </div>

        <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                    <Link 
                        key={item.path}
                        to={item.path} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                            isActive 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </Link>
                )
            })}
        </nav>

        <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mt-auto"
        >
            <LogOut size={20} />
            Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
        </div>
      </main>
    </div>
  )
}
