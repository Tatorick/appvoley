import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Loader2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
// import Login from './Login' // Optional, not using for now

export default function JoinClub() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (token) {
        validateToken()
    } else {
        setError('Token de invitación no encontrado.')
        setLoading(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
        // Debug: Show what token we are looking for
        console.log("Validating token:", token)

        const { data, error: dbError } = await supabase
            .from('club_invitations')
            .select('*, clubs(nombre)')
            .eq('token', token)
            // .eq('status', 'pending') // Let's relax filters to debug (RLS might still block, but let's try)
            // .gt('expires_at', new Date().toISOString())
            .maybeSingle() // Don't throw if 0 rows, just return null

        if (dbError) {
            throw dbError // Real DB error (RLS, connection, etc)
        }

        if (!data) {
            // No rows found. Could be:
            // 1. Wrong Token
            // 2. Expired/Accepted (RLS hides them)
            // 3. RLS policy failure completely
            throw new Error(`Invitación no encontrada (Row is null). Token: ${token}`)
        }
        
        // Manual check for status/expiry if we relaxed the query (though RLS likely enforces it)
        if (data.status !== 'pending') throw new Error(`Estado inválido: ${data.status}`)
        if (new Date(data.expires_at) < new Date()) throw new Error(`Expirada: ${data.expires_at}`)

        setInvite(data)
    } catch (err) {
        console.error(err)
        setError(
            `Error: ${err.message || 'Unknown'}` + 
            (err.code ? ` (Code: ${err.code})` : '') +
            (err.details ? ` (Details: ${err.details})` : '')
        )
    } finally {
        setLoading(false)
    }
  }

  const handleAccept = async () => {
    setProcessing(true)
    try {
        const { data, error } = await supabase.rpc('accept_invitation', { invite_token: token })
        
        if (error) throw error
        if (data && !data.success) throw new Error(data.error)

        // Success!
        navigate('/app') // Redirect to dashboard
    } catch (err) {
        console.error(err)
        alert(err.message || 'Error al aceptar invitación')
    } finally {
        setProcessing(false)
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    )
  }

  if (error) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Invitación Inválida</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <Link to="/login" className="inline-block px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    Ir al Inicio
                </Link>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-primary/5 p-8 text-center border-b border-primary/10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-primary shadow-sm border border-primary/10">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Te han invitado a unirte</h2>
                <p className="text-slate-600">
                    Al club <span className="font-bold text-primary">{invite?.clubs?.nombre}</span> como <span className="font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">{invite?.role}</span>
                </p>
            </div>
            
            <div className="p-8">
                {user ? (
                    <div className="text-center space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                            <p className="text-sm text-slate-500 mb-1">Has iniciado sesión como:</p>
                            <p className="font-bold text-slate-900">{user.email}</p>
                        </div>
                        <button 
                            onClick={handleAccept} 
                            disabled={processing}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                        >
                            {processing ? <Loader2 className="animate-spin"/> : 'Aceptar Invitación'} 
                        </button>
                         <p className="text-xs text-slate-400 mt-4">
                            ¿No eres tú? <button onClick={() => supabase.auth.signOut()} className="text-slate-600 underline">Cerrar Sesión</button>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-slate-600 mb-4">Para aceptar, necesitas iniciar sesión o registrarte.</p>
                            <Link 
                                to={`/auth?mode=login&join=${token}`} // Simplified
                                className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-center hover:bg-slate-800 transition-colors mb-3"
                            >
                                Iniciar Sesión
                            </Link>
                             <Link 
                                to={`/auth?mode=register&join=${token}`}
                                className="block w-full py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-bold text-center hover:border-slate-300 transition-colors"
                            >
                                Registrarme
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}
