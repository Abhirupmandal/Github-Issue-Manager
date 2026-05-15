import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, GitBranch, CircleDot, MessageSquare,
  Activity, Settings, User, ChevronRight, Zap, Bot,
  Database, LogOut, Bell, BookOpen, ArrowLeftRight,
  Star, Building2, Heart, Palette, Eye, Sparkles
} from 'lucide-react'
import axios from 'axios'
import { io } from 'socket.io-client'

import { API_BASE } from '../config'

const API = API_BASE

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Database, label: 'Repositories', path: '/repos' },
  { icon: CircleDot, label: 'Issues', path: '/issues' },
  { icon: GitBranch, label: 'PR Review', path: '/prs' },
  { icon: Building2, label: 'Org Health', path: '/org-health' },
  { icon: Bot, label: 'AI Agent', path: '/agent' },
  { icon: Activity, label: 'Activity Log', path: '/activity' },
]

const bottomItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: User, label: 'Profile', path: '/profile' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [user, setUser] = useState({
    name: localStorage.getItem('gh_username') || 'Guest',
    username: localStorage.getItem('gh_username') || 'guest',
    avatar: localStorage.getItem('gh_avatar') || '',
  })

  const [repoCount, setRepoCount] = useState(0)
  const [agentActive, setAgentActive] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('gh_token')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    axios.get(`${API}/auth/me`, { headers })
      .then(res => {
        const u = res.data
        setUser({
          name: u.name || u.username || 'User',
          username: u.username || 'user',
          avatar: u.avatar_url || '',
        })
      }).catch(() => {})

    axios.get(`${API}/api/repos`, { headers })
      .then(res => {
        if (Array.isArray(res.data)) setRepoCount(res.data.length)
      }).catch(() => {})

    axios.get(`${API}/api/settings`, { headers })
      .then(res => {
        setAgentActive(res.data.auto_mode || false)
      }).catch(() => {})

    
    const socket = io(API)
    socket.on('settings_updated', (data) => {
      setAgentActive(data.auto_mode)
    })

    return () => socket.disconnect()
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleLogout = () => {
    localStorage.removeItem('gh_token')
    localStorage.removeItem('gh_username')
    localStorage.removeItem('gh_avatar')
    navigate('/login')
  }

  const menuItems = [
    { section: 'main', items: [
      { icon: User, label: 'Profile', action: () => navigate('/profile') },
      { icon: Database, label: 'Repositories', action: () => navigate('/repos') },
      { icon: Star, label: 'Starred Repos', action: () => navigate('/repos') },
    ]},
    { section: 'settings', items: [
      { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
      { icon: Palette, label: 'Appearance', action: () => navigate('/settings') },
      { icon: Bot, label: 'AI Agent Config', action: () => navigate('/agent') },
    ]},
    { section: 'logout', items: [
      { icon: LogOut, label: 'Sign out', action: handleLogout, danger: true },
    ]},
  ]

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        width: 'var(--sidebar-width)',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {}
      <div style={{ padding: '20px 0 16px', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #1f6feb, #a371f7, #f78166)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(31, 111, 235, 0.4)',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
             <motion.div 
               animate={{ x: [-40, 40] }} 
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.3)', transform: 'skewX(-20deg)' }}
             />
             <Zap size={20} color="#fff" fill="#fff" />
          </motion.div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 4 }}>
              ISSUEAGENT <Sparkles size={12} className="text-blue-400" />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>AI-Powered Manager</div>
          </div>
        </div>

        <div style={{ 
          marginTop: 12, 
          background: 'var(--bg-tertiary)', 
          padding: '4px 0', 
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <motion.div
            animate={{ x: [0, -100 + '%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ display: 'flex', gap: 24, paddingRight: 24 }}
          >
            {[1, 2, 3].map(i => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Autonomous Management • Powered by Gemini 3.0 • Real-time GitHub Sync • Multi-repo Intelligence • 
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {}
      <div style={{ 
        margin: '12px 12px 4px', 
        padding: '8px 12px', 
        background: agentActive ? '#3fb95011' : '#e3b34111', 
        border: `1px solid ${agentActive ? '#3fb95033' : '#e3b34133'}`, 
        borderRadius: 8,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`status-dot ${agentActive ? 'online' : 'busy'}`} />
          <span style={{ fontSize: 12, color: agentActive ? '#3fb950' : '#e3b341', fontWeight: 500 }}>
            {agentActive ? 'AI Agent Active' : 'AI Agent Paused'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Monitoring {repoCount} {repoCount === 1 ? 'repository' : 'repositories'}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 4px' }}>
          Navigation
        </div>
        {navItems.map((item) => (
          <SidebarLink key={item.path} {...item} active={location.pathname === item.path} />
        ))}

        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 8px 4px' }}>
          Account
        </div>
        {bottomItems.map((item) => (
          <SidebarLink key={item.path} {...item} active={location.pathname === item.path} />
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid var(--border-color)', position: 'relative' }} ref={menuRef}>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
                overflow: 'hidden', zIndex: 100,
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6feb, #a371f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user.username}</div>
                </div>
                <ArrowLeftRight size={14} color="var(--text-muted)" />
              </div>

              {menuItems.map((section, si) => (SectionLayout(section, si, navigate, handleLogout, setMenuOpen, menuItems)))}
            </motion.div>
          )}
        </AnimatePresence>

        <div onClick={() => setMenuOpen(prev => !prev)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: menuOpen ? 'var(--bg-card)' : 'var(--bg-tertiary)', borderRadius: 10, border: `1px solid ${menuOpen ? 'var(--accent-blue)' : 'var(--border-color)'}`, cursor: 'pointer', transition: 'all 0.2s ease' }}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card)' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1f6feb, #a371f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.username}
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 500 }}>Free &amp; Open Source</div>
          </div>
          <LogOut size={14} color="var(--text-muted)" style={{ transform: menuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>
    </motion.aside>
  )
}

function SectionLayout(section, si, navigate, handleLogout, setMenuOpen, menuItems) {
  return (
    <div key={si} style={{ padding: '6px 8px', borderBottom: si < menuItems.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
      {section.items.map((item) => (
        <button key={item.label} onClick={() => { setMenuOpen(false); item.action(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: item.danger ? '#f85149' : 'var(--text-secondary)', fontSize: 13, fontWeight: 400, fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.12s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = item.danger ? '#f8514912' : 'var(--bg-tertiary)'; e.currentTarget.style.color = item.danger ? '#f85149' : 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.danger ? '#f85149' : 'var(--text-secondary)'; }}>
          <item.icon size={15} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function SidebarLink({ icon: Icon, label, path, active }) {
  return (
    <NavLink to={path} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ x: 2 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
          background: active ? 'linear-gradient(135deg, #1f6feb18, #a371f712)' : 'transparent',
          border: active ? '1px solid #1f6feb33' : '1px solid transparent',
          color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
          fontSize: 14, fontWeight: active ? 600 : 400,
          transition: 'all 0.15s ease',
        }}
      >
        <Icon size={16} />
        <span style={{ flex: 1 }}>{label}</span>
        {active && <ChevronRight size={14} />}
      </motion.div>
    </NavLink>
  )
}
