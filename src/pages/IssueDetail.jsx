import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, CircleDot, CheckCircle2, AlertCircle, CheckCircle, ArrowLeft, Send, User, Tag, Trash2, Loader2 } from 'lucide-react'
import { API_BASE } from '../config'
import AIAnalysisPanel, { SkeletonCard } from '../components/AIAnalysisPanel'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ConfirmationModal from '../components/ConfirmationModal'

export default function IssueDetail() {
  const { owner, repo, number } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [issue, setIssue] = useState(null)
  const [comment, setComment] = useState('')
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closing, setClosing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [similarIssues, setSimilarIssues] = useState([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)

  useEffect(() => {
    fetchIssue()
  }, [owner, repo, number])

  const fetchIssue = async () => {
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/issues/${owner}/${repo}/${number}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      const commentsResponse = await fetch(data.comments_url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const commentsData = await commentsResponse.json()
      
      setIssue({
        ...data,
        comments_list: commentsData
      })
    } catch (error) {
      console.error('Failed to fetch issue details:', error)
      showNotification('Failed to fetch issue details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchSimilar = async (issueData) => {
    setLoadingSimilar(true)
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/issues/duplicates`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: issueData.title,
          body: issueData.body,
          repo_full_name: `${owner}/${repo}`,
          number: issueData.number
        })
      })
      const data = await response.json()
      setSimilarIssues(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch similar issues:', e)
    } finally {
      setLoadingSimilar(false)
    }
  }

  useEffect(() => {
    if (issue && !loading) {
      fetchSimilar(issue)
    }
  }, [issue?.number, loading])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleCloseIssue = async () => {
    setClosing(true)
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/issues/${owner}/${repo}/${number}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        showNotification('Issue closed successfully')
        setIssue(prev => ({ ...prev, state: 'closed' }))
      } else {
        throw new Error('Failed to close issue')
      }
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setClosing(false)
      setShowCloseModal(false)
    }
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setActionLoading(true)
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/issues/${owner}/${repo}/${number}/comment`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: comment })
      })
      if (response.ok) {
        const newComment = await response.json()
        setIssue(prev => ({
          ...prev,
          comments_list: [...prev.comments_list, newComment]
        }))
        setComment('')
        showNotification('Comment added')
      }
    } catch (err) {
      showNotification('Failed to add comment', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddLabel = async (labelName) => {
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/issues/${owner}/${repo}/${number}/label`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ labels: [labelName] })
      })
      if (response.ok) {
        const updatedLabels = await response.json()
        setIssue(prev => ({ ...prev, labels: updatedLabels }))
        showNotification(`Label "${labelName}" added`)
      }
    } catch (err) {
      showNotification('Failed to add label', 'error')
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title="Issue Detail" subtitle={issue?.number ? `#${issue.number}` : '...'} />
        
        {}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {}
            <button onClick={() => navigate('/issues')} className="btn btn-secondary" style={{ marginBottom: 20, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Issues
            </button>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <SkeletonCard lines={8} />
                  <SkeletonCard lines={4} />
                </div>
                <SkeletonCard lines={7} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                {}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {}
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                      {issue.state === 'open'
                        ? <CircleDot size={20} color="var(--accent-green)" style={{ marginTop: 3, flexShrink: 0 }} />
                        : <CheckCircle2 size={20} color="var(--accent-purple)" style={{ marginTop: 3, flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 8 }}>
                          {issue.title}
                        </h1>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`badge badge-${issue.state === 'open' ? 'open' : 'closed'}`}>{issue.state}</span>
                          {issue.labels?.map(l => (
                            <span key={l.id} className="badge" style={{ background: `#${l.color}22`, color: `#${l.color}`, border: `1px solid #${l.color}44` }}>{l.name}</span>
                          ))}
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>opened {new Date(issue.created_at).toLocaleDateString()} by <strong style={{ color: 'var(--text-secondary)' }}>{issue.user.login}</strong></span>
                        </div>
                      </div>
                      {issue.state === 'open' && (
                        <button onClick={() => setShowCloseModal(true)} className="btn btn-danger" style={{ fontSize: 12, padding: '6px 10px' }}>
                          <Trash2 size={13} /> Close
                        </button>
                      )}
                    </div>

                    {}
                    <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <pre style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {issue.body || 'No description provided.'}
                      </pre>
                    </div>
                  </div>

                  {}
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                      Comments ({issue.comments_list?.length || 0})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {issue.comments_list?.map((c, i) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: 10, overflow: 'hidden',
                            background: 'var(--bg-tertiary)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                            <img src={c.user.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-card)' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.user.login}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.body}</div>
                        </motion.div>
                      ))}
                    </div>

                    {}
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={14} color="var(--text-muted)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <textarea
                            className="input"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Leave a comment..."
                            rows={3}
                            style={{ resize: 'none', marginBottom: 8 }}
                          />
                          <button className="btn btn-primary" onClick={handleComment} disabled={actionLoading} style={{ fontSize: 13 }}>
                            {actionLoading ? 'Posting...' : <><Send size={13} /> Comment</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <AIAnalysisPanel issue={issue} />

                  {}
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bot size={16} color="var(--accent-purple)" /> Potential Duplicates
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {loadingSimilar ? (
                        <div style={{ padding: '10px 0', textAlign: 'center' }}><Loader2 size={16} className="spin" color="var(--text-muted)" /></div>
                      ) : similarIssues.length > 0 ? (
                        similarIssues.map(si => (
                          <div 
                            key={si.id} 
                            onClick={() => navigate(`/issues/${si.metadata.repo}/${si.metadata.number}`)}
                            style={{ 
                              padding: '10px 12px', background: 'var(--bg-tertiary)', 
                              border: '1px solid var(--border-color)', borderRadius: 8,
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = 'var(--bg-tertiary)';
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {si.metadata.title}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>#{si.metadata.number}</span>
                                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{((1 - si.distance) * 100).toFixed(0)}% match</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No similar issues found.</div>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <MetaRow label="Assignee">
                        {issue.assignee
                          ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <img src={issue.assignee.avatar_url} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />
                              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{issue.assignee.login}</span>
                            </div>
                          : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unassigned</span>
                        }
                      </MetaRow>
                      <MetaRow label="Repository"><span style={{ fontSize: 13, color: 'var(--accent-blue)' }}>{repo}</span></MetaRow>
                      <MetaRow label="Updated"><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(issue.updated_at).toLocaleDateString()}</span></MetaRow>
                    </div>

                    <div style={{ marginTop: 20 }}>
                       <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                         <Tag size={12} /> Add Label
                       </div>
                       <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                         {['bug', 'enhancement', 'help wanted', 'priority: high'].map(l => (
                           <button 
                            key={l} 
                            onClick={() => handleAddLabel(l)}
                            className="badge" 
                            style={{ cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontSize: 11 }}
                           >
                             + {l}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleCloseIssue}
        loading={closing}
        title="Close Issue"
        message={`Are you sure you want to close issue #${issue?.number}? This action can be undone on GitHub.`}
        confirmLabel="Close Issue"
        confirmVariant="danger"
      />
    </div>
  )
}

function MetaRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  )
}
