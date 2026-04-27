import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, User, Calendar, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function PortalLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    club_code: '',
    dni: '',
    dob: ''
  })
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
      e.preventDefault()
      setLoading(true)
      setError(null)
      try {
          // Call the RPC function
          const { data, error: rpcError } = await supabase
            .rpc('get_player_portal_info', {
                p_club_code: formData.club_code,
                p_dni: formData.dni, 
                p_dob: formData.dob
            })

          if (rpcError) throw rpcError
          
          if (!data || data.error) {
              throw new Error(data?.error || 'Datos incorrectos')
          }

          // Success! Store data + login credentials (needed for correction request RPC)
          navigate('/portal/dashboard', {
              state: {
                  playerData: data,
                  loginData: {
                      club_code: formData.club_code,
                      dni: formData.dni,
                      dob: formData.dob
                  }
              }
          })

      } catch (err) {
          console.error(err)
          setError(err.message || 'Error al conectar')
      } finally {
          setLoading(false)
      }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="p-6">
            <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium w-fit transition-colors">
                <ArrowLeft size={20} />
                Volver al inicio
            </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 p-8 rounded-3xl w-full max-w-md shadow-xl animate-in zoom-in-95">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
                    <User className="text-white" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Portal del Jugador</h1>
                <p className="text-slate-500 text-sm">Consulta tus estadísticas y estado de cuenta</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-slate-700 uppercase ml-1 mb-1.5 block">Código del Club</label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Ej. CLUB-8X9"
                            required
                            value={formData.club_code}
                            onChange={e => setFormData({...formData, club_code: e.target.value})}
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 uppercase ml-1 mb-1.5 block">Cédula / DNI</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Identificación del jugador"
                            required
                            value={formData.dni}
                            onChange={e => setFormData({...formData, dni: e.target.value})}
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 uppercase ml-1 mb-1.5 block">Fecha de Nacimiento</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                        <input 
                            type="date" 
                            required
                            value={formData.dob}
                            onChange={e => setFormData({...formData, dob: e.target.value})}
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? <Loader2 className="animate-spin"/> : <><span className="mr-1">Ingresar</span> <ArrowRight size={20}/></>}
                </button>
            </form>
            
            <div className="mt-8 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} AppVoley
            </div>
            </div>
        </div>
    </div>
  )
}
