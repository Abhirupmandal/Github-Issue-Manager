import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Lightbulb, Link2, AlertTriangle, CheckCircle, Clock, Sparkles } from 'lucide-react'
import { API_BASE } from '../config'

export function SkeletonCard({ lines = 3, height = null }) {
  return (
    <div className="card" style={{ padding: 20, height }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '50%', height: 14, marginBottom: 5 }} />
          <div className="skeleton" style={{ width: '30%', height: 11 }} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: i === lines - 1 ? '65%' : '100%', height: 12, marginBottom: 8 }} />
      ))}
    </div>
  )
}

export default function AIAnalysisPanel({ issue }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!issue) return

    const fetchAnalysis = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('gh_token')
        const [owner, repoName] = issue.repository_url.split('/').slice(-2)
        
        const response = await fetch(`${API_BASE}/api/analyze-issue`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: issue.number,
            repo_full_name: `${owner}/${repoName}`,
            title: issue.title,
            body: issue.body
          })
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error)
        setAnalysis(data)
      } catch (err) {
        console.error('Analysis failed:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [issue?.id])

  if (loading) return <SkeletonCard lines={6} />
  if (error) return (
    <div className="card" style={{ padding: 20, border: '1px solid #f8514933', background: '#f8514908' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f85149' }}>
        <AlertTriangle size={18} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>AI Analysis Failed</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{error}</p>
    </div>
  )

  if (!analysis) return null

  const score = analysis.priority === 'high' ? 92 : analysis.priority === 'medium' ? 65 : 35

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ overflow: 'hidden' }}
    >
      {}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
        background: 'linear-gradient(135deg, #a371f711, #58a6ff11)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #a371f7, #58a6ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px #a371f744',
        }}>
          <Bot size={16} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Gemini 3.0 Insights</div>
            {analysis.cached && <span style={{ fontSize: 10, padding: '1px 5px', background: 'var(--bg-tertiary)', borderRadius: 4, color: 'var(--text-muted)' }}>Cached</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Priority: <span style={{ color: `var(--accent-${analysis.priority === 'high' ? 'orange' : analysis.priority === 'medium' ? 'yellow' : 'green'})`, fontWeight: 600 }}>{analysis.priority}</span></div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <ScoreRing score={score} />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
             <Sparkles size={12} color="var(--accent-purple)" /> Summary
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.summary}</p>
        </div>

        {}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          <Lightbulb size={12} style={{ display: 'inline', marginRight: 5 }} />
          Suggested Action
        </div>
        <div style={{
          padding: '12px 14px', borderRadius: 10,
          background: 'linear-gradient(to right, var(--bg-tertiary), transparent)',
          border: '1px solid var(--border-color)',
          fontSize: 13, color: 'var(--text-primary)',
          lineHeight: 1.5,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent-blue)' }} />
          {analysis.suggested_action}
        </div>

        {}
        <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 8, background: '#e3b34111', border: '1px solid #e3b34133', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Clock size={14} color="var(--accent-yellow)" />
          <span style={{ fontSize: 12, color: 'var(--accent-yellow)', fontWeight: 500 }}>AI Suggested Label: <strong style={{ color: 'var(--text-primary)' }}>{analysis.label}</strong></span>
        </div>
      </div>
    </motion.div>
  )
}

function ScoreRing({ score }) {
  const r = 18, c = 2 * Math.PI * r
  const fill = (score / 100) * c
  const color = score >= 90 ? '#f85149' : score >= 70 ? '#e3b341' : '#3fb950'

  return (
    <div style={{ position: 'relative', width: 48, height: 48 }}>
      <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={24} cy={24} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth={3} />
        <circle cx={24} cy={24} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${fill} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color,
      }}>{score}</div>
    </div>
  )
}
