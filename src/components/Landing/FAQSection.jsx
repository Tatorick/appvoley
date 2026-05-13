import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: '¿Cómo funciona la prueba gratuita de 7 días?',
    a: 'Al registrarte, obtienes acceso completo al Plan Pro durante 7 días sin necesidad de tarjeta de crédito. Explora todas las funciones y decide qué plan se adapta mejor a tu club. Si no eliges un plan, tu cuenta pasará al plan Starter gratuito automáticamente.',
  },
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí, puedes subir o bajar de plan cuando quieras. Si subes de plan, el cambio es inmediato. Si bajas, se aplicará al final de tu período de facturación actual. Nunca perderás tus datos.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos tarjeta de crédito, PayPal y transferencia bancaria. Los pagos se procesan en dólares americanos (USD). Para transferencias bancarias, el proceso de verificación puede tomar hasta 24 horas.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Absolutamente. Usamos Supabase con cifrado de nivel bancario (AES-256), Row Level Security para aislar los datos de cada club, y backups automáticos diarios. Ningún club puede ver los datos de otro.',
  },
  {
    q: '¿Qué pasa si cancelo mi suscripción?',
    a: 'Tu cuenta pasará al plan Starter gratuito. Podrás seguir viendo tus datos pero con las limitaciones del plan gratuito (15 jugadores, 2 equipos). Nunca eliminamos tus datos — siempre puedes reactivar tu suscripción.',
  },
  {
    q: '¿Puedo usar AppVoley en mi celular?',
    a: 'Sí, AppVoley está optimizado para funcionar perfectamente en cualquier dispositivo: celular, tablet o computadora. También estamos desarrollando la app nativa para iOS y Android.',
  },
  {
    q: '¿El plan Starter gratuito tiene límite de tiempo?',
    a: 'No, el plan Starter es gratuito para siempre. Puedes gestionar hasta 15 jugadores y 2 equipos sin costo alguno. Es ideal para clubes que recién comienzan.',
  },
  {
    q: '¿Cómo funciona el Matchmaking?',
    a: 'El Matchmaking te permite publicar solicitudes de partidos amistosos y conectar con otros clubes registrados. Esta función está disponible en todos los planes, incluyendo el gratuito, para fortalecer la comunidad de voleibol.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section id="faq" style={{ padding: '120px 5%', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block', padding: '8px 20px', borderRadius: 999,
            background: '#FEF3C7', border: '1px solid #FDE68A',
            fontSize: 13, color: '#D97706', fontWeight: 700, marginBottom: 20,
          }}>
            Preguntas Frecuentes
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900,
            margin: 0, letterSpacing: '-1px', color: '#0F172A',
          }}>
            ¿Tienes dudas?
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: isOpen ? '1px solid #DBEAFE' : '1px solid #E2E8F0',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all .2s',
                  boxShadow: isOpen ? '0 4px 12px rgba(37,99,235,0.06)' : 'none',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 16,
                    padding: '20px 24px', border: 'none', cursor: 'pointer',
                    background: 'transparent', textAlign: 'left',
                    fontSize: 15, fontWeight: 700, color: '#0F172A',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {faq.q}
                  <ChevronDown
                    size={20}
                    style={{
                      flexShrink: 0, color: '#94A3B8',
                      transition: 'transform .2s',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 300 : 0,
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height .3s ease, opacity .2s ease',
                    padding: isOpen ? '0 24px 20px' : '0 24px',
                  }}
                >
                  <p style={{ margin: 0, color: '#64748B', lineHeight: 1.7, fontSize: 14 }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
