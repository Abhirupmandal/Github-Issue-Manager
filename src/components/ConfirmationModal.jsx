import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Check } from 'lucide-react'

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 100, backdropFilter: 'blur(4px)',
            }}
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 420, zIndex: 101,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            {}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: confirmVariant === 'danger' ? '#f8516922' : '#3fb95022',
              border: `1px solid ${confirmVariant === 'danger' ? '#f8516944' : '#3fb95044'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <AlertTriangle size={22} color={confirmVariant === 'danger' ? '#f85149' : '#3fb950'} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                <X size={14} /> Cancel
              </button>
              <button
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
                disabled={loading}
                style={{ minWidth: 100 }}
              >
                {loading
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  : <><Check size={14} /> {confirmLabel}</>
                }
              </button>
            </div>

            {}
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
