import { motion } from 'framer-motion'
import { CircleDot, Bot, MessageCircle, CheckCircle2, Tag, UserPlus, GitPullRequest, Undo2 } from 'lucide-react'

const iconMap = {
  'comment': MessageCircle,
  'close': CheckCircle2,
  'label': Tag,
  'assign': UserPlus,
  'push': GitPullRequest,
  'pullrequest': GitPullRequest,
  'create': CircleDot,
  'issuecomment': MessageCircle,
  'agent': Bot,
}

const typeStyles = {
  'comment': { color: 'var(--accent-blue)', bg: '#58a6ff18' },
  'close': { color: 'var(--accent-purple)', bg: '#a371f718' },
  'label': { color: 'var(--accent-yellow)', bg: '#e3b34118' },
  'assign': { color: 'var(--accent-blue)', bg: '#58a6ff18' },
  'push': { color: 'var(--accent-green)', bg: '#3fb95018' },
  'pullrequest': { color: 'var(--accent-purple)', bg: '#a371f718' },
  'create': { color: 'var(--accent-green)', bg: '#3fb95018' },
}

function SkeletonActivity() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '70%', height: 13, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '40%', height: 11 }} />
      </div>
    </div>
  )
}

export default function ActivityTimeline({ activities = [], loading = false, maxItems, onUndo }) {
  const safeActivities = Array.isArray(activities) ? activities : []
  const items = maxItems ? safeActivities.slice(0, maxItems) : safeActivities

  if (!loading && items.length === 0) {
    return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No recent activity.</div>
  }

  
  const groups = items.reduce((acc, item) => {
    const date = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  return (
    <div>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <SkeletonActivity key={i} />)
      ) : (
        Object.entries(groups).map(([date, groupActivities], groupIdx) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 44 }}>{date}</div>
            {groupActivities.map((item, i) => {
              const Icon = iconMap[item.action_type] || CircleDot
              const style = typeStyles[item.action_type] || { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' }

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    display: 'flex', gap: 12, padding: '10px 0',
                    alignItems: 'flex-start',
                  }}
                >
                  {}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={style.color} />
                  </div>

                  {}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>{item.source === 'ai_agent' ? 'AI Agent' : 'You'}</span>
                      {' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.source === 'ai_agent' 
                          ? `${item.action_type === 'close' ? 'closed' : item.action_type === 'comment' ? 'commented on' : 'modified'} issue ${item.issue_number ? '#' + item.issue_number : ''}`
                          : item.details
                        }
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--accent-blue)' }}>{item.repo_name}</span>
                      {item.source === 'ai_agent' && (
                        <>
                          <span>·</span>
                          <span style={{ color: 'var(--accent-purple)', fontWeight: 500 }}>AI Action</span>
                        </>
                      )}
                    </div>
                  </div>

                  {}
                  {onUndo && item.source === 'ai_agent' && (
                    <button 
                      onClick={() => {
                        const idStr = String(item.id)
                        onUndo(idStr.replace('local_', ''))
                      }}
                      style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--accent-pink)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Undo2 size={14} />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
