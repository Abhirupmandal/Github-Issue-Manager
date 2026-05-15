import { motion } from 'framer-motion'

export default function ToggleSwitch({ enabled, onChange, label, description, size = 'md' }) {
  const sizes = {
    sm: { track: { width: 36, height: 20 }, thumb: 16, padding: 2 },
    md: { track: { width: 44, height: 24 }, thumb: 20, padding: 2 },
    lg: { track: { width: 52, height: 28 }, thumb: 24, padding: 2 },
  }
  const s = sizes[size]

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      onClick={() => onChange(!enabled)}
    >
      {}
      <div
        style={{
          ...s.track,
          borderRadius: 999,
          background: enabled ? 'linear-gradient(135deg, #1f6feb, #388bfd)' : 'var(--bg-tertiary)',
          border: enabled ? 'none' : '1px solid var(--border-color)',
          position: 'relative', flexShrink: 0,
          transition: 'background 0.25s ease',
          boxShadow: enabled ? '0 2px 8px #1f6feb44' : 'none',
          cursor: 'pointer',
        }}
      >
        <motion.div
          animate={{ x: enabled ? s.track.width - s.thumb - s.padding * 2 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute',
            top: s.padding, left: s.padding,
            width: s.thumb, height: s.thumb,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {}
      {label && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
          {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>}
        </div>
      )}
    </div>
  )
}
