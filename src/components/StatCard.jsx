import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = '#58a6ff', delay = 0, loading = false }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div className="skeleton" style={{ width: 100, height: 14 }} />
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
        </div>
        <div className="skeleton" style={{ width: 70, height: 32, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: 140, height: 12 }} />
      </div>
    )
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'var(--accent-green)' : trend === 'down' ? 'var(--accent-pink)' : 'var(--text-muted)'

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: `0 8px 30px ${color}18` }}
      style={{ padding: 20, cursor: 'default', position: 'relative', overflow: 'hidden' }}
    >
      {}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 120, height: 120,
        background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${color}18`,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>

      {}
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trendValue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <TrendIcon size={12} color={trendColor} />
            <span style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>{trendValue}</span>
          </div>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</span>
      </div>
    </motion.div>
  )
}
