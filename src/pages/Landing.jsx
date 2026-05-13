import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LogIn, Trophy, Star, CheckCircle2, Shield, Smartphone, Globe } from 'lucide-react'
import FeaturesSection from '../components/Landing/FeaturesSection'
import PricingSection from '../components/Landing/PricingSection'
import FAQSection from '../components/Landing/FAQSection'

const STEPS = [
  { num: '01', title: 'Registra tu Club', desc: 'Crea tu cuenta gratuita y configura el perfil de tu club en minutos.' },
  { num: '02', title: 'Agrega tu Plantel', desc: 'Importa o añade tus jugadores con toda su información y documentación.' },
  { num: '03', title: 'Gestiona y Crece', desc: 'Organiza torneos, cobra mensualidades y conecta con otros clubes.' },
]

export default function Landing() {
  const heroRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const handler = (e) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`)
      el.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`)
    }
    el.addEventListener('mousemove', handler)
    return () => el.removeEventListener('mousemove', handler)
  }, [])

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const navBg = scrollY > 50

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F8FAFC', color: '#0F172A', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 5%', height: 80,
        background: navBg ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: navBg ? '1px solid rgba(226,232,240,0.8)' : '1px solid transparent',
        transition: 'all .3s',
      }}>
        <img src="/img/logo.png" alt="AppVoley" style={{ height: 64, objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['features', 'pricing', 'faq'].map(id => (
            <a key={id} href={`#${id}`} style={{
              padding: '8px 16px', borderRadius: 10, color: '#475569', fontWeight: 600,
              fontSize: 14, textDecoration: 'none', transition: 'all .2s',
            }}
              onMouseEnter={e => { e.target.style.color = '#0F172A'; e.target.style.background = '#F1F5F9' }}
              onMouseLeave={e => { e.target.style.color = '#475569'; e.target.style.background = 'transparent' }}
            >{id === 'features' ? 'Funciones' : id === 'pricing' ? 'Precios' : 'FAQ'}</a>
          ))}
          <Link to="/portal" style={{ padding: '8px 16px', borderRadius: 10, color: '#475569', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Soy Jugador</Link>
          <Link to="/auth" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 12,
            background: 'linear-gradient(135deg, #2563EB, #4F46E5)', color: '#fff', fontWeight: 700,
            fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            transition: 'transform .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          ><LogIn size={16} /> Ingresar</Link>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative',
        padding: '140px 5% 80px',
        background: `radial-gradient(circle at var(--mx,30%) var(--my,40%), rgba(219,234,254,0.6) 0%, transparent 60%),
                     radial-gradient(circle at 80% 20%, rgba(233,213,255,0.5) 0%, transparent 50%), #F8FAFC`,
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 60, alignItems: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ animation: 'slideUp .8s ease-out' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, background: '#EFF6FF', border: '1px solid #DBEAFE', fontSize: 13, color: '#2563EB', fontWeight: 700, marginBottom: 28, boxShadow: '0 2px 10px rgba(37,99,235,0.05)' }}>
              <Star size={14} fill="#2563EB" /> La plataforma #1 para clubes de voleibol
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-1.5px' }}>
              Gestiona tu club<br />
              <span style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                al siguiente nivel
              </span>
            </h1>

            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
              Jugadores, pagos, torneos, estadísticas y matchmaking — todo en una sola plataforma. Empieza gratis y escala cuando quieras.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link to="/auth?mode=register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 14,
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)', color: '#fff', fontWeight: 700, fontSize: 16,
                textDecoration: 'none', boxShadow: '0 10px 25px rgba(37,99,235,0.3)', transition: 'all .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(37,99,235,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(37,99,235,0.3)' }}
              >Empezar Gratis <ArrowRight size={18} /></Link>
              <a href="#pricing" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 14,
                background: '#fff', border: '1px solid #E2E8F0', color: '#334155', fontWeight: 600, fontSize: 16,
                textDecoration: 'none', transition: 'all .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >Ver Planes</a>
            </div>

            <div style={{ display: 'flex', gap: 24, color: '#64748B', fontSize: '0.95rem', fontWeight: 500, flexWrap: 'wrap' }}>
              {['Plan Gratis Disponible', 'Trial de 7 Días', 'Sin tarjeta requerida'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={18} color="#10B981" /> <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Card */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, background: 'linear-gradient(135deg, #DBEAFE, #F3E8FF)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', animation: 'float 5s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}>
                  <Trophy size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Club Voley Elite</div>
                  <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Temporada 2026</div>
                </div>
                <div style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 999, background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, border: '1px solid #A7F3D0' }}>PRO</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[['32', 'Jugadores', '#3B82F6', '#EFF6FF'], ['4', 'Equipos', '#F59E0B', '#FFFBEB'], ['$2,450', 'Balance', '#10B981', '#ECFDF5'], ['3', 'Torneos', '#8B5CF6', '#F5F3FF']].map(([v, l, c, bg]) => (
                  <div key={l} style={{ background: bg, border: `1px solid ${c}33`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Próximo Evento</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏐</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Torneo Nacional Sub-18</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>15 Mayo · Guayaquil</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: -10, right: -30, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '12px 20px', fontSize: 14, fontWeight: 700, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', animation: 'float 4s ease-in-out infinite .5s', display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
              <span style={{ fontSize: 18 }}>🏐</span> Matchmaking activo
            </div>
            <div style={{ position: 'absolute', bottom: 30, left: -40, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '12px 20px', fontSize: 14, fontWeight: 700, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', animation: 'float 4s ease-in-out infinite 1s', display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} color="#fff" />
              </div>
              <span>Pago $350 ✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section style={{ background: '#0F172A', padding: '80px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, textAlign: 'center' }}>
          {[
            { icon: <Globe size={24} />, value: '🇪🇨', label: 'Hecho en Ecuador' },
            { icon: <Shield size={24} />, value: '100%', label: 'Datos Seguros' },
            { icon: <Smartphone size={24} />, value: '24/7', label: 'Acceso Móvil' },
            { icon: <Trophy size={24} />, value: '∞', label: 'Torneos sin límite' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <FeaturesSection />

      {/* DASHBOARD PREVIEW */}
      <section style={{ padding: '100px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 999, background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 13, color: '#059669', fontWeight: 700, marginBottom: 20 }}>
            Vista Previa
          </div>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-1px' }}>
            Tu club, bajo control total
          </h2>
          <p style={{ color: '#64748B', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7, fontSize: '1.1rem' }}>
            Dashboard intuitivo con toda la información de tu club en un solo lugar.
          </p>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid #E2E8F0' }}>
            <img src="/img/dashboard_preview.png" alt="Dashboard AppVoley" style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.1), transparent 30%)' }} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '120px 5%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 999, background: '#F5F3FF', border: '1px solid #EDE9FE', fontSize: 13, color: '#8B5CF6', fontWeight: 700, marginBottom: 16 }}>
              Cómo funciona
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
              Empieza en 3 simples pasos
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 40, position: 'relative' }}>
            {STEPS.map(step => (
              <div key={step.num} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#2563EB,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: 24, boxShadow: '0 10px 25px rgba(37,99,235,0.3)', border: '4px solid #fff' }}>
                  {step.num}
                </div>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', fontWeight: 800 }}>{step.title}</h3>
                <p style={{ color: '#64748B', lineHeight: 1.6, margin: 0, fontSize: '1.05rem', maxWidth: 280 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <PricingSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <section style={{ padding: '100px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', background: '#0F172A', borderRadius: 32, padding: '80px 48px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: 24 }}>🚀</div>
              <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-1px', color: '#fff' }}>
                ¿Listo para transformar tu club?
              </h2>
              <p style={{ color: '#94A3B8', lineHeight: 1.7, marginBottom: 40, fontSize: '1.15rem', maxWidth: 600, margin: '0 auto 40px' }}>
                Únete a la nueva generación de clubes deportivos. Empieza gratis hoy.
              </p>
              <Link to="/auth?mode=register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, padding: '18px 48px', borderRadius: 16,
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)', color: '#fff', fontWeight: 800,
                fontSize: '1.1rem', textDecoration: 'none', boxShadow: '0 15px 30px rgba(37,99,235,0.4)',
                transition: 'all .3s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >Comenzar Gratis <ArrowRight size={20} /></Link>
              <p style={{ color: '#64748B', fontSize: 13, marginTop: 24, fontWeight: 500 }}>7 días gratis con acceso completo · Sin tarjeta de crédito</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0F172A', padding: '60px 5% 40px', color: '#94A3B8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <img src="/img/logo.png" alt="AppVoley" style={{ height: 60, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.8 }} />
            <div style={{ display: 'flex', gap: 32 }}>
              {[['Ingresar', '/auth'], ['Registro', '/auth?mode=register'], ['Portal', '/portal']].map(([t, to]) => (
                <Link key={t} to={to} style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#94A3B8'}
                >{t}</Link>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>© 2026 AppVoley. Todos los derechos reservados.</p>
            <p style={{ fontSize: 13, margin: 0 }}>Hecho con ❤️ en Ecuador 🇪🇨</p>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        html { scroll-behavior: smooth; }
        @media (max-width: 768px) {
          nav > div:first-of-type + div > a:not(:last-child):not(:nth-last-child(2)) { display: none !important; }
        }
      `}</style>
    </div>
  )
}
