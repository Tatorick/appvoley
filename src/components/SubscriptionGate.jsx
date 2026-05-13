import React from 'react'
import { Link } from 'react-router-dom'
import { Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

/**
 * Wraps a feature section - if the user's plan doesn't include it,
 * shows an upgrade prompt instead of the children.
 * 
 * Usage: <SubscriptionGate feature="payments"><Payments /></SubscriptionGate>
 */
export default function SubscriptionGate({ feature, children }) {
  const { canAccess, currentPlan, loading } = useSubscription()

  // Don't block while loading
  if (loading) return children

  // If user has access, render normally
  if (canAccess(feature)) return children

  // Otherwise show upgrade prompt
  const planNames = { free: 'Starter', basic: 'Entrenador', pro: 'Club Pro' }
  const requiredPlan = feature === 'certificates' || feature === 'medical' || feature === 'audit' || feature === 'export'
    ? 'pro' : 'basic'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 400, gap: 24, padding: 40,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #DBEAFE',
      }}>
        <Lock size={32} color="#2563EB" />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          Función Premium
        </h2>
        <p style={{ color: '#64748B', lineHeight: 1.6, margin: '0 0 24px', fontSize: '0.95rem' }}>
          Esta función está disponible a partir del plan <strong>{planNames[requiredPlan]}</strong>.
          Tu plan actual es <strong>{planNames[currentPlan]}</strong>.
        </p>
      </div>

      <Link
        to="/app/subscription"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 32px', borderRadius: 14,
          background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
          color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
          boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
          transition: 'transform .2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <Sparkles size={18} /> Ver Planes <ArrowRight size={16} />
      </Link>
    </div>
  )
}
