import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  User, Mail, Lock, Building2, MapPin, 
  Phone, FileText, ArrowRight, Loader2, CheckCircle2, AlertCircle 
} from 'lucide-react'
import { validatePhone, validateId } from '../../utils/validations'

export default function RegisterClub() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({}) // { phone: 'Mensaje', rucDni: 'Mensaje' }

  // Form State
  const [formData, setFormData] = useState({
    // Coach / User
    fullName: '',
    email: '',
    password: '',
    // Club
    clubName: '',
    city: '',
    country: '', // Manual input
    phone: '',
    rucDni: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (fieldErrors[name]) {
        setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleBlur = (e) => {
      const { name, value } = e.target
      
      if (name === 'phone' && value) {
          if (!validatePhone(value)) {
              setFieldErrors(prev => ({ ...prev, phone: 'Formato inválido. Use 10 dígitos (09...) o 12 (593...).' }))
          }
      }

      if (name === 'rucDni' && value) {
        if (!validateId(value)) {
            setFieldErrors(prev => ({ ...prev, rucDni: 'Cédula/RUC inválido (Verifique dígitos y provincia).' }))
        }
      }
  }

  const handleNextStep = (e) => {
    e.preventDefault()
    setStep(2)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Final Validation check before submit
    const isPhoneValid = validatePhone(formData.phone)
    const isIdValid = validateId(formData.rucDni)

    if (!isPhoneValid || !isIdValid) {
        setLoading(false)
        setFieldErrors(prev => ({
            ...prev,
            phone: !isPhoneValid ? 'Teléfono inválido' : null,
            rucDni: !isIdValid ? 'Identificación inválida' : null
        }))
        return
    }

    try {
      // 1. Sign Up User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'entrenador_principal'
          }
        }
      })

      // 2. Check Session - If missing, try manual sign in (in case auto-sign-in failed or config is weird)
      let session = authData.session
      let user = authData.user

      if (!session) {
          // Attempt manual login
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password
          })

          if (loginError || !loginData.session) {
             console.error('Login fallback error:', loginError)
             throw new Error(`No se pudo iniciar sesión automática. Error: ${loginError?.message || 'Sesión no iniciada'}`)
          }

          session = loginData.session
          user = loginData.user
      }

      const userId = user.id

      // 2. Create Profile (Or verify it exists if Trigger ran)
      // We accept that the Trigger might have created it, so we simply UPDATE it to be sure, or insert if missing (Upsert).
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          nombre_completo: formData.fullName,
          rol: 'entrenador_principal'
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        // If the error is RLS related but the user exists, we might proceed? No, we need the profile.
        throw new Error('Error creando perfil: ' + profileError.message)
      }

      // 3. Create Club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert({
          nombre: formData.clubName,
          ciudad: formData.city,
          pais: formData.country,
          telefono_contacto: formData.phone,
          ruc_dni: formData.rucDni,
          created_by: userId,
          status: 'pendiente'
        })
        .select()
        .single()

      if (clubError) throw new Error('Error creando club: ' + clubError.message)
      
      // 4. Add User as Club Member (Admin/Owner)
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
            club_id: clubData.id,
            profile_id: userId,
            role_in_club: 'entrenador_principal'
        })
      
      if (memberError) console.error('Member creation error:', memberError) // Non-fatal but problematic

      navigate('/app')

    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 flex">
          <div className={`h-full bg-primary transition-all duration-300 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
        </div>

        <div className="p-8">
          <div className="mb-8">
             <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {step === 1 ? 'Datos del Entrenador' : 'Detalles del Club'}
             </h2>
             <p className="text-slate-500">
                {step === 1 ? 'Comencemos creando tu cuenta de administrador' : 'Registra la información básica de tu club'}
             </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={step === 1 ? handleNextStep : handleRegister} className="space-y-6">
            
            {/* STEP 1: COACH DETAILS */}
            {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="text" name="fullName" required
                                value={formData.fullName} onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="Ricardo Perez"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="email" name="email" required
                                value={formData.email} onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="ricardo@voley.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="password" name="password" required minLength={6}
                                value={formData.password} onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: CLUB DETAILS */}
            {step === 2 && (
                 <div className="space-y-4 animate-fade-in">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">País</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input 
                                    type="text" name="country" required
                                    value={formData.country} onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Perú"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Ciudad</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input 
                                    type="text" name="city" required
                                    value={formData.city} onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Lima"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input 
                                    type="text" name="phone"
                                    value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${fieldErrors.phone ? 'border-red-500' : 'border-slate-200'}`}
                                    placeholder="999..."
                                />
                            </div>
                            {fieldErrors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.phone}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">RUC / DNI</label>
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
                 </div>
            )}

            <div className="flex gap-3 pt-4">
                {step === 2 && (
                    <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                    >
                        Atrás
                    </button>
                )}
                
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg hover:shadow-primary/30 transition-all font-semibold flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" /> Registrando...</>
                    ) : (
                        step === 1 ? <>Continuar <ArrowRight size={20}/></> : 'Finalizar Registro'
                    )}
                </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/auth" className="text-primary hover:text-primary-dark font-semibold">
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
