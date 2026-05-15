import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RepoSelector from './pages/RepoSelector'
import Dashboard from './pages/Dashboard'
import IssuesList from './pages/IssuesList'
import IssueDetail from './pages/IssueDetail'
import AgentChat from './pages/AgentChat'
import ActivityLog from './pages/ActivityLog'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import OrgHealth from './pages/OrgHealth'
import PullRequests from './pages/PullRequests'

import CommandMenu from './components/CommandMenu'

export default function App() {
  useEffect(() => {
    
    const accent = localStorage.getItem('app_accent') || '#58a6ff'
    document.documentElement.style.setProperty('--accent-blue', accent)
    
    
    const theme = localStorage.getItem('app_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    
    
    const compact = localStorage.getItem('app_compact') === 'true'
    if (compact) document.body.classList.add('compact-mode')
    else document.body.classList.remove('compact-mode')
  }, [])

  
  window.playAISound = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      if (type === 'success') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.1)
      } else if (type === 'action') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(220, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.05)
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.05)
      }
    } catch (e) {}
  }

  return (
    <BrowserRouter>
      <CommandMenu />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/repos" element={<RepoSelector />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/issues" element={<IssuesList />} />
        <Route path="/issues/:owner/:repo/:number" element={<IssueDetail />} />
        <Route path="/agent" element={<AgentChat />} />
        <Route path="/activity" element={<ActivityLog />} />
        <Route path="/org-health" element={<OrgHealth />} />
        <Route path="/prs" element={<PullRequests />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
