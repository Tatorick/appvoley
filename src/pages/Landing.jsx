import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, LogIn, Users, Trophy, CreditCard, Zap,
  Shield, BarChart2, MessageCircle, ChevronRight, Star
} from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Gestión de Jugadores', desc: 'Administra plantillas, fichas técnicas, posiciones y estadísticas de cada jugador de tu club.', color: '#3B82F6' },
  { icon: CreditCard, title: 'Control de Pagos', desc: 'Registra y hace seguimiento de pagos de mensualidades con alertas automáticas.', color: '#8B5CF6' },
  { icon: Trophy, title: 'Torneos y Convocatorias', desc: 'Crea torneos, arma equipos y notifica a los jugadores via WhatsApp con un clic.', color: '#F59E0B' },
  { icon: Zap, title: 'Matchmaking Pro', desc: 'Conecta con otros clubes para organizar partidos amistosos y competencias.', color: '#10B981' },
  { icon: BarChart2, title: 'Reportes y Estadísticas', desc: 'Visualiza el desempeño financiero y deportivo de tu club con dashboards claros.', color: '#EF4444' },
  { icon: MessageCircle, title: 'VoleyFeed Social', desc: 'Comparte logros, fotos y novedades de tu club con toda la comunidad voleybolística.', color: '#06B6D4' },
]

const STEPS = [
  { num: '01', title: 'Registra tu Club', desc: 'Crea tu cuenta gratuita y configura el perfil de tu club en minutos.' },
  { num: '02', title: 'Agrega tu Plantel', desc: 'Importa o añade tus jugadores con toda su información y documentación.' },
  { num: '03', title: 'Gestiona y Crece', desc: 'Organiza torneos, cobra mensualidades y conecta con otros clubes del país.' },
]

const STATS = [
  { value: '50+', label: 'Clubes Activos' },
  { value: '1,000+', label: 'Jugadores Registrados' },
  { value: '200+', label: 'Torneos Organizados' },
  { value: '98%', label: 'Satisfacción' },
]

