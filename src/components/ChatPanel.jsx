import { API_BASE } from '../config'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Zap, Copy, User, CheckCircle, ThumbsUp, ThumbsDown, Send, Sparkles } from 'lucide-react'
export default function ChatPanel({ embedded = false }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I am your GitHub Issue Agent. I can help you manage issues using natural language. Try saying "Close all stale issues" or "Label all frontend issues as bug".', timestamp: 'Just now' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [sessions, setSessions] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetchHistory()
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (Array.isArray(data)) setSessions(data)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/chat/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        setMessages(data.map((m, i) => ({
          id: i,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })))
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  useEffect(() => {
    const handleTrigger = (e) => {
      const command = e.detail
      if (command) handleSend(command)
    }
    window.addEventListener('trigger-ai-command', handleTrigger)
    return () => window.removeEventListener('trigger-ai-command', handleTrigger)
  }, [])

  const handleSend = async (text = null) => {
    const commandText = text || input
    if (!commandText.trim() || loading) return
    
    const userMsg = { id: Date.now(), role: 'user', content: commandText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    if (!text) setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/chat-command`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: commandText })
      })
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)

      const aiMsg = {
        id: Date.now() + 1, role: 'assistant',
        content: data.response || data.plan || 'Action completed.',
        executed: data.executed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, role: 'assistant', 
        content: `Sorry, I encountered an error: ${err.message}`, 
        timestamp: 'Now' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const containerStyle = embedded ? {} : {
    display: 'flex', flexDirection: 'column',
    height: '100%', background: 'var(--bg-card)',
    border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden',
  }

  const suggestionChips = [
    "Close all stale issues",
    "Label crash issues as bug",
    "Assign frontend issues to me",
    "Summarize critical issues"
  ]

  return (
    <div style={{ ...containerStyle, display: 'flex', flexDirection: 'row', gap: showHistory && !embedded ? 16 : 0, background: 'transparent', border: 'none' }}>
      {}
      <AnimatePresence>
        {showHistory && !embedded && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: -20 }}
            animate={{ width: 280, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            style={{
              background: 'rgba(22, 27, 34, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', fontSize: 13, gap: 10, borderRadius: 10, height: 42 }} 
                onClick={() => setMessages([])}
              >
                <Zap size={14} fill="currentColor" /> New Chat
              </motion.button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, paddingLeft: 4 }}>Recent History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessions.map((s, i) => (
                  <motion.button 
                    key={s.id} 
                    whileHover={{ x: 4, background: 'var(--bg-tertiary)' }}
                    onClick={() => fetchHistory(s.id)}
                    style={{
                      padding: '12px 14px', borderRadius: 12, background: i === 0 ? 'var(--bg-tertiary)' : 'transparent',
                      border: i === 0 ? '1px solid var(--border-color)' : '1px solid transparent',
                      color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: 13, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{s.date}</div>
                  </motion.button>
                ))}
                {sessions.length === 0 && (
                  <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', opacity: 0.5 }}>No history yet.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minWidth: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
          background: 'rgba(31, 111, 235, 0.03)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          {!embedded && (
            <motion.button 
              whileHover={{ scale: 1.1, color: 'var(--text-primary)' }}
              onClick={() => setShowHistory(!showHistory)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex' }}
            >
              <Copy size={18} style={{ transform: showHistory ? 'rotate(90deg)' : 'none', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </motion.button>
          )}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)'
          }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>AI Issue Agent</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="status-dot online" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, letterSpacing: '0.02em' }}>ACTIVE</span>
            </div>
          </div>
        </div>

        {}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} msg={msg} index={i} />
            ))}
          </AnimatePresence>

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {}
        {!loading && messages.length < 5 && (
          <div style={{ padding: '0 24px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {suggestionChips.map(chip => (
              <motion.button 
                key={chip} 
                whileHover={{ y: -2, borderColor: 'var(--accent-blue)', background: 'rgba(31, 111, 235, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSend(chip)}
                style={{ padding: '8px 16px', borderRadius: 20, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {chip}
              </motion.button>
            ))}
          </div>
        )}

        {}
        <div style={{
          padding: '20px 24px', borderTop: '1px solid var(--border-color)',
          background: 'rgba(22, 27, 34, 0.5)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                className="input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Ask the AI agent anything about your issues..."
                rows={1}
                style={{ 
                  resize: 'none', lineHeight: 1.5, paddingTop: 12, paddingBottom: 12, paddingRight: 40,
                  borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  minHeight: 46
                }}
              />
              <Sparkles size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 14, top: 16, opacity: 0.5 }} />
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ width: 46, height: 46, padding: 0, justifyContent: 'center', borderRadius: 12, flexShrink: 0, opacity: !input.trim() || loading ? 0.5 : 1 }}
            >
              <Send size={18} />
            </motion.button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={10} color="var(--accent-blue)" />
            Agent is ready to analyze and execute bulk actions.
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, index }) {
  const isAI = msg.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isAI ? 'row' : 'row-reverse' }}
    >
      {}
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: isAI ? 'linear-gradient(135deg, #1f6feb, #a371f7)' : 'var(--bg-tertiary)',
        border: isAI ? 'none' : '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isAI ? <Bot size={14} color="#fff" /> : <User size={14} color="var(--text-secondary)" />}
      </div>

      {}
      <div style={{ maxWidth: '75%' }}>
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: isAI ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #1f6feb, #388bfd)',
          border: isAI ? '1px solid var(--border-color)' : 'none',
          fontSize: 13, color: isAI ? 'var(--text-primary)' : '#fff',
          lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {renderMarkdown(msg.content)}
          
          {msg.executed?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {msg.executed.map((ex, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 6, fontSize: 11, border: '1px solid var(--border-color)' }}>
                  <CheckCircle size={12} color="var(--accent-green)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Executed <strong>{ex.action}</strong> on issue <strong>#{ex.issue}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: isAI ? 'left' : 'right', display: 'flex', gap: 8, alignItems: 'center', justifyContent: isAI ? 'flex-start' : 'flex-end' }}>
          {msg.timestamp}
          {isAI && (
            <>
              <ThumbsUp size={10} style={{ cursor: 'pointer' }} />
              <ThumbsDown size={10} style={{ cursor: 'pointer' }} />
              <Copy size={10} style={{ cursor: 'pointer' }} />
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function renderMarkdown(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'inherit', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 12 }}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Bot size={14} color="#fff" />
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }}
            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
        ))}
      </div>
    </div>
  )
}
