import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Command, Zap, Bot, Settings, User, Moon, Sun, Monitor, ArrowRight, Github, Activity, Database, CircleDot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const actions = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, category: 'Navigation', action: () => navigate('/dashboard') },
    { id: 'issues', label: 'View All Issues', icon: CircleDot, category: 'Navigation', action: () => navigate('/issues') },
    { id: 'repos', label: 'Manage Repositories', icon: Database, category: 'Navigation', action: () => navigate('/repos') },
    { id: 'profile', label: 'View Profile', icon: User, category: 'Navigation', action: () => navigate('/profile') },
    { id: 'activity', label: 'View Activity Log', icon: Activity, category: 'Navigation', action: () => navigate('/activity') },
    
    { id: 'theme-dark', label: 'Switch to Dark Theme', icon: Moon, category: 'Appearance', action: () => applyAppearance('theme', 'dark') },
    { id: 'theme-midnight', label: 'Switch to Midnight Theme', icon: Zap, category: 'Appearance', action: () => applyAppearance('theme', 'midnight') },
    { id: 'theme-light', label: 'Switch to Light Theme', icon: Sun, category: 'Appearance', action: () => applyAppearance('theme', 'light') },
    
    { id: 'ai-agent', label: 'Open AI Agent Chat', icon: Bot, category: 'AI Tools', action: () => navigate('/agent') },
    { id: 'ai-sync', label: 'Force Live Sync', icon: Zap, category: 'AI Tools', action: () => window.location.reload() },
  ]

  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(0)
    }
  }, [open])

  const applyAppearance = (key, val) => {
    localStorage.setItem(`app_${key}`, val)
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', val)
    }
    setOpen(false)
  }

  const handleSelect = (action) => {
    action.action()
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredActions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length)
    } else if (e.key === 'Enter') {
      if (filteredActions[selectedIndex]) {
        handleSelect(filteredActions[selectedIndex])
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              width: '100%',
              maxWidth: 600,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <Search size={20} color="var(--text-muted)" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>ESC</kbd>
              </div>
            </div>

            {}
            <div style={{ maxHeight: 400, overflowY: 'auto', padding: 8 }}>
              {filteredActions.length > 0 ? (
                <div>
                  {}
                  {Array.from(new Set(filteredActions.map(a => a.category))).map(cat => (
                    <div key={cat}>
                      <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</div>
                      {filteredActions.filter(a => a.category === cat).map((action, idx) => {
                        const globalIdx = filteredActions.indexOf(action)
                        const active = selectedIndex === globalIdx
                        return (
                          <div
                            key={action.id}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            onClick={() => handleSelect(action)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              background: active ? 'var(--bg-tertiary)' : 'transparent',
                              transition: 'all 0.1s ease'
                            }}
                          >
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: active ? 'var(--accent-blue)22' : 'var(--bg-card)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                              border: `1px solid ${active ? 'var(--accent-blue)44' : 'var(--border-color)'}`
                            }}>
                              <action.icon size={16} />
                            </div>
                            <span style={{ flex: 1, fontSize: 14, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? 500 : 400 }}>{action.label}</span>
                            {active && <ArrowRight size={14} color="var(--accent-blue)" />}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Bot size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No commands found for "{query}"</div>
                </div>
              )}
            </div>

            {}
            <div style={{ padding: '12px 20px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <kbd style={{ background: 'var(--bg-card)', padding: '2px 4px', borderRadius: 3, border: '1px solid var(--border-color)', marginRight: 4 }}>↑↓</kbd> to navigate
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <kbd style={{ background: 'var(--bg-card)', padding: '2px 4px', borderRadius: 3, border: '1px solid var(--border-color)', marginRight: 4 }}>ENTER</kbd> to select
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-blue)', fontSize: 11, fontWeight: 600 }}>
                <Zap size={10} /> Powered by IssueAgent AI
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function LayoutDashboard(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
