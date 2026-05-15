import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, TrendingUp, CircleDot, Star, ExternalLink, Shield, Zap, LayoutGrid, List } from 'lucide-react'
import { API_BASE } from '../config'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import StatCard from '../components/StatCard'

export default function OrgHealth() {
  const [orgs, setOrgs] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    fetchOrgs()
  }, [])

  const fetchOrgs = async () => {
    try {
      const token = localStorage.getItem('gh_token')
      const res = await fetch(`${API_BASE}/api/orgs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setOrgs(Array.isArray(data) ? data : [])
      if (data.length > 0) {
        handleOrgSelect(data[0].login)
      } else {
        setLoading(false)
      }
    } catch (e) {
      console.error('Failed to fetch orgs:', e)
      setLoading(false)
    }
  }

  const handleOrgSelect = async (orgLogin) => {
    setSelectedOrg(orgLogin)
    setLoadingStats(true)
    try {
      const token = localStorage.getItem('gh_token')
      const res = await fetch(`${API_BASE}/api/orgs/${orgLogin}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error('Failed to fetch org stats:', e)
    } finally {
      setLoadingStats(false)
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Repositories', value: stats?.total_repos ?? 0, subtitle: 'In this organization', icon: LayoutGrid, color: '#58a6ff' },
    { title: 'Open Issues', value: stats?.total_open_issues ?? 0, subtitle: 'Across all repos', icon: CircleDot, color: '#f85149' },
    { title: 'Health Score', value: `${stats?.health_score ?? 0}%`, subtitle: 'Based on issue density', icon: Shield, color: '#3fb950' },
    { title: 'Avg Issues/Repo', value: (stats?.total_open_issues / (stats?.total_repos || 1)).toFixed(1), subtitle: 'Resource load', icon: List, color: '#a371f7' },
  ]

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header 
          title="Organization Health" 
          subtitle="Bird's eye view across your GitHub organizations" 
        />

        <div className="page-container">
          {orgs.length > 0 ? (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                {orgs.map(org => (
                  <button
                    key={org.login}
                    onClick={() => handleOrgSelect(org.login)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                      borderRadius: 12, border: `1px solid ${selectedOrg === org.login ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      background: selectedOrg === org.login ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                    }}
                  >
                    <img src={org.avatar_url} alt={org.login} style={{ width: 20, height: 20, borderRadius: 4 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: selectedOrg === org.login ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {org.login}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {statCards.map((s, i) => (
                  <StatCard key={s.title} {...s} delay={i * 0.08} loading={loadingStats} />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TrendingUp size={16} color="var(--accent-blue)" />
                      <h3 style={{ fontSize: 14, fontWeight: 700 }}>Top Repositories by Issues</h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 120px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      <span>Repository</span>
                      <span style={{ textAlign: 'right' }}>Open Issues</span>
                      <span style={{ textAlign: 'right' }}>Stars</span>
                      <span style={{ textAlign: 'right' }}>Last Updated</span>
                    </div>
                    {stats?.top_repos?.map((repo, i) => (
                      <motion.div
                        key={repo.full_name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 120px', padding: '16px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: repo.open_issues > 20 ? 'var(--accent-red)' : repo.open_issues > 10 ? 'var(--accent-orange)' : 'var(--accent-green)' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{repo.name}</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{repo.open_issues}</div>
                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <Star size={12} color="var(--accent-yellow)" fill="var(--accent-yellow)" /> {repo.stars}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(repo.last_updated).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <Shield size={16} color="var(--accent-green)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Health Analysis</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                          <motion.circle 
                            cx="60" cy="60" r="54" fill="none" stroke="var(--accent-green)" strokeWidth="8" 
                            strokeDasharray="339.292"
                            initial={{ strokeDashoffset: 339.292 }}
                            animate={{ strokeDashoffset: 339.292 * (1 - (stats?.health_score || 0) / 100) }}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                          <div style={{ fontSize: 24, fontWeight: 800 }}>{stats?.health_score ?? 0}%</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} color="var(--accent-yellow)" /> AI Insights
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {stats?.ai_insight || (stats?.health_score > 80 
                          ? "This organization looks healthy. Issue density is low and response times are likely fast."
                          : stats?.health_score > 50
                          ? "Moderate issue load detected. Some repositories may require manual triage or AI-assisted cleanup."
                          : "High issue backlog. Consider activating Autonomous Mode for the most active repositories.")
                        }
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', fontWeight: 700 }}>Benchmarks</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Avg Response Time</span>
                          <span style={{ fontWeight: 600 }}>{stats?.benchmarks?.avg_response_time || '1.2 days'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>PR Velocity</span>
                          <span style={{ fontWeight: 600 }}>{stats?.benchmarks?.pr_velocity || '8.5 / week'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: 20 }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Organizations Found</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
                We couldn't find any GitHub organizations associated with your account. Connect a different account or create an organization to see health stats.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
