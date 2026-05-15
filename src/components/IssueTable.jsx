import { motion, AnimatePresence } from 'framer-motion'
import { CircleDot, CheckCircle2, MessageCircle, Bot, ExternalLink, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
      <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '35%', height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 20 }} />
      <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
      <div className="skeleton" style={{ width: 40, height: 14 }} />
    </div>
  )
}

export default function IssueTable({ issues = [], loading = false, filter = 'all', limit, search = '' }) {
  const safeIssues = Array.isArray(issues) ? (limit ? issues.slice(0, limit) : issues) : []
  const navigate = useNavigate()

  const filtered = safeIssues.filter(i => {
    
    if (search && !i.title?.toLowerCase().includes(search.toLowerCase()) && !i.repository_url?.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    if (filter === 'open') return i.state === 'open'
    if (filter === 'closed') return i.state === 'closed'
    if (filter === 'high') return i.priority === 'high' || i.labels?.some(l => l.name.toLowerCase().includes('high'))
    return true
  })

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 100px 120px 80px 70px',
        padding: '10px 20px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
      }}>
        {['Issue', 'Priority', 'Status', 'AI Score', 'Comments'].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
        ))}
      </div>

      {loading
        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        : (
          <AnimatePresence>
            {filtered.map((issue, i) => {
              const urlParts = issue.repository_url?.split('/') || []
              const owner = urlParts[urlParts.length - 2] || 'owner'
              const repoName = urlParts[urlParts.length - 1] || 'repo'
              return (
                <IssueRow 
                  key={issue.id} 
                  issue={issue} 
                  index={i} 
                  onClick={() => navigate(`/issues/${owner}/${repoName}/${issue.number}`)} 
                />
              )
            })}
          </AnimatePresence>
        )
      }

      {!loading && filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No issues found
        </div>
      )}
    </div>
  )
}

function IssueRow({ issue, index, onClick }) {
  const isOpen = issue.state === 'open'
  const urlParts = issue.repository_url?.split('/') || []
  const owner = urlParts[urlParts.length - 2] || 'owner'
  const repoName = urlParts[urlParts.length - 1] || 'repo'
  const priorityLabel = issue.labels?.find(l => l.name.toLowerCase().includes('priority'))?.name || 'medium'
  const priority = priorityLabel.toLowerCase().includes('high') ? 'high' : priorityLabel.toLowerCase().includes('low') ? 'low' : 'medium'

  const priorityIcon = {
    high: <ChevronUp size={12} color="var(--accent-orange)" />,
    medium: <Minus size={12} color="var(--accent-yellow)" />,
    low: <ChevronDown size={12} color="var(--accent-green)" />,
  }[priority]

  const priorityColor = {
    high: 'var(--accent-orange)', medium: 'var(--accent-yellow)', low: 'var(--accent-green)'
  }[priority]

  const aiScore = issue.ai_score 
  const aiColor = aiScore >= 90 ? '#f85149' : aiScore >= 70 ? '#e3b341' : '#3fb950'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 100px 120px 80px 70px',
        padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
        cursor: 'pointer', transition: 'background 0.15s ease',
        alignItems: 'center',
      }}
      whileHover={{ background: 'var(--bg-card-hover)' }}
    >
      {}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
        {isOpen
          ? <CircleDot size={16} color="var(--accent-green)" style={{ marginTop: 2, flexShrink: 0 }} />
          : <CheckCircle2 size={16} color="var(--accent-purple)" style={{ marginTop: 2, flexShrink: 0 }} />
        }
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {issue.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="code-font" style={{ color: 'var(--accent-blue)' }}>#{issue.number}</span>
            <span>•</span>
            <span>{repoName}</span>
            <span>•</span>
            <span>{new Date(issue.updated_at).toLocaleDateString()}</span>
            {issue.labels?.slice(0, 2).map(l => (
              <span key={l.id} style={{ background: `${l.color}22`, border: `1px solid ${l.color}44`, borderRadius: 4, padding: '1px 6px', fontSize: 11, color: `#${l.color}` }}>{l.name}</span>
            ))}
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {priorityIcon}
        <span style={{ fontSize: 12, fontWeight: 500, color: priorityColor, textTransform: 'capitalize' }}>{priority}</span>
      </div>

      {}
      <div>
        <span className={`badge badge-${isOpen ? 'open' : 'closed'}`}>
          {isOpen ? '● Open' : '✓ Closed'}
        </span>
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {aiScore ? (
          <>
            <Bot size={12} color={aiColor} />
            <span style={{ fontSize: 13, fontWeight: 700, color: aiColor }}>{aiScore}</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</span>
        )}
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
        <MessageCircle size={12} />
        <span style={{ fontSize: 12 }}>{issue.comments}</span>
      </div>
    </motion.div>
  )
}
