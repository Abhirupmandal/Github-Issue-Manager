import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { io } from 'socket.io-client'
import { API_BASE } from '../config'

export default function ContributionHeatmap({ loading: externalLoading }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [selectedYear, setSelectedYear] = useState(2026)

  useEffect(() => {
    fetchHeatmap(selectedYear)
  }, [selectedYear])

  
  useEffect(() => {
    const socket = io(API_BASE)
    
    socket.on('activity_update', (payload) => {
      
      if (selectedYear === 2026) {
        fetchHeatmap(2026)
        
        if (window.playAISound) window.playAISound('success')
      }
    })

    return () => socket.disconnect()
  }, [selectedYear])

  const fetchHeatmap = async (year) => {
    
    if (Object.keys(data).length === 0) setLoading(true)
    
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch(`${API_BASE}/api/heatmap?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await response.json()
      setData(result)
    } catch (e) {
      console.error('Failed to fetch heatmap:', e)
    } finally {
      setLoading(false)
    }
  }

  const generateDays = () => {
    const days = []
    let start, end
    
    if (selectedYear === 2026) {
      const today = new Date()
      start = new Date(today)
      start.setDate(today.getDate() - 365)
      while (start.getDay() !== 0) {
        start.setDate(start.getDate() - 1)
      }
      end = today
    } else {
      start = new Date(selectedYear, 0, 1)
      while (start.getDay() !== 0) {
        start.setDate(start.getDate() - 1)
      }
      end = new Date(selectedYear, 11, 31)
    }

    let current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        count: data[dateStr] || 0,
        dayOfWeek: current.getDay(),
        month: current.getMonth(),
        dayOfMonth: current.getDate()
      })
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const days = generateDays()
  const weeks = []
  let currentWeek = []

  days.forEach((day, i) => {
    currentWeek.push(day)
    if (day.dayOfWeek === 6 || i === days.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const getColor = (count) => {
    if (count === 0) return 'var(--bg-tertiary)'
    if (count < 2) return '#0e4429'
    if (count < 5) return '#006d32'
    if (count < 10) return '#26a641'
    return '#39d353'
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const firstDay = week[0]
    if (firstDay && firstDay.month !== lastMonth) {
      if (monthLabels.length === 0 || i - monthLabels[monthLabels.length - 1].index > 2) {
        monthLabels.push({ name: monthNames[firstDay.month], index: i })
        lastMonth = firstDay.month
      }
    }
  })

  const totalContributions = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div className="card" style={{ flex: 1, padding: '20px 24px', overflow: 'hidden', minHeight: 200 }}>
        {loading || externalLoading ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="skeleton" style={{ width: 180, height: 24, marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 53 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="skeleton" style={{ width: 10, height: 10, borderRadius: 2 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {totalContributions} contributions in {selectedYear === 2026 ? 'the last year' : selectedYear}
                </div>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', background: '#3fb95011', border: '1px solid #3fb95033', borderRadius: 10 }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb950', boxShadow: '0 0 8px #3fb950' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#3fb950', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Sync</span>
                </motion.div>
              </div>
              <div 
                onClick={() => fetchHeatmap(selectedYear)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Last synced: Just now <ChevronDown size={14} />
              </div>
            </div>

            <div style={{ position: 'relative', paddingLeft: 30 }}>
              <div style={{ display: 'flex', marginBottom: 6, fontSize: 11, color: 'var(--text-muted)', position: 'relative', height: 16 }}>
                {monthLabels.map(label => (
                  <div key={label.index} style={{ position: 'absolute', left: label.index * 13 }}>
                    {label.name}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ 
                  position: 'absolute', left: 0, top: 22, 
                  display: 'flex', flexDirection: 'column', gap: 3,
                  fontSize: 10, color: 'var(--text-muted)',
                  textAlign: 'right', width: 25, paddingRight: 6
                }}>
                  <div style={{ height: 10 }}>Mon</div>
                  <div style={{ height: 10, marginTop: 13 }}>Wed</div>
                  <div style={{ height: 10, marginTop: 13 }}>Fri</div>
                </div>

                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {week.map((day, dayIdx) => (
                      <motion.div
                        key={day.date}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={{
                          width: 10, height: 10,
                          borderRadius: 2,
                          background: getColor(day.count),
                          cursor: 'pointer',
                          border: '1px solid rgba(27, 31, 35, 0.06)'
                        }}
                        whileHover={{ scale: 1.2, zIndex: 50 }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                   <Info size={12} /> <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Learn how we count contributions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Less</span>
                  {[0, 1, 4, 9, 10].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(c), border: '1px solid rgba(255,255,255,0.05)' }} />
                  ))}
                  <span>More</span>
                </div>
              </div>

              <AnimatePresence>
                {hoveredDay && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    style={{
                      position: 'absolute',
                      top: -45,
                      left: weeks.findIndex(w => w.some(d => d.date === hoveredDay.date)) * 13 - 40,
                      background: '#161b22',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      pointerEvents: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <strong>{hoveredDay.count} contribution{hoveredDay.count !== 1 ? 's' : ''}</strong> on {new Date(hoveredDay.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <div style={{ width: 90, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[2026, 2025, 2024].map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              border: 'none',
              background: selectedYear === year ? 'var(--accent-blue)' : 'transparent',
              color: selectedYear === year ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  )
}
