import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Filter, Download, Search, CheckCircle, AlertCircle } from 'lucide-react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import ActivityTimeline from '../components/ActivityTimeline'
import ContributionHeatmap from '../components/ContributionHeatmap'
import { io } from 'socket.io-client'
import { API_BASE } from '../config'

const EVENT_TYPES = ['All', 'Comment', 'Close', 'Label', 'Assign']

export default function ActivityLog() {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [activeType, setActiveType] = useState('All')
  const [query, setQuery] = useState('')
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchActivity()
    
    
    const socket = io(API_BASE)
    socket.on('activity_update', (newAction) => {
      const formatted = {
        id: `socket_${Date.now()}`,
        action_type: newAction.action,
        issue_number: newAction.issue,
        repo_name: newAction.repo,
        details: `AI Agent: ${newAction.action} on #${newAction.issue}`,
        timestamp: new Date().toISOString(),
        source: 'ai_agent'
      }
      setActivities(prev => [formatted, ...prev])
      
      
      if (window.playAISound) window.playAISound('action')
    })

    return () => socket.disconnect()
  }, [])

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setActivities(data)
    } catch (e) {
      console.error('Failed to fetch activity:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async (id) => {
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/activity/${id}/undo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        showNotification('Action undone successfully')
        setActivities(prev => prev.filter(a => a.id !== id))
      } else {
        throw new Error('Failed to undo action')
      }
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const filtered = activities.filter(a => {
    const matchType = activeType === 'All' || a.action_type?.toLowerCase() === activeType.toLowerCase()
    const matchQuery = a.repo_name?.toLowerCase().includes(query.toLowerCase()) || 
                      a.issue_number?.toString().includes(query.toLowerCase())
    return matchType && matchQuery
  })

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          title="Activity Log"
          subtitle="Full audit trail across all repositories"
          actions={
            <button className="btn btn-secondary" style={{ fontSize: 13 }}>
              <Download size={13} /> Export
            </button>
          }
        />
        
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'fixed', top: 20, right: 20, zIndex: 1000,
                padding: '12px 20px', borderRadius: 10,
                background: notification.type === 'error' ? '#f85149' : '#3fb950',
                color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 14, fontWeight: 600
              }}
            >
              {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            
            <div style={{ marginBottom: 24 }}>
              <ContributionHeatmap loading={loading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total Events', value: activities.length, color: 'var(--accent-blue)' },
                { label: 'AI Actions', value: activities.filter(a => a.details?.includes('Agent')).length, color: 'var(--accent-purple)' },
                { label: 'Issues Affected', value: new Set(activities.map(a => a.issue_number)).size, color: 'var(--accent-green)' },
                { label: 'Repos Involved', value: new Set(activities.map(a => a.repo_name)).size, color: 'var(--accent-yellow)' },
              ].map(({ label, value, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="card"
                  style={{ padding: '16px 20px' }}
                >
                  <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="input" placeholder="Search logs..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 32, height: 36, fontSize: 13, width: 220 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EVENT_TYPES.map(t => (
                  <motion.button
                    key={t}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveType(t)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      background: activeType === t ? '#58a6ff22' : 'var(--bg-tertiary)',
                      border: activeType === t ? '1px solid #58a6ff44' : '1px solid var(--border-color)',
                      color: activeType === t ? 'var(--accent-blue)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >{t}</motion.button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '8px 24px' }}>
              {loading
                ? <ActivityTimeline loading />
                : filtered.length > 0
                  ? <ActivityTimeline activities={filtered} onUndo={handleUndo} />
                  : <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No events found</div>
              }
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
