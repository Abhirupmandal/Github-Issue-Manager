import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitPullRequest, Search, RefreshCw, AlertTriangle, CheckCircle, Clock, Bot, ArrowRight, Shield, Zap, Info, Loader2 } from 'lucide-react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { API_BASE } from '../config'

export default function PullRequests() {
  const [prs, setPrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedPR, setSelectedPR] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    fetchPRs()
  }, [])

  const fetchPRs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('gh_token')
      const res = await fetch(`${API_BASE}/api/issues?state=open`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      setPrs(data.filter(i => i.pull_request))
    } catch (e) {
      console.error('Failed to fetch PRs:', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePredict = async (pr) => {
    setSelectedPR(pr)
    setAnalyzing(true)
    setPrediction(null)
    
    try {
      const urlParts = pr.repository_url.split('/')
      const owner = urlParts[urlParts.length - 2]
      const repo = urlParts[urlParts.length - 1]
      const token = localStorage.getItem('gh_token')
      
      const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/prs/${pr.number}/predict`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setPrediction(data)
    } catch (e) {
      console.error('Prediction failed:', e)
    } finally {
      setAnalyzing(false)
    }
  }

  const filtered = prs.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    p.repository_url.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header 
          title="Predictive PR Review" 
          subtitle="AI-powered impact analysis for pull requests" 
        />
        
        <div className="page-container">
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input" 
                placeholder="Search open pull requests..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <button className="btn btn-secondary" onClick={fetchPRs} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
            {}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Open Pull Requests
              </div>
              
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" /></div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No open pull requests found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filtered.map(pr => (
                    <div 
                      key={pr.id}
                      onClick={() => handlePredict(pr)}
                      style={{ 
                        padding: '16px 20px', borderBottom: '1px solid var(--border-color)', 
                        cursor: 'pointer', transition: 'all 0.2s',
                        background: selectedPR?.id === pr.id ? 'var(--bg-card-hover)' : 'transparent',
                        borderLeft: selectedPR?.id === pr.id ? '4px solid var(--accent-blue)' : '4px solid transparent'
                      }}
                      className="hover-bg"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <GitPullRequest size={16} color="var(--accent-green)" />
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{pr.title}</span>
                        </div>
                        <span className="code-font" style={{ fontSize: 12, color: 'var(--accent-blue)' }}>#{pr.number}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>{pr.repository_url.split('/').pop()}</span>
                        <span>•</span>
                        <span>{pr.user.login}</span>
                        <span>•</span>
                        <span>{new Date(pr.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {}
            <div className="card" style={{ padding: 24, position: 'sticky', top: 24 }}>
              {!selectedPR ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Bot size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Select a PR</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Choose a pull request from the list to run AI impact prediction.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1f6feb, #a371f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={18} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>AI Impact Analysis</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Predictive Build Review</div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {analyzing ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ padding: '40px 0', textAlign: 'center' }}
                      >
                        <div className="loader-container" style={{ marginBottom: 16 }}>
                          <motion.div 
                            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto' }}
                          />
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Analyzing diff and predicting build outcome...</p>
                      </motion.div>
                    ) : prediction ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ 
                          padding: 16, borderRadius: 12, 
                          background: prediction.risk_level === 'high' ? '#f8514915' : prediction.risk_level === 'medium' ? '#e3b34115' : '#3fb95015',
                          border: `1px solid ${prediction.risk_level === 'high' ? '#f8514933' : prediction.risk_level === 'medium' ? '#e3b34133' : '#3fb95033'}`,
                          marginBottom: 20
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {prediction.risk_level === 'high' ? <AlertTriangle size={16} color="#f85149" /> : <Shield size={16} color="#3fb950" />}
                              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: prediction.risk_level === 'high' ? '#f85149' : '#3fb950' }}>
                                {prediction.risk_level} RISK
                              </span>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{prediction.break_probability}%</div>
                          </div>
                          <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                            <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${prediction.break_probability}%` }}
                              style={{ height: '100%', background: prediction.risk_level === 'high' ? '#f85149' : '#3fb950' }} 
                            />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>Break Probability</div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Summary</div>
                          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{prediction.summary}</p>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Predicted Issues</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {prediction.predicted_issues?.map((issue, i) => (
                              <div key={i} style={{ display: 'flex', gap: 10, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12 }}>
                                <Info size={14} color="var(--accent-blue)" style={{ marginTop: 2, flexShrink: 0 }} />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                          <Zap size={14} color="var(--accent-yellow)" />
                          <div style={{ flex: 1, fontSize: 12 }}>AI Confidence: <strong>{Math.round(prediction.confidence * 100)}%</strong></div>
                        </div>
                      </motion.div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click analyze to run prediction.</p>
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => handlePredict(selectedPR)}>
                          Run Analysis
                        </button>
                      </div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
