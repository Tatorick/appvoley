import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  User, Mail, Lock, Hash, ArrowRight, Loader2, AlertCircle, CheckCircle2, Users
} from 'lucide-react'

export default function AssistantRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clubFound, setClubFound] = useState(null)   // { id, nombre } when code is validated
  const [checkingCode, setCheckingCode] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    clubCode: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Reset club validation when code changes
    if (name === 'clubCode') setClubFound(null)
    setError(null)
  }

  // Validate club code on blur
  const handleCodeBlur = async () => {
    const code = formData.clubCode.trim()
    if (!code) return

    setCheckingCode(true)
    setClubFound(null)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('clubs')
        .select('id, nombre')
        .eq('codigo', code)
        .maybeSingle()

      if (dbError) throw dbError

      if (!data) {
        setError('Código de club no encontrado. Verifica con tu entrenador principal.')
      } else {
        setClubFound(data)
      }
    } catch (err) {
      setError('Error al verificar el código: ' + err.message)
    } finally {
      setCheckingCode(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)

    if (!clubFound) {
      setError('Por favor valida el código de club antes de continuar.')
      return
    }
    if (formData.fullName.trim().length < 3) {
      setError('El nombre completo debe tener al menos 3 caracteres.')
      return
    }

    setLoading(true)
    try {
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'staff',
          }
        }
      })
      if (authError) throw authError

      // 2. Ensure session (some configs require email confirm — handle gracefully)
      let session = authData.session
      let user = authData.user

      if (!session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (loginError || !loginData.session) {
          throw new Error('Cuenta creada. Por favor revisa tu correo para confirmar y luego inicia sesión.')
        }
        session = loginData.session
        user = loginData.user
      }

      const userId = user.id

      // 3. Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          nombre_completo: formData.fullName.trim(),
          rol: 'staff',
        })
      if (profileError) throw new Error('Error creando perfil: ' + profileError.message)

      // 4. Create join request
      const { error: requestError } = await supabase
        .from('club_requests')
        .insert({
          club_id: clubFound.id,
          profile_id: userId,
          role_requested: 'assistant',
          status: 'pending'
        })
      if (requestError) throw new Error('Error enviando solicitud: ' + requestError.message)

      // 5. Show success message instead of navigating
      setRequestSent(true)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-slate-500 mb-6">
            Te has registrado correctamente. Tu solicitud para unirte al club <strong>{clubFound?.nombre}</strong> ha sido enviada al entrenador principal para su aprobación.
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Recibirás acceso a la plataforma una vez que tu solicitud sea aprobada.
          </p>
          <Link
            to="/auth"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all font-semibold flex items-center justify-center"
          >
            Ir al Inicio de Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header accent */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />

        <div className="p-8">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Users size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Unirse como Asistente</h2>
            <p className="text-slate-500 text-sm">Ingresa con el código que te proporcionó tu entrenador principal.</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Club Code — first for UX clarity */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Código del Club <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="clubCode"
                  required
                  value={formData.clubCode}
                  onChange={handleChange}
                  onBlur={handleCodeBlur}
                  className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 outline-none font-mono tracking-widest uppercase text-sm ${
                    clubFound
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-slate-200'
                  }`}
                  placeholder="ABC123"
                />
                {/* Status icon inside input */}
                <div className="absolute right-3 top-3.5">
                  {checkingCode && <Loader2 size={18} className="animate-spin text-slate-400" />}
                  {!checkingCode && clubFound && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>

              {/* Club name confirmation */}
              {clubFound && (
                <p className="mt-1.5 text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Club encontrado: <span className="font-bold">{clubFound.nombre}</span>
                </p>
              )}
              {!clubFound && !checkingCode && formData.clubCode && !error && (
                <p className="mt-1 text-xs text-slate-400">Pégate del campo para verificar el código.</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 outline-none"
                  placeholder="Carlos Mendoza"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 outline-none"
                  placeholder="carlos@correo.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !clubFound}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={20} /> Registrando...</>
                ) : (
                  <>Unirme al Club <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2 text-sm text-slate-500">
            <p>
              ¿Eres el entrenador principal?{' '}
              <Link to="/register-club" className="text-primary hover:text-primary-dark font-semibold">
                Registra tu club
              </Link>
            </p>
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link to="/auth" className="text-primary hover:text-primary-dark font-semibold">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
