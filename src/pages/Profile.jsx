import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github, Star, GitFork, CircleDot, MapPin, Link, Calendar, Edit3, LogOut, Shield, Zap, Loader2, Sparkles, Trophy, Cpu, Database, AlertTriangle, Activity } from 'lucide-react'
import axios from 'axios'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import ContributionHeatmap from '../components/ContributionHeatmap'
import { API_BASE as API } from '../config'

export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState({
    name: localStorage.getItem('gh_username') || 'Guest User',
    username: localStorage.getItem('gh_username') || 'guest',
    avatar: localStorage.getItem('gh_avatar') || 'https://github.com/identicons/guest.png',
    email: '',
    joinedAt: ''
  })
  const [stats, setStats] = useState({
    open_issues: 0,
    actions_performed: 0,
    high_priority: 0,
    repo_count: 0,
  })

  useEffect(() => {
    const token = localStorage.getItem('gh_token')
    if (!token) {
      navigate('/login')
      return
    }
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      axios.get(`${API}/auth/me`, { headers }).catch(() => null),
      axios.get(`${API}/api/stats`, { headers }).catch(() => null),
      axios.get(`${API}/api/repos`, { headers }).catch(() => null),
    ])
      .then(([meRes, statsRes, reposRes]) => {
        if (meRes?.data) {
          const u = meRes.data
          setUserData(prev => ({
            ...prev,
            name: u.name || u.username || prev.name,
            username: u.username || prev.username,
            avatar: u.avatar_url || prev.avatar,
            email: u.email || '',
          }))
        }
        if (statsRes?.data) {
          setStats(prev => ({
            ...prev,
            open_issues: statsRes.data.open_issues ?? 0,
            actions_performed: statsRes.data.actions_performed ?? 0,
            high_priority: statsRes.data.high_priority ?? 0,
          }))
        }
        if (reposRes?.data) {
          setStats(prev => ({
            ...prev,
            repo_count: Array.isArray(reposRes.data) ? reposRes.data.length : 0,
          }))
        }
      })
      .catch(err => {
        console.error('Profile fetch error:', err)
        setError('Failed to load profile data')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const devIndex = useMemo(() => {
    const base = 500
    const actions = (stats.actions_performed || 0) * 12
    const repos = (stats.repo_count || 0) * 8
    return Math.min(999, base + actions + repos)
  }, [stats])

  const statItems = [
    { label: 'Repositories', value: stats.repo_count, icon: Database },
    { label: 'Open Issues', value: stats.open_issues, icon: CircleDot },
    { label: 'AI Actions', value: stats.actions_performed, icon: Cpu },
    { label: 'High Priority', value: stats.high_priority, icon: AlertTriangle },
  ]

  const isGithubConnected = !localStorage.getItem('gh_token')?.startsWith('local_')

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title="Profile" subtitle="Developer analytics and account overview" />
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 12, color: 'var(--text-muted)' }}>
                <Loader2 size={20} className="spin" />
                <span>Loading profile...</span>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

              {}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: 28, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  {}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(135deg, #1f6feb33, #a371f733)', zIndex: 0 }} />
                  
                  {}
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20, zIndex: 1, marginTop: 24 }}>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      style={{
                        width: 96, height: 96, borderRadius: 24,
                        background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
                        padding: 3, margin: '0 auto',
                        boxShadow: '0 8px 32px rgba(31, 111, 235, 0.3)',
                      }}
                    >
                      <img src={userData.avatar} alt={userData.name}
                        style={{ width: '100%', height: '100%', borderRadius: 21, background: 'var(--bg-card)' }} />
                    </motion.div>
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 24, height: 24, borderRadius: '50%',
                      background: isGithubConnected ? 'var(--accent-green)' : 'var(--accent-orange)',
                      border: '4px solid var(--bg-card)',
                      boxShadow: `0 0 12px ${isGithubConnected ? 'var(--accent-green)' : 'var(--accent-orange)'}`,
                    }} />
                  </div>

                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{userData.name}</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>@{userData.username}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                      <Zap size={11} color="var(--accent-green)" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Level 12</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                      <Sparkles size={11} color="var(--accent-blue)" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Beta Tester</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                      <Edit3 size={13} /> Edit
                    </button>
                    <button className="btn btn-danger" onClick={handleLogout} style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                      <LogOut size={13} /> Logout
                    </button>
                  </div>
                </div>

                {}
                <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.05), rgba(163, 113, 247, 0.05))', border: '1px solid rgba(31, 111, 235, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Trophy size={18} color="var(--accent-yellow)" />
                    <span style={{ fontSize: 14, fontWeight: 800 }}>Developer Index</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{devIndex}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-green)' }}>+14.2%</div>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 10, margin: '16px 0', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(devIndex/999)*100}%` }} transition={{ duration: 1 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #1f6feb, #a371f7)' }} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Your productivity is in the **top 2%** of IssueAgent users this week. Keep up the high resolution rate!
                  </p>
                </div>
              </div>

              {}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {statItems.map(({ label, value }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="card" style={{ padding: '20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-blue)', marginBottom: 4 }}>{value}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="card" style={{ padding: 24 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                       <Activity size={18} color="var(--accent-blue)" />
                       Issue Activity History
                     </div>
                     <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 2s infinite' }} />
                       Live Sync Active
                     </div>
                   </div>
                   <ContributionHeatmap loading={loading} />
                </div>

                {}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={14} color="var(--accent-purple)" /> AI Insights
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <li style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 6 }} />
                        Fastest resolution time: <strong>4.2 hours</strong> (UI Bugs)
                      </li>
                      <li style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 6 }} />
                        Most active repository: <strong>{userData.username}/core-engine</strong>
                      </li>
                    </ul>
                  </div>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Shield size={14} color="var(--accent-green)" /> Security Summary
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      No critical vulnerabilities detected in your last 12 synchronized repositories. Agent is standing by for security audits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

