import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw, Sparkles, ArrowRight, Check, Lock, Globe, Star, CircleDot } from 'lucide-react'
import { API_BASE } from '../config'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const languageColors = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5',
  Go: '#00add8', Rust: '#dea584', Ruby: '#701516', Java: '#b07219', CSS: '#563d7c',
}

function RepoSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 160, height: 16 }} />
        <div className="skeleton" style={{ width: 50, height: 20, borderRadius: 20 }} />
      </div>
      <div className="skeleton" style={{ width: '80%', height: 13, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="skeleton" style={{ width: 60, height: 12 }} />
        <div className="skeleton" style={{ width: 50, height: 12 }} />
        <div className="skeleton" style={{ width: 70, height: 12 }} />
      </div>
    </div>
  )
}

export default function RepoSelector() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [query, setQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('gh_token', token)
      window.history.replaceState({}, document.title, "/repos")
    }

    fetchRepos()
  }, [])

  const fetchRepos = async () => {
    try {
      const authToken = localStorage.getItem('gh_token')
      if (!authToken) {
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE}/api/repos`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        const formatted = data.map(r => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          description: r.description || 'No description provided.',
          language: r.language || 'Plain Text',
          stars: r.stargazers_count,
          forks: r.forks_count,
          openIssues: r.open_issues_count,
          lastUpdated: new Date(r.updated_at).toLocaleDateString(),
          isPrivate: r.private,
          topics: r.topics || []
        }))
        setRepos(formatted)
      }
    } catch (error) {
      console.error('Failed to fetch repos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = repos.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.description.toLowerCase().includes(query.toLowerCase())
  )

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleMonitor = async () => {
    if (selected.length === 0) return
    setSyncing(true)
    
    const token = localStorage.getItem('gh_token')
    if (token) {
      try {
        if (window.playAISound) window.playAISound('action')
        await fetch(`${API_BASE}/api/repos/select`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ repo_ids: selected })
        })
      } catch (e) {
        console.error('Selection failed:', e)
      }
    }
    
    setTimeout(() => {
      if (window.playAISound) window.playAISound('success')
      navigate('/dashboard')
    }, 1500)
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title="Repository Selector" subtitle="Choose repositories for AI monitoring" />
        
        <AnimatePresence>
          {syncing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(13, 17, 23, 0.9)',
                backdropFilter: 'blur(8px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 20
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '3px solid var(--accent-blue)11',
                  borderTopColor: 'var(--accent-blue)',
                  boxShadow: '0 0 30px var(--accent-blue)33'
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Initializing Agent</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Syncing repository metadata and training AI context...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="input" placeholder="Search repositories..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 36 }} />
              </div>
              <button onClick={fetchRepos} className="btn btn-secondary" style={{ padding: '8px 12px' }}><RefreshCw size={14} /></button>
              {selected.length > 0 && (
                <motion.button
                  layoutId="monitor-btn"
                  initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                  className="btn btn-primary"
                  onClick={handleMonitor}
                  disabled={syncing}
                  style={{ gap: 10, padding: '0 24px', height: 40 }}
                >
                  <Sparkles size={14} /> Monitor {selected.length} Repos <ArrowRight size={14} />
                </motion.button>
              )}
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              {selected.length > 0 ? <><span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{selected.length} selected</span> <span style={{ opacity: 0.3 }}>•</span></> : ''}
              {filtered.length} repositories available
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <RepoSkeleton key={i} />)
                : filtered.map((repo, i) => (
                  <RepoCard key={repo.id} repo={repo} selected={selected.includes(repo.id)} onToggle={() => toggle(repo.id)} delay={i * 0.05} />
                ))
              }
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function RepoCard({ repo, selected, onToggle, delay }) {
  const langColor = languageColors[repo.language] || '#8b949e'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onToggle}
      className="card"
      style={{
        padding: 20, cursor: 'pointer',
        border: selected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
        background: selected ? 'var(--accent-blue)08' : 'var(--bg-card)',
        position: 'relative', transition: 'all 0.2s ease',
      }}
      whileHover={{ y: -4, borderColor: selected ? 'var(--accent-blue)' : 'var(--text-muted)33' }}
      whileTap={{ scale: 0.98 }}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--accent-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-blue)44'
          }}
        >
          <Check size={12} color="#fff" />
        </motion.div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {repo.isPrivate ? <Lock size={14} color="var(--accent-yellow)" /> : <Globe size={14} color="var(--accent-green)" />}
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{repo.name}</span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {repo.description}
      </p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: langColor }} />
          {repo.language}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} /> {repo.stars}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CircleDot size={12} color="var(--accent-green)" /> {repo.openIssues}</div>
      </div>
    </motion.div>
  )
}
