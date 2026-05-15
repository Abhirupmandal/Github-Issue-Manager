import { API_BASE } from '../config'
import { io } from 'socket.io-client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, RefreshCw, AlertCircle, XCircle, Settings2, Sparkles, Zap, ArrowRight, Bot, Play, Pause } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ChatPanel from '../components/ChatPanel'
import { SkeletonCard } from '../components/AIAnalysisPanel'

const mapLogsToTasks = (logs) => {
  return logs.slice(0, 10).map(l => ({
    id: l.id,
    task: l.details || `Executed ${l.action_type}`,
    status: 'done',
    time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    result: `Issue #${l.issue_number} in ${l.repo_name}`,
    type: l.action_type
  }))
}

const statusStyle = {
  done: { color: 'var(--accent-green)', bg: '#3fb95018', icon: CheckCircle2 },
  running: { color: 'var(--accent-blue)', bg: '#58a6ff18', icon: RefreshCw },
  queued: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', icon: AlertCircle },
  failed: { color: 'var(--accent-pink)', bg: '#f8516918', icon: XCircle },
}

export default function AgentChat() {
  const [loading, setLoading] = useState(true)
  const [agentRunning, setAgentRunning] = useState(true)
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ done: 0, closed: 0, labels: 0 })

  useEffect(() => {
    fetchAgentData()
    
    
    const socket = io(API_BASE)
    
    socket.on('activity_update', (newAction) => {
      const formatted = {
        id: `socket_${Date.now()}`,
        task: `Agent executed ${newAction.action}`,
        status: 'done',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: `Issue #${newAction.issue} in ${newAction.repo}`,
        type: newAction.action
      }
      setTasks(prev => [formatted, ...prev])
      setStats(prev => ({ ...prev, done: prev.done + 1 }))
      if (window.playAISound) window.playAISound('action')
    })

    socket.on('settings_updated', (data) => {
      setAgentRunning(data.auto_mode)
    })

    return () => socket.disconnect()
  }, [])

  const fetchAgentData = async () => {
    try {
      const token = localStorage.getItem('gh_token')
      const [activityRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/activity`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      const activityData = await activityRes.json()
      const settingsData = await settingsRes.json()
      
      if (Array.isArray(activityData)) {
        setTasks(mapLogsToTasks(activityData))
        setStats({
          done: activityData.length,
          closed: activityData.filter(l => l.action_type === 'close').length,
          labels: activityData.filter(l => l.action_type === 'label').length
        })
      }
      setAgentRunning(settingsData?.auto_mode || false)
    } catch (e) {
      console.error('Agent data fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleAgent = async () => {
    const newState = !agentRunning
    setAgentRunning(newState)
    
    try {
      const token = localStorage.getItem('gh_token')
      await fetch(`${API_BASE}/api/settings/update`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_mode: newState })
      })
      if (window.playAISound) window.playAISound('success')
    } catch (e) {
      console.error('Failed to toggle agent:', e)
    }
  }

  const handleQuickAction = (command) => {
    window.dispatchEvent(new CustomEvent('trigger-ai-command', { detail: command }))
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          title="AI Agent"
          subtitle="Autonomous issue management powered by AI"
          actions={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleAgent}
              className={`btn ${agentRunning ? 'btn-secondary' : 'btn-primary'}`}
              style={{ fontSize: 13, gap: 8 }}
            >
              {agentRunning ? <><Pause size={13} /> Pause Agent</> : <><Play size={13} /> Start Agent</>}
            </motion.button>
          }
        />

        <div className="page-container" style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, height: 'calc(100vh - 160px)' }}>

            {}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>

              {}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 18px', borderRadius: 10, flexShrink: 0,
                    background: agentRunning ? 'linear-gradient(135deg, #1f6feb14, #a371f714)' : 'var(--bg-tertiary)',
                    border: `1px solid ${agentRunning ? '#1f6feb33' : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: agentRunning ? '0 4px 20px rgba(31, 111, 235, 0.05)' : 'none'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: agentRunning ? 'var(--accent-green)' : 'var(--text-muted)', boxShadow: agentRunning ? '0 0 12px var(--accent-green)' : 'none' }} />
                    {agentRunning && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-green)' }} />}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Agent is {agentRunning ? 'Running' : 'Standby'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Powered by Gemini 3.0</span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
                    {[['Tasks', stats.done], ['Auto-closed', stats.closed], ['Labeled', stats.labels]].map(([l, v]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: '-0.02em' }}>{v}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {}
              <div style={{ flex: 1, minHeight: 0 }} className="card">
                {loading ? <SkeletonCard lines={6} height="100%" /> : <ChatPanel />}
              </div>
            </div>

            {}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings2 size={15} color="var(--text-secondary)" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Task Stream</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase' }}>Live</span>
                  </div>
                </div>

                <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="skeleton" style={{ width: '70%', height: 13, marginBottom: 6 }} />
                            <div className="skeleton" style={{ width: '40%', height: 11 }} />
                          </div>
                        ))
                      : tasks.length > 0 ? tasks.map((task, i) => {
                          const s = statusStyle[task.status] || statusStyle.done
                          const Icon = s.icon
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'flex-start' }}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${s.color}22` }}>
                                <Icon size={14} color={s.color} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>{task.task}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.result}</div>
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2, fontWeight: 500 }}>{task.time}</span>
                            </motion.div>
                          )
                        }) : (
                          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Bot size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                            <div style={{ fontSize: 13 }}>No tasks in stream.</div>
                          </div>
                        )
                    }
                  </AnimatePresence>
                </div>
              </div>

              {}
              {!loading && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} color="var(--accent-yellow)" />
                    Predictive Actions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {['Analyze all open issues now', 'Auto-assign unassigned issues', 'Generate summary report', 'Close all stale issues'].map((action, i) => (
                      <motion.button
                        key={action}
                        whileHover={{ x: 4, background: 'var(--bg-card)', borderColor: 'var(--accent-blue)33' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', transition: 'all 0.2s', fontWeight: 500 }}
                      >
                        <Zap size={14} color="var(--accent-blue)" />
                        <span style={{ flex: 1, textAlign: 'left' }}>{action}</span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