export default function Landing() {
  const heroRef = useRef(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const handler = (e) => {
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--mx', `${x}%`)
      el.style.setProperty('--my', `${y}%`)
    }
    el.addEventListener('mousemove', handler)
    return () => el.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#060B18', color: '#fff', overflowX: 'hidden' }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 5%', height: '88px',
        background: 'rgba(6,11,24,0.7)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <img src="/img/logo.png" alt="AppVoley" style={{ height: '72px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/portal" style={{
            padding: '10px 20px', borderRadius: '10px', color: '#94A3B8',
            fontWeight: 600, fontSize: '14px', textDecoration: 'none',
            transition: 'color .2s',
          }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#94A3B8'}
          >Soy Jugador</Link>
          <Link to="/auth" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 22px', borderRadius: '10px',
            background: 'linear-gradient(135deg,#2563EB,#7C3AED)',
            color: '#fff', fontWeight: 700, fontSize: '14px',
            textDecoration: 'none', boxShadow: '0 0 20px rgba(37,99,235,.4)',
            transition: 'transform .2s, box-shadow .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 30px rgba(37,99,235,.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(37,99,235,.4)' }}
          >
            <LogIn size={16} /> Ingresar
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', padding: '120px 5% 80px',
        background: `radial-gradient(circle at var(--mx,30%) var(--my,40%), rgba(37,99,235,.18) 0%, transparent 60%),
                     radial-gradient(circle at 80% 20%, rgba(124,58,237,.15) 0%, transparent 50%),
                     #060B18`,
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(37,99,235,.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '0%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        {/* Grid lines decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Left */}
          <div style={{ animation: 'slideUp .8s ease-out' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999,
              background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.4)',
              fontSize: 13, color: '#93C5FD', fontWeight: 600, marginBottom: 28,
            }}>
              <Star size={12} fill="#93C5FD" /> La plataforma #1 para clubes de voleibol
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-1px' }}>
              Gestiona tu club<br />
              <span style={{ background: 'linear-gradient(90deg,#3B82F6,#8B5CF6,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                al siguiente nivel
              </span>
            </h1>

            <p style={{ fontSize: '1.15rem', color: '#94A3B8', lineHeight: 1.7, maxWidth: 480, marginBottom: 40 }}>
              La plataforma integral para clubes de voleibol. Jugadores, pagos, torneos y matchmaking profesional — todo en un solo lugar.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link to="/auth?mode=register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', borderRadius: 14,
                background: 'linear-gradient(135deg,#2563EB,#7C3AED)',
                color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(37,99,235,.45)',
                transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,.6)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,.45)' }}
              >
                Registrar Club <ArrowRight size={18} />
              </Link>
              <Link to="/portal" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 14,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
                color: '#E2E8F0', fontWeight: 600, fontSize: 16, textDecoration: 'none',
                transition: 'background .2s, border-color .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)' }}
              >
                Portal Jugadores
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,.08)' }}>
              {STATS.slice(0, 2).map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Main card */}
            <div style={{
              background: 'rgba(15,23,42,.8)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,.1)', borderRadius: 20,
              padding: 24, width: '100%', maxWidth: 380,
              boxShadow: '0 30px 80px rgba(0,0,0,.5)',
              animation: 'float 4s ease-in-out infinite',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Club Voley Lima</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Temporada 2026</div>
                </div>
                <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,.15)', color: '#34D399', fontSize: 11, fontWeight: 700 }}>ACTIVO</div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[['24', 'Jugadores', '#3B82F6'], ['3', 'Torneos', '#F59E0B'], ['S/.4,200', 'Ingresos', '#10B981'], ['2', 'Partidos', '#8B5CF6']].map(([v, l, c]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Player list */}
              {[['María R.', 'Armadora', '#F59E0B'], ['Carlos V.', 'Central', '#3B82F6']].map(([n, p, c]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${c}22`, border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c }}>
                    {n[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{p}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                </div>
              ))}
            </div>

            {/* Floating badges */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              background: 'rgba(15,23,42,.9)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(245,158,11,.3)', borderRadius: 14,
              padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#FCD34D',
              boxShadow: '0 8px 24px rgba(0,0,0,.4)',
              animation: 'float 4s ease-in-out infinite .5s',
            }}>
              🏐 Matchmaking activo
            </div>
            <div style={{
              position: 'absolute', bottom: 20, left: -30,
              background: 'rgba(15,23,42,.9)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16,185,129,.3)', borderRadius: 14,
              padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#34D399',
              boxShadow: '0 8px 24px rgba(0,0,0,.4)',
              animation: 'float 4s ease-in-out infinite 1s',
            }}>
              💳 Pago recibido +S/.350
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAND ─── */}
      <section style={{ background: 'rgba(255,255,255,.03)', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '48px 5%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ color: '#64748B', fontSize: '0.9rem', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ padding: '100px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 999, background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.3)', fontSize: 13, color: '#60A5FA', fontWeight: 600, marginBottom: 16 }}>
              Funcionalidades
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              Todo lo que tu club necesita
            </h2>
            <p style={{ color: '#64748B', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              Diseñado específicamente para la gestión integral de clubes de voleibol peruanos.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
            {FEATURES.map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 999, background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.3)', fontSize: 13, color: '#A78BFA', fontWeight: 600, marginBottom: 16 }}>
              Cómo funciona
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              Empieza en 3 simples pasos
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 32 }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ position: 'relative', display: 'flex', gap: 20 }}>
                <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 900 }}>
                  {step.num}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>{step.title}</h3>
                  <p style={{ color: '#64748B', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight style={{ position: 'absolute', right: -20, top: 16, color: 'rgba(255,255,255,.1)' }} size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '100px 5%' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '-60px', borderRadius: 40, background: 'radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 28, padding: '64px 48px', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🏐</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              ¿Listo para transformar tu club?
            </h2>
            <p style={{ color: '#94A3B8', lineHeight: 1.7, marginBottom: 40, fontSize: '1.05rem' }}>
              Únete a más de 50 clubes que ya gestionan sus equipos con AppVoley. Registro gratuito.
            </p>
            <Link to="/auth?mode=register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '16px 40px', borderRadius: 16,
              background: 'linear-gradient(135deg,#2563EB,#7C3AED)',
              color: '#fff', fontWeight: 800, fontSize: '1.1rem', textDecoration: 'none',
              boxShadow: '0 12px 40px rgba(37,99,235,.5)',
              transition: 'transform .2s, box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(37,99,235,.7)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,.5)' }}
            >
              Crear cuenta gratis <ArrowRight size={20} />
            </Link>
            <p style={{ color: '#475569', fontSize: 13, marginTop: 20 }}>Sin tarjeta de crédito · Configuración en 5 minutos</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '40px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <img src="/img/logo.png" alt="AppVoley" style={{ height: 60, objectFit: 'contain' }} />
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
            © 2026 AppVoley. Todos los derechos reservados.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/auth" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Ingresar</Link>
            <Link to="/auth?mode=register" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Registro</Link>
            <Link to="/portal" style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}>Portal Jugadores</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(${hexToRgb(color)},.08)` : 'rgba(255,255,255,.03)',
        border: `1px solid ${hovered ? `rgba(${hexToRgb(color)},.4)` : 'rgba(255,255,255,.07)'}`,
        borderRadius: 20, padding: '28px 28px 32px',
        transition: 'all .3s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `rgba(${hexToRgb(color)},.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon size={24} color={color} />
      </div>
      <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 800 }}>{title}</h3>
      <p style={{ color: '#64748B', lineHeight: 1.65, margin: 0, fontSize: '0.9rem' }}>{desc}</p>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
