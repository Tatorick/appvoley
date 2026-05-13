import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'Para empezar',
    monthly: 0,
    annual: 0,
    color: '#64748B',
    gradient: 'linear-gradient(135deg, #475569, #64748B)',
    features: [
      { text: 'Hasta 15 jugadores', included: true },
      { text: 'Hasta 2 equipos', included: true },
      { text: 'Gestión básica de jugadores', included: true },
      { text: 'Control de asistencia', included: true },
      { text: 'Agenda / Calendario', included: true },
      { text: 'Matchmaking entre clubes', included: true },
      { text: 'Portal del Jugador', included: true },
      { text: '1 usuario admin', included: true },
      { text: 'Tesorería / Finanzas', included: false },
      { text: 'Gestión de Torneos', included: false },
      { text: 'Estadísticas avanzadas', included: false },
      { text: 'Certificados', included: false },
    ],
    cta: 'Empezar Gratis',
    popular: false,
  },
  {
    id: 'basic',
    name: 'Entrenador',
    tagline: 'Lo esencial',
    monthly: 9.99,
    annual: 89.99,
    color: '#2563EB',
    gradient: 'linear-gradient(135deg, #2563EB, #4F46E5)',
    features: [
      { text: 'Hasta 50 jugadores', included: true },
      { text: 'Hasta 5 equipos', included: true },
      { text: 'Gestión completa de jugadores', included: true },
      { text: 'Control de asistencia', included: true },
      { text: 'Agenda / Calendario', included: true },
      { text: 'Matchmaking entre clubes', included: true },
      { text: 'Portal del Jugador', included: true },
      { text: '2 usuarios (+ 1 asistente)', included: true },
      { text: 'Tesorería / Finanzas', included: true },
      { text: 'Gestión de Torneos', included: true },
      { text: 'Estadísticas básicas', included: true },
      { text: 'Soporte email prioritario', included: true },
    ],
    cta: 'Probar 7 Días Gratis',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Club Pro',
    tagline: 'Todo incluido',
    monthly: 19.99,
    annual: 179.99,
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED, #9333EA)',
    features: [
      { text: 'Jugadores ilimitados', included: true },
      { text: 'Equipos ilimitados', included: true },
      { text: 'Todo del plan Entrenador', included: true },
      { text: 'Estadísticas avanzadas + PDF', included: true },
      { text: 'Certificados personalizables', included: true },
      { text: 'Historial médico completo', included: true },
      { text: 'Hasta 5 usuarios / staff', included: true },
      { text: 'Auditoría de pagos', included: true },
      { text: 'Exportar datos (CSV/PDF)', included: true },
      { text: 'Logo personalizado', included: true },
      { text: 'Soporte WhatsApp prioritario', included: true },
      { text: 'Funciones futuras incluidas', included: true },
    ],
    cta: 'Probar 7 Días Gratis',
    popular: false,
  },
]

export default function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" style={{ padding: '120px 5%', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 999,
            background: '#F5F3FF', border: '1px solid #EDE9FE',
            fontSize: 13, color: '#7C3AED', fontWeight: 700, marginBottom: 20,
          }}>
            <Sparkles size={14} /> Planes y Precios
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900,
            margin: '0 0 16px', letterSpacing: '-1px', color: '#0F172A',
          }}>
            Un plan para cada club
          </h2>
          <p style={{ color: '#64748B', maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.7, fontSize: '1.1rem' }}>
            Desde clubes que recién comienzan hasta organizaciones profesionales. Sin costos ocultos.
          </p>

          {/* Toggle */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 16,
            background: '#F1F5F9', padding: '6px', borderRadius: 16,
          }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14, transition: 'all .2s',
                background: !annual ? '#fff' : 'transparent',
                color: !annual ? '#0F172A' : '#64748B',
                boxShadow: !annual ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14, transition: 'all .2s',
                background: annual ? '#fff' : 'transparent',
                color: annual ? '#0F172A' : '#64748B',
                boxShadow: annual ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Anual
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 800,
                color: '#059669', background: '#ECFDF5',
                padding: '2px 8px', borderRadius: 999,
              }}>
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24, alignItems: 'start',
        }}>
          {plans.map((plan) => {
            const price = plan.monthly === 0 ? 0 : annual ? (plan.annual / 12) : plan.monthly
            const totalLabel = plan.monthly === 0 ? 'Siempre gratis' : annual ? `$${plan.annual}/año` : ''

            return (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  background: '#fff',
                  border: plan.popular ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  borderRadius: 24,
                  padding: plan.popular ? '40px 32px 32px' : '32px',
                  transition: 'transform .3s, box-shadow .3s',
                  boxShadow: plan.popular
                    ? '0 25px 50px -12px rgba(37,99,235,0.15)'
                    : '0 4px 6px -1px rgba(0,0,0,0.05)',
                  transform: plan.popular ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (!plan.popular) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0,0,0,0.1)' }}}
                onMouseLeave={e => { if (!plan.popular) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)' }}}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: plan.gradient, color: '#fff',
                    padding: '6px 20px', borderRadius: 999,
                    fontSize: 12, fontWeight: 800, letterSpacing: '0.5px',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  }}>
                    ⭐ MÁS POPULAR
                  </div>
                )}

                {/* Plan header */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: plan.color,
                    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4,
                  }}>
                    {plan.tagline}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: '0 0 16px' }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '3rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                      ${price === 0 ? '0' : price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 15, color: '#94A3B8', fontWeight: 600 }}>/mes</span>
                  </div>
                  {totalLabel && (
                    <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginTop: 4 }}>
                      {totalLabel}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Link
                  to="/auth?mode=register"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 24px', borderRadius: 14, width: '100%',
                    background: plan.popular ? plan.gradient : '#F1F5F9',
                    color: plan.popular ? '#fff' : '#334155',
                    fontWeight: 700, fontSize: 15, textDecoration: 'none',
                    border: plan.popular ? 'none' : '1px solid #E2E8F0',
                    boxShadow: plan.popular ? '0 8px 20px rgba(37,99,235,0.25)' : 'none',
                    transition: 'all .2s', marginBottom: 28,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {plan.cta} <ArrowRight size={16} />
                </Link>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                      {f.included ? (
                        <Check size={16} color="#059669" strokeWidth={3} />
                      ) : (
                        <X size={16} color="#CBD5E1" strokeWidth={3} />
                      )}
                      <span style={{
                        color: f.included ? '#334155' : '#CBD5E1',
                        fontWeight: f.included ? 500 : 400,
                      }}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom note */}
        <div style={{ textAlign: 'center', marginTop: 48, color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>
          Todos los planes incluyen prueba gratuita de 7 días con acceso completo al Plan Pro · Sin tarjeta requerida
        </div>
      </div>
    </section>
  )
}
