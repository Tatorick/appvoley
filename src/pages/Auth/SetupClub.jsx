import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { 
  Building2, MapPin, Phone, FileText, ArrowRight, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react'
import { validatePhone, validateId } from '../../utils/validations'

/**
 * SetupClub — shown after Google OAuth registration.
 * The user is already authenticated; they only need to fill in club details.
 */
export default function SetupClub() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [alreadyHasClub, setAlreadyHasClub] = useState(false)
  const [checking, setChecking] = useState(true)

  const [formData, setFormData] = useState({
    clubName: '',
    city: '',
    country: 'Ecuador',
    phone: '',
    rucDni: '',
  })

  // If user already has a club, redirect straight to /app
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth?mode=register', { replace: true })
      return
    }

    const checkExistingClub = async () => {
      const { data } = await supabase
        .from('club_members')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1)

      if (data && data.length > 0) {
        setAlreadyHasClub(true)
        navigate('/app', { replace: true })
      } else {
        setChecking(false)
      }
    }

    checkExistingClub()
  }, [user, authLoading, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (name === 'phone' && value && !validatePhone(value)) {
      setFieldErrors(prev => ({ ...prev, phone: 'Formato inválido. Use 10 dígitos (09...) o 12 (593...).' }))
    }
    if (name === 'rucDni' && value && !validateId(value)) {
      setFieldErrors(prev => ({ ...prev, rucDni: 'Cédula/RUC inválido (Verifique dígitos y provincia).' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const cleanClubName = formData.clubName.trim()
    const cleanCity = formData.city.trim()
    const cleanCountry = formData.country.trim()

    if (cleanClubName.length < 3) {
      setError('El nombre del club debe tener al menos 3 caracteres.')
      return
    }
    if (cleanCity.length < 3) {
      setError('La ciudad debe tener al menos 3 caracteres.')
      return
    }

    const isPhoneValid = !formData.phone || validatePhone(formData.phone)
    const isIdValid = !formData.rucDni || validateId(formData.rucDni)

    if (!isPhoneValid || !isIdValid) {
      setFieldErrors({
        phone: !isPhoneValid ? 'Teléfono inválido' : null,
        rucDni: !isIdValid ? 'Identificación inválida' : null,
      })
      return
    }

    setLoading(true)
    try {
      const userId = user.id
      const fullName = user.user_metadata?.full_name || user.email

      // 1. Upsert profile (Google already provided name via metadata)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          nombre_completo: fullName,
          rol: 'entrenador_principal',
        })
      if (profileError) throw new Error('Error creando perfil: ' + profileError.message)

      // 2. Create Club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert({
          nombre: cleanClubName,
          ciudad: cleanCity,
          pais: cleanCountry,
          telefono_contacto: formData.phone || null,
          ruc_dni: formData.rucDni || null,
          created_by: userId,
          status: 'aprobado',
        })
        .select()
        .single()
      if (clubError) throw new Error('Error creando club: ' + clubError.message)

      // 3. Add user as club admin
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubData.id,
          profile_id: userId,
          role_in_club: 'entrenador_principal',
        })
      if (memberError) console.error('Member creation error:', memberError)

      sessionStorage.setItem('showWelcome', 'true')
      navigate('/app')
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress bar — always full since this is the last step */}
        <div className="h-2 bg-slate-100">
          <div className="h-full bg-primary w-full transition-all duration-300" />
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Cuenta creada con Google</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{user?.email}</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Detalles del Club</h2>
            <p className="text-slate-500">Ya casi terminas. Registra la información de tu club de voley.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Club Name */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Nombre del Club</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text" name="clubName" required
                  value={formData.clubName} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Club Voley Los Andes"
                />
              </div>
            </div>

            {/* Country + City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">País</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-lg select-none pointer-events-none">🇪🇨</span>
                  <input
                    type="text" name="country" required
                    value={formData.country} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Ecuador"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Pre-completado. Puedes cambiarlo.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Ciudad</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text" name="city" required
                    value={formData.city} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Cuenca"
                  />
                </div>
              </div>
            </div>

            {/* Phone + RUC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Teléfono <span className="text-slate-400">(opcional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text" name="phone"
                    value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${fieldErrors.phone ? 'border-red-500' : 'border-slate-200'}`}
                    placeholder="09..."
                  />
                </div>
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">RUC / DNI <span className="text-slate-400">(opcional)</span></label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text" name="rucDni"
                    value={formData.rucDni} onChange={handleChange} onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${fieldErrors.rucDni ? 'border-red-500' : 'border-slate-200'}`}
                    placeholder="Doc. Identidad"
                  />
                </div>
                {fieldErrors.rucDni && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.rucDni}</p>}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg hover:shadow-primary/30 transition-all font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" /> Creando club...</>
                ) : (
                  <>Finalizar Registro <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/auth" className="text-primary hover:text-primary-dark font-semibold">
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
