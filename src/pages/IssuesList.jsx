import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter, SlidersHorizontal, CircleDot, CheckCircle2, AlertTriangle } from 'lucide-react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import IssueTable from '../components/IssueTable'
import { io } from 'socket.io-client'

import { API_BASE } from '../config'

const FILTERS = ['all', 'open', 'closed', 'high']

export default function IssuesList() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  const fetchIssues = useCallback(async () => {
    try {
      const token = localStorage.getItem('gh_token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE}/api/issues?state=${filter === 'all' ? 'all' : filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setIssues(data)
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchIssues()
    
    
    const socket = io(API_BASE)
    socket.on('activity_update', () => {
      fetchIssues()
      if (window.playAISound) window.playAISound('action')
    })

    return () => socket.disconnect()
  }, [fetchIssues])

  const counts = {
    all: issues.length,
    open: issues.filter(i => i.state === 'open').length,
    closed: issues.filter(i => i.state === 'closed').length,
    high: issues.filter(i => i.labels?.some(l => l.name.toLowerCase().includes('high') || l.name.toLowerCase().includes('priority'))).length,
  }

  const filterIcons = { all: SlidersHorizontal, open: CircleDot, closed: CheckCircle2, high: AlertTriangle }
  const filterColors = { all: 'var(--accent-blue)', open: 'var(--accent-green)', closed: 'var(--accent-purple)', high: 'var(--accent-orange)' }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          title="Issues"
          subtitle={`${counts.open} open · ${counts.closed} closed across all repos`}
          actions={
            <button className="btn btn-primary" style={{ fontSize: 13 }}>
              <Plus size={14} /> New Issue
            </button>
          }
        />
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

            {}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '6px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)', width: 'fit-content' }}>
              {FILTERS.map(f => {
                const Icon = filterIcons[f]
                const active = filter === f
                return (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFilter(f)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 7,
                      background: active ? 'var(--bg-card)' : 'transparent',
                      border: active ? '1px solid var(--border-color)' : '1px solid transparent',
                      color: active ? filterColors[f] : 'var(--text-muted)',
                      fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={13} />
                    <span style={{ textTransform: 'capitalize' }}>{f}</span>
                    <span style={{
                      background: active ? `${filterColors[f]}22` : 'var(--bg-tertiary)',
                      color: active ? filterColors[f] : 'var(--text-muted)',
                      borderRadius: 20, padding: '0 7px', fontSize: 11, fontWeight: 600,
                    }}>{counts[f]}</span>
                  </motion.button>
                )
              })}
            </div>

            {}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {['All Repos', ...new Set(issues.map(i => i.repository?.full_name?.split('/')[1]).filter(Boolean))].map((r, i) => (
                <motion.span
                  key={r}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                    background: i === 0 ? '#58a6ff22' : 'var(--bg-tertiary)',
                    border: i === 0 ? '1px solid #58a6ff44' : '1px solid var(--border-color)',
                    color: i === 0 ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >{r}</motion.span>
              ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <IssueTable loading={loading} issues={issues} filter={filter} search={searchQuery} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
