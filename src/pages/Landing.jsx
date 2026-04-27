import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, LogIn, Users, Trophy, CreditCard, Zap,
  BarChart2, MessageCircle, ChevronRight, Star, CheckCircle2
} from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Gestión de Jugadores', desc: 'Administra plantillas, fichas técnicas, posiciones y estadísticas de cada jugador de tu club.', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: CreditCard, title: 'Control de Pagos', desc: 'Registra y hace seguimiento de pagos de mensualidades con alertas automáticas.', color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: Trophy, title: 'Torneos y Convocatorias', desc: 'Crea torneos, arma equipos y notifica a los jugadores via WhatsApp con un clic.', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: Zap, title: 'Matchmaking Pro', desc: 'Conecta con otros clubes para organizar partidos amistosos y competencias.', color: '#10B981', bg: '#ECFDF5' },
  { icon: BarChart2, title: 'Reportes y Estadísticas', desc: 'Visualiza el desempeño financiero y deportivo de tu club con dashboards claros.', color: '#EF4444', bg: '#FEF2F2' },
  { icon: MessageCircle, title: 'VoleyFeed Social', desc: 'Comparte logros, fotos y novedades de tu club con toda la comunidad voleybolística.', color: '#06B6D4', bg: '#ECFEFF' },
]

const STEPS = [
  { num: '01', title: 'Registra tu Club', desc: 'Crea tu cuenta gratuita y configura el perfil de tu club en minutos.' },
  { num: '02', title: 'Agrega tu Plantel', desc: 'Importa o añade tus jugadores con toda su información y documentación.' },
  { num: '03', title: 'Gestiona y Crece', desc: 'Organiza torneos, cobra mensualidades y conecta con otros clubes.' },
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
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F8FAFC', color: '#0F172A', overflowX: 'hidden' }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 5%', height: '88px',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226,232,240,0.8)',
      }}>
        <img src="/img/logo.png" alt="AppVoley" style={{ height: '72px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/portal" style={{
            padding: '10px 20px', borderRadius: '12px', color: '#475569',
            fontWeight: 600, fontSize: '14px', textDecoration: 'none',
            transition: 'all .2s',
          }}
            onMouseEnter={e => { e.target.style.color = '#0F172A'; e.target.style.background = 'rgba(241,245,249,0.8)' }}
            onMouseLeave={e => { e.target.style.color = '#475569'; e.target.style.background = 'transparent' }}
          >Soy Jugador</Link>
          <Link to="/auth" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
            color: '#fff', fontWeight: 700, fontSize: '14px',
            textDecoration: 'none', boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            transition: 'transform .2s, box-shadow .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)' }}
          >
            <LogIn size={16} /> Ingresar
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', padding: '140px 5% 80px',
        background: `radial-gradient(circle at var(--mx,30%) var(--my,40%), rgba(219,234,254,0.6) 0%, transparent 60%),
                     radial-gradient(circle at 80% 20%, rgba(233,213,255,0.5) 0%, transparent 50%),
                     #F8FAFC`,
      }}>
        {/* Decorative Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 60, alignItems: 'center', position: 'relative', zIndex: 10 }}>
          {/* Left Content */}
          <div style={{ animation: 'slideUp .8s ease-out' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 999,
              background: '#EFF6FF', border: '1px solid #DBEAFE',
              fontSize: 13, color: '#2563EB', fontWeight: 700, marginBottom: 28,
              boxShadow: '0 2px 10px rgba(37,99,235,0.05)'
            }}>
              <Star size={14} fill="#2563EB" /> La plataforma #1 para clubes de voleibol
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-1.5px', color: '#0F172A' }}>
              Gestiona tu club<br />
              <span style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                al siguiente nivel
              </span>
            </h1>

            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
              La solución todo-en-uno definitiva. Optimiza pagos, organiza torneos, administra planteles y conecta con otros clubes del país.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link to="/auth?mode=register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 36px', borderRadius: 14,
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 10px 25px rgba(37,99,235,0.3)',
                transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(37,99,235,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(37,99,235,0.3)' }}
              >
                Registrar Club <ArrowRight size={18} />
              </Link>
              <Link to="/portal" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '16px 32px', borderRadius: 14,
                background: '#fff', border: '1px solid #E2E8F0',
                color: '#334155', fontWeight: 600, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0' }}
              >
                Portal Jugadores
              </Link>
            </div>

            {/* Feature Checklist */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', color: '#64748B', fontSize: '0.95rem', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={18} color="#10B981" /> <span>Registro Gratis</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={18} color="#10B981" /> <span>Soporte 24/7</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={18} color="#10B981" /> <span>Sin tarjeta requerida</span></div>
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 500, height: 500, background: 'linear-gradient(135deg, #DBEAFE, #F3E8FF)',
              borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
            }} />
            
            {/* Main card */}
            <div style={{
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,1)', borderRadius: 24,
              padding: 28, width: '100%', maxWidth: 420,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(226,232,240,0.5)',
              animation: 'float 5s ease-in-out infinite',
              position: 'relative', zIndex: 1
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}>
                  <Trophy size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>Club Voley Lima</div>
                  <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Temporada 2026</div>
                </div>
                <div style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 999, background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, border: '1px solid #A7F3D0' }}>ACTIVO</div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[['24', 'Jugadores', '#3B82F6', '#EFF6FF'], ['3', 'Torneos', '#F59E0B', '#FFFBEB'], ['S/.4,200', 'Ingresos', '#10B981', '#ECFDF5'], ['2', 'Partidos', '#8B5CF6', '#F5F3FF']].map(([v, l, c, bg]) => (
                  <div key={l} style={{ background: bg, border: `1px solid ${c}33`, borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Player list */}
              <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Jugadores</div>
                {[['María R.', 'Armadora', '#F59E0B'], ['Carlos V.', 'Central', '#3B82F6']].map(([n, p, c], idx) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: idx === 0 ? '1px solid #E2E8F0' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: c }}>
                      {n[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{n}</div>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{p}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px #ECFDF5' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div style={{
              position: 'absolute', top: -10, right: -30,
              background: '#fff',
              border: '1px solid #E2E8F0', borderRadius: 16,
              padding: '12px 20px', fontSize: 14, fontWeight: 700, color: '#0F172A',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              animation: 'float 4s ease-in-out infinite .5s',
              display: 'flex', alignItems: 'center', gap: 8, zIndex: 2
            }}>
              <span style={{ fontSize: 18 }}>🏐</span> Matchmaking activo
            </div>
            <div style={{
              position: 'absolute', bottom: 30, left: -40,
              background: '#fff',
              border: '1px solid #E2E8F0', borderRadius: 16,
              padding: '12px 20px', fontSize: 14, fontWeight: 700, color: '#0F172A',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              animation: 'float 4s ease-in-out infinite 1s',
              display: 'flex', alignItems: 'center', gap: 8, zIndex: 2
            }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <CheckCircle2 size={14} color="#fff"/>
              </div>
              <span>Pago S/.350</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAND ─── */}
      <section style={{ background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '60px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ animation: 'slideUp 1s ease-out' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ color: '#64748B', fontSize: '0.95rem', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ padding: '120px 5%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 999, background: '#EFF6FF', border: '1px solid #DBEAFE', fontSize: 13, color: '#2563EB', fontWeight: 700, marginBottom: 16 }}>
              Funcionalidades
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-1px', color: '#0F172A' }}>
              Todo lo que tu club necesita
            </h2>
            <p style={{ color: '#64748B', maxWidth: 600, margin: '0 auto', lineHeight: 1.7, fontSize: '1.1rem' }}>
              Diseñado específicamente para automatizar y escalar la gestión integral de clubes de voleibol en todo el país.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 28 }}>
            {FEATURES.map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '120px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 999, background: '#F5F3FF', border: '1px solid #EDE9FE', fontSize: 13, color: '#8B5CF6', fontWeight: 700, marginBottom: 16 }}>
              Cómo funciona
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, margin: 0, letterSpacing: '-1px', color: '#0F172A' }}>
              Empieza en 3 simples pasos
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 40, position: 'relative' }}>
            {/* Connecting line for desktop */}
            <div className="hidden md:block" style={{ position: 'absolute', top: 40, left: '15%', right: '15%', height: 2, background: 'linear-gradient(90deg, transparent, #E2E8F0, transparent)', zIndex: 0 }} />
            
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#2563EB,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: 24, boxShadow: '0 10px 25px rgba(37,99,235,0.3)', border: '4px solid #fff' }}>
                  {step.num}
                </div>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{step.title}</h3>
                <p style={{ color: '#64748B', lineHeight: 1.6, margin: 0, fontSize: '1.05rem', maxWidth: 280 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '100px 5%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 32, padding: '80px 48px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}/>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}/>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: 24 }}>🚀</div>
              <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-1px', color: '#0F172A' }}>
                ¿Listo para transformar tu club?
              </h2>
              <p style={{ color: '#64748B', lineHeight: 1.7, marginBottom: 40, fontSize: '1.15rem', maxWidth: 600, margin: '0 auto 40px' }}>
                Únete a la nueva generación de clubes deportivos. Crea tu cuenta ahora y disfruta de la mejor experiencia de gestión.
              </p>
              <Link to="/auth?mode=register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '18px 48px', borderRadius: 16,
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                color: '#fff', fontWeight: 800, fontSize: '1.1rem', textDecoration: 'none',
                boxShadow: '0 15px 30px rgba(37,99,235,0.3)',
                transition: 'all .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(37,99,235,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(37,99,235,0.3)' }}
              >
                Comenzar Gratis <ArrowRight size={20} />
              </Link>
              <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 24, fontWeight: 500 }}>Sin tarjeta de crédito · Configuración en 2 minutos</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #E2E8F0', padding: '60px 5% 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <img src="/img/logo.png" alt="AppVoley" style={{ height: 60, objectFit: 'contain' }} />
            <div style={{ display: 'flex', gap: 32 }}>
              <Link to="/auth" style={{ color: '#64748B', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => e.target.style.color='#0F172A'} onMouseLeave={e => e.target.style.color='#64748B'}>Ingresar</Link>
              <Link to="/auth?mode=register" style={{ color: '#64748B', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => e.target.style.color='#0F172A'} onMouseLeave={e => e.target.style.color='#64748B'}>Registro</Link>
              <Link to="/portal" style={{ color: '#64748B', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => e.target.style.color='#0F172A'} onMouseLeave={e => e.target.style.color='#64748B'}>Portal Jugadores</Link>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <p style={{ color: '#94A3B8', fontSize: 14, margin: 0, fontWeight: 500 }}>
              © 2026 AppVoley. Todos los derechos reservados.
            </p>
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
          50%      { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color, bg }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 24, padding: '32px',
        transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        boxShadow: hovered ? '0 20px 40px -15px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
        cursor: 'default',
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, transition: 'transform .3s', transform: hovered ? 'scale(1.1)' : 'scale(1)' }}>
        <Icon size={26} color={color} />
      </div>
      <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{title}</h3>
      <p style={{ color: '#64748B', lineHeight: 1.6, margin: 0, fontSize: '1rem' }}>{desc}</p>
    </div>
  )
}
