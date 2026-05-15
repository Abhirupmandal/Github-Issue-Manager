import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import { motion } from 'framer-motion'
import { RefreshCw, Loader2, CircleDot, CheckCircle2, AlertTriangle, Bot, Github, ExternalLink, TrendingUp, Zap, Activity } from 'lucide-react'
import { API_BASE } from '../config'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import IssueTable from '../components/IssueTable'
import ActivityTimeline from '../components/ActivityTimeline'
import ContributionHeatmap from '../components/ContributionHeatmap'

const isLocalAccount = () => localStorage.getItem('gh_token')?.startsWith('local_')

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [stats, setStats] = useState(null)
  const [autoMode, setAutoMode] = useState(false)
  const [activities, setActivities] = useState([])
  const navigate = useNavigate()
  const socketRef = useRef(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('gh_token')
      if (!token) {
        navigate('/login')
        return
      }

      const [statsRes, settingsRes, activityRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/activity`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      if (statsRes.status === 401 || settingsRes.status === 401 || activityRes.status === 401) {
        localStorage.removeItem('gh_token')
        navigate('/login')
        return
      }

      const statsData = await statsRes.json()
      const settingsData = await settingsRes.json()
      const activityData = await activityRes.json()

      setStats(statsData || {})
      setAutoMode(settingsData?.auto_mode || false)
      setActivities(Array.isArray(activityData) ? activityData : [])
    } catch (e) {
      console.error('Dashboard fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const syncPRs = useCallback(async () => {
    const token = localStorage.getItem('gh_token')
    if (!token || isLocalAccount()) return
    
    
    fetch(`${API_BASE}/api/sync/prs`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` } 
    }).catch(e => console.error('PR sync background error:', e))
  }, [])

  useEffect(() => {
    fetchDashboardData()
    syncPRs()

    
    if (!socketRef.current) {
      socketRef.current = io(API_BASE)
      socketRef.current.on('settings_updated', (data) => {
        setAutoMode(data.auto_mode)
        setToggling(false)
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [fetchDashboardData])

  const toggleAutoMode = async (e) => {
    
    if (e) e.stopPropagation()
    
    const token = localStorage.getItem('gh_token')
    if (!token) return navigate('/login')
    
    
    if (window.playAISound) window.playAISound('action')
    if (toggling) return
    
    const nextMode = !autoMode
    setToggling(true)
    setAutoMode(nextMode) 
    
    try {
      const response = await fetch(`${API_BASE}/api/settings/update`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_mode: nextMode })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAutoMode(data.auto_mode)
        if (window.playAISound) window.playAISound('success')
        
        setTimeout(() => setToggling(false), 300)
      } else {
        
        setAutoMode(!nextMode)
        setToggling(false)
        if (response.status === 401) navigate('/login')
      }
    } catch (e) {
      console.error('Toggle auto mode failed:', e)
      setAutoMode(!nextMode) 
      setToggling(false)
    }
  }

  const statCards = [
    { title: 'Open Issues', value: stats?.open_issues ?? 0, subtitle: `Across ${stats?.repos_count ?? 0} repos`, icon: CircleDot, color: '#58a6ff' },
    { title: 'Closed Today', value: stats?.closed_today ?? 0, subtitle: 'Great progress!', icon: CheckCircle2, color: '#3fb950' },
    { title: 'High Priority', value: stats?.high_priority ?? 0, subtitle: 'Needs attention', icon: AlertTriangle, color: '#f85149' },
    { title: 'AI Actions', value: stats?.actions_performed ?? 0, subtitle: 'Agent contributions', icon: Bot, color: '#a371f7' },
  ]

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          title="Dashboard"
          subtitle="Real-time analytics and agent status"
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={fetchDashboardData}
                className="btn btn-secondary" 
                style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
              <button
                onClick={toggleAutoMode}
                disabled={toggling}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 16px',
                  background: autoMode ? 'rgba(63, 185, 80, 0.15)' : 'var(--bg-tertiary)',
                  border: `1px solid ${autoMode ? 'var(--accent-green)' : 'var(--border-color)'}`,
                  borderRadius: 12,
                  cursor: toggling ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: 175,
                  outline: 'none',
                  color: autoMode ? 'var(--accent-green)' : 'var(--text-secondary)',
                  boxShadow: autoMode ? '0 0 20px rgba(63, 185, 80, 0.1)' : 'none'
                }}
              >
                <div style={{ width: 34, height: 18, borderRadius: 10, background: autoMode ? 'var(--accent-green)' : 'var(--text-muted)66', position: 'relative' }}>
                  <motion.div
                    animate={{ x: autoMode ? 16 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{ position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {toggling ? (
                    <Loader2 size={12} className="spin" />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
                      {autoMode ? 'AGENT ACTIVE' : 'MANUAL MODE'}
                    </span>
                  )}
                </div>
              </button>
            </div>
          }
        />

        <div className="page-container">
          {!loading && isLocalAccount() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px',
                marginBottom: 24, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.1), rgba(163, 113, 247, 0.1))',
                border: '1px solid rgba(31, 111, 235, 0.3)',
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(31, 111, 235, 0.4)',
              }}>
                <Github size={28} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                   Unlock real-time GitHub synchronization
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  You are currently browsing with a <strong>local-only account</strong>. To start monitoring real issues, 
                  analyzing priorities with AI, and executing agent commands, please connect your GitHub profile.
                </div>
              </div>
              <a
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                  borderRadius: 10, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
                  color: '#fff', textDecoration: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={async (e) => {
                  e.preventDefault()
                  try {
                    const res = await fetch(`${API_BASE}/auth/github`)
                    const data = await res.json()
                    window.location.href = data.url
                  } catch { window.location.href = `${API_BASE}/auth/github` }
                }}
              >
                Connect GitHub <ExternalLink size={16} />
              </a>
            </motion.div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {statCards.map((s, i) => (
              <StatCard key={s.title} {...s} delay={i * 0.08} loading={loading} />
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <ContributionHeatmap loading={loading} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <TrendingUp size={16} color="var(--accent-blue)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Priority Distribution</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {stats?.priority_dist?.length > 0 ? stats.priority_dist.map(p => (
                      <div key={p.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                          <span style={{ fontWeight: 700 }}>{p.count}</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${(p.count / (Math.max(stats?.open_issues, 1))) * 100}%` }}
                            style={{ height: '100%', background: p.color }} 
                          />
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                        No priority data available.
                      </div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <Zap size={16} color="var(--accent-yellow)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Top Labels</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats?.labels_dist?.length > 0 ? stats.labels_dist.map(l => (
                      <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                        <div style={{ width: 40, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{l.count}</div>
                        <div style={{ width: 60, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                          <div style={{ height: '100%', background: 'var(--accent-blue)', width: `${(l.count / (Math.max(stats?.open_issues, 1))) * 100}%` }} />
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                        No label data found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Issues</h2>
                  <button onClick={() => navigate('/issues')} className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}>View all issues</button>
                </div>
                <IssueTable loading={loading} limit={5} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Activity size={16} color="var(--accent-purple)" />
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>Activity</h2>
                </div>
                <div className="card" style={{ padding: '8px 20px' }}>
                  <ActivityTimeline maxItems={8} loading={loading} activities={activities} />
                </div>
              </div>

              <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.05), rgba(163, 113, 247, 0.05))', border: '1px solid rgba(31, 111, 235, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Bot size={18} color="var(--accent-purple)" />
                  <span style={{ fontSize: 14, fontWeight: 800 }}>Agent Status</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Agent is <strong style={{ color: autoMode ? 'var(--accent-green)' : 'var(--text-muted)' }}>{autoMode ? 'active' : 'paused'}</strong>.
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {isLocalAccount() 
                      ? 'Connect GitHub to start automated issue management.' 
                      : `Monitoring ${stats?.open_issues || 0} issues across ${stats?.repos_count ?? 0} repositories. ${autoMode ? 'Auto-actions are enabled.' : 'Standing by for instructions.'}`
                    }
                  </div>
                </div>
                {!isLocalAccount() && (
                  <button 
                    onClick={() => navigate('/agent')}
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: 16, fontSize: 13, padding: '8px' }}
                  >
                    Open Agent Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
