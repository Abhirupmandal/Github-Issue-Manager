import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, RefreshCw, Plus, ChevronDown, User, Settings, LogOut, Github } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { API_BASE as API } from '../config'

export default function Header({ title, subtitle, actions }) {
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [searchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  
  const dropdownRef = useRef(null)
  const notifyRef = useRef(null)
  const navigate = useNavigate()

  const [user, setUser] = useState({
    name: localStorage.getItem('gh_username') || 'Guest',
    username: localStorage.getItem('gh_username') || 'guest',
    avatar: localStorage.getItem('gh_avatar') || '',
  })

  useEffect(() => {
    const token = localStorage.getItem('gh_token')
    if (!token) return
    
    
    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const u = res.data
        setUser({
          name: u.name || u.username || 'User',
          username: u.username || 'user',
          avatar: u.avatar_url || '',
        })
      }).catch(() => {})

    
    axios.get(`${API}/api/activity`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setNotifications(res.data.slice(0, 5)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/issues?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('gh_token')
    localStorage.removeItem('gh_username')
    localStorage.removeItem('gh_avatar')
    navigate('/login')
  }

  return (
    <motion.header
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass"
      style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: 16,
        position: 'sticky', top: 0, zIndex: 40,
        flexShrink: 0,
      }}
    >
      {}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>}
      </div>

      {}
      <form onSubmit={handleSearch} style={{
        position: 'relative',
        transition: 'all 0.3s ease',
        width: searching ? 280 : 200,
      }}>
        <Search size={14} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          className="input"
          placeholder="Search issues..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onFocus={() => setSearching(true)}
          onBlur={() => setSearching(false)}
          style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
        />
      </form>

      {}
      {actions}

      {}
      <motion.button
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
        className="btn btn-secondary"
        style={{ padding: '7px 10px', fontSize: 13 }}
        title="Refresh"
        onClick={() => window.location.reload()}
      >
        <RefreshCw size={14} />
      </motion.button>

      {}
      <div style={{ position: 'relative' }} ref={notifyRef}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-secondary"
          onClick={() => setShowNotifications(!showNotifications)}
          style={{ padding: '7px 10px', borderColor: showNotifications ? 'var(--accent-blue)' : 'var(--border-color)' }}
        >
          <Bell size={14} />
        </motion.button>
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent-orange)',
            border: '2px solid var(--bg-secondary)',
          }} />
        )}

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 300, background: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: 12,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                padding: '8px 0', zIndex: 50,
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
                <span style={{ fontSize: 11, color: 'var(--accent-blue)', cursor: 'pointer' }}>Mark all read</span>
              </div>
              
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--bg-tertiary)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{n.action_type === 'label' ? 'Label Applied' : n.action_type === 'close' ? 'Issue Closed' : 'Agent Action'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.details}</div>
                    <div style={{ fontSize: 10, color: 'var(--accent-blue)', marginTop: 4 }}>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                )) : (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No new notifications</div>
                )}
              </div>
              
              <div style={{ padding: '8px 16px', textAlign: 'center', borderTop: '1px solid var(--border-color)', marginTop: 4 }}>
                <span onClick={() => navigate('/activity')} style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer' }}>View all activity</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '4px 8px 4px 4px', borderRadius: 8,
            border: `1px solid ${showDropdown ? 'var(--accent-blue)' : 'var(--border-color)'}`,
            background: 'var(--bg-tertiary)',
            transition: 'border-color 0.2s ease',
          }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card)' }}
            />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</span>
          <ChevronDown size={12} color="var(--text-muted)" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </motion.div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 220, background: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: 12,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                padding: '8px 0', zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Signed in as</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{user.username}</div>
              </div>

              <DropdownItem icon={User} label="Your profile" onClick={() => navigate('/profile')} />
              <DropdownItem icon={Settings} label="Settings" onClick={() => navigate('/settings')} />
              
              <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
              
              {!localStorage.getItem('gh_token')?.startsWith('local_') ? (
                 <DropdownItem icon={Github} label="GitHub Profile" onClick={() => window.open(`https://github.com/${user.username}`, '_blank')} />
              ) : (
                 <DropdownItem icon={Github} label="Connect GitHub" color="var(--accent-blue)" onClick={() => window.location.href = `${API}/auth/github`} />
              )}
              
              <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
              
              <DropdownItem 
                icon={LogOut} 
                label="Sign out" 
                onClick={handleLogout}
                color="var(--accent-pink)"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

function DropdownItem({ icon: Icon, label, onClick, color = 'var(--text-secondary)' }) {
  return (
    <motion.div
      whileHover={{ background: 'var(--bg-tertiary)' }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', cursor: 'pointer',
        fontSize: 13, color: color,
        transition: 'all 0.1s ease',
      }}
    >
      <Icon size={14} />
      <span>{label}</span>
    </motion.div>
  )
}
