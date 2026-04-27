import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.552c0-1.636-.145-3.2-.414-4.688H24.48v9.02h12.946c-.562 2.98-2.24 5.502-4.762 7.198v5.978h7.706c4.506-4.148 7.162-10.26 7.162-17.508z" fill="#4285F4"/>
      <path d="M24.48 48c6.494 0 11.944-2.152 15.924-5.84l-7.706-5.978c-2.142 1.44-4.888 2.292-8.218 2.292-6.316 0-11.668-4.266-13.584-10.002H3.024v6.172C6.988 42.814 15.164 48 24.48 48z" fill="#34A853"/>
      <path d="M10.896 28.472A14.404 14.404 0 0 1 9.84 24c0-1.558.268-3.074.756-4.472v-6.172H3.024A23.938 23.938 0 0 0 .48 24c0 3.87.928 7.534 2.544 10.644l7.872-6.172z" fill="#FBBC05"/>
      <path d="M24.48 9.524c3.558 0 6.748 1.224 9.262 3.628l6.92-6.92C36.42 2.37 30.972 0 24.48 0 15.164 0 6.988 5.186 3.024 13.356l7.872 6.172c1.916-5.736 7.268-10.004 13.584-10.004z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      navigate('/app')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      })
      if (error) throw error
      // Supabase will redirect the browser to Google — no need to navigate manually
    } catch (err) {
      setError(err.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <img src="/img/logo.png" alt="AppVoley" className="w-full max-w-[280px] h-auto object-contain mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Bienvenido</h2>
            <p className="text-slate-500">Ingresa a tu cuenta de AppVoley</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all font-semibold flex items-center justify-center gap-3 mb-6 shadow-sm"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-400">o ingresa con tu email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Contraseña</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-dark font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg hover:shadow-primary/30 transition-all font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 space-y-2 text-center text-sm text-slate-500">
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/auth?mode=register" className="text-primary hover:text-primary-dark font-semibold">
                Registra tu Club
              </Link>
            </p>
            <p>
              ¿Eres entrenador asistente?{' '}
              <Link to="/assistant-register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Únete con código de club
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
