import React from 'react'
import { Users, CreditCard, Trophy, Zap, BarChart2, CalendarCheck } from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Gestión de Jugadores', desc: 'Fichas técnicas completas, historial médico, posiciones, documentación y seguimiento personalizado de cada atleta.', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: CreditCard, title: 'Tesorería Inteligente', desc: 'Control total de ingresos y egresos. Cuotas mensuales, matrículas, uniformes y auditoría completa.', color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: Trophy, title: 'Torneos y Competencias', desc: 'Organiza torneos con roster, gestiona pagos por jugador, gastos y calendario integrado.', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: Zap, title: 'Matchmaking Pro', desc: 'Conecta con otros clubes para organizar partidos amistosos. Disponible en todos los planes.', color: '#10B981', bg: '#ECFDF5' },
  { icon: BarChart2, title: 'Estadísticas y Reportes', desc: 'Dashboards claros con métricas financieras y deportivas. Exporta reportes en PDF.', color: '#EF4444', bg: '#FEF2F2' },
  { icon: CalendarCheck, title: 'Asistencia y Agenda', desc: 'Calendario interactivo, control de asistencia por equipo y notificaciones automáticas.', color: '#06B6D4', bg: '#ECFEFF' },
]

function FeatureCard({ icon: Icon, title, desc, color, bg }) {
  const [h, setH] = React.useState(false)
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 24, padding: 32,
        transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        transform: h ? 'translateY(-6px)' : 'none',
        boxShadow: h ? '0 20px 40px -15px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, transition: 'transform .3s', transform: h ? 'scale(1.1)' : 'scale(1)' }}>
        <Icon size={26} color={color} />
      </div>
      <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{title}</h3>
      <p style={{ color: '#64748B', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{desc}</p>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '120px 5%', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 999, background: '#EFF6FF', border: '1px solid #DBEAFE', fontSize: 13, color: '#2563EB', fontWeight: 700, marginBottom: 16 }}>
            Funcionalidades
          </div>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-1px', color: '#0F172A' }}>
            Todo lo que tu club necesita
          </h2>
          <p style={{ color: '#64748B', maxWidth: 600, margin: '0 auto', lineHeight: 1.7, fontSize: '1.1rem' }}>
            Diseñado para automatizar y escalar la gestión integral de clubes de voleibol.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 28 }}>
          {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </div>
    </section>
  )
}
