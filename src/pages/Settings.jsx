import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Bot, Github, Palette, Shield, Key, Save, AlertTriangle, Monitor, Moon, Sun, Check, Heart, Zap } from 'lucide-react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import ToggleSwitch from '../components/ToggleSwitch'

const TABS = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ai', label: 'AI Agent', icon: Bot },
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

const ACCENT_COLORS = [
  { name: 'Blue', color: '#58a6ff' },
  { name: 'Purple', color: '#a371f7' },
  { name: 'Green', color: '#3fb950' },
  { name: 'Orange', color: '#f78166' },
  { name: 'Pink', color: '#f85149' },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('ai')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    auto_mode: false,
    agent_personality: 'generalist',
    notifications: { email: true, push: false },
    rules: []
  })
  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem('app_theme') || 'dark',
    accent: localStorage.getItem('app_accent') || '#58a6ff',
    compact: localStorage.getItem('app_compact') === 'true'
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('gh_token')
      const response = await fetch('http://127.0.0.1:5000/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setSettings({
        auto_mode: data.auto_mode,
        agent_personality: data.agent_personality || 'generalist',
        notifications: data.notifications || { email: true, push: false },
        rules: data.rules || []
      })
    } catch (e) {
      console.error('Failed to fetch settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('gh_token')
      
      
      await fetch('http://127.0.0.1:5000/api/settings/update', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auto_mode: settings.auto_mode,
          agent_personality: settings.agent_personality,
          notifications: settings.notifications,
          rules: settings.rules
        })
      })

      
      localStorage.setItem('app_theme', appearance.theme)
      localStorage.setItem('app_accent', appearance.accent)
      localStorage.setItem('app_compact', appearance.compact)
      
      
      document.documentElement.style.setProperty('--accent-blue', appearance.accent)
      document.documentElement.setAttribute('data-theme', appearance.theme)

      if (window.playAISound) window.playAISound('success')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const updateAutoMode = (val) => setSettings(p => ({ ...p, auto_mode: val }))
  const updateNotify = (key, val) => setSettings(p => ({ ...p, notifications: { ...p.notifications, [key]: val } }))
  const updateAppearance = (key, val) => setAppearance(p => ({ ...p, [key]: val }))

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          title="Settings"
          subtitle="Configure IssueAgent for your workspace"
          actions={
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="btn btn-primary"
              style={{ fontSize: 13, minWidth: 120 }}
            >
              {saved ? '✓ Saved!' : <><Save size={13} /> Save Changes</>}
            </motion.button>
          }
        />
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
            {}
            <div className="card" style={{ padding: 8, height: 'fit-content' }}>
              {TABS.map(tab => {
                const active = activeTab === tab.id
                return (
                  <motion.button key={tab.id} whileHover={{ x: 2 }}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                      background: active ? 'var(--accent-blue)18' : 'transparent',
                      border: active ? '1px solid var(--accent-blue)33' : '1px solid transparent',
                      color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      fontSize: 14, fontWeight: active ? 600 : 400, textAlign: 'left',
                    }}
                  >
                    <tab.icon size={15} />{tab.label}
                  </motion.button>
                )
              })}
            </div>

            {}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="card" style={{ padding: 28 }}>

              {activeTab === 'ai' && (
                <Section title="AI Agent" desc="Control autonomous AI behaviour and personality.">
                  <ToggleRow 
                    label="Agent Auto Mode" 
                    desc="Let the agent execute actions automatically based on its analysis" 
                    value={settings.auto_mode} 
                    onChange={updateAutoMode} 
                  />
                  
                  {}
                  <div style={{ marginTop: 32 }}>
                    <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 16 }}>Agent Personality</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { id: 'generalist', label: 'Generalist', icon: Bot, desc: 'Balanced triage & logic' },
                        { id: 'security', label: 'Security Sentry', icon: Shield, desc: 'Strict auditing & risks' },
                        { id: 'community', label: 'Liaison', icon: Heart, desc: 'Friendly onboarding' },
                      ].map(p => (
                        <div 
                          key={p.id}
                          onClick={() => setSettings(s => ({...s, agent_personality: p.id}))}
                          className="card"
                          style={{ 
                            padding: 16, 
                            cursor: 'pointer',
                            borderColor: settings.agent_personality === p.id ? 'var(--accent-blue)' : 'var(--border-color)',
                            background: settings.agent_personality === p.id ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                            position: 'relative'
                          }}
                        >
                          <p.icon size={18} color={settings.agent_personality === p.id ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
                          {settings.agent_personality === p.id && (
                            <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={10} color="#fff" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 24, padding: 14, background: '#e3b34112', border: '1px solid #e3b34130', borderRadius: 8, display: 'flex', gap: 10 }}>
                    <AlertTriangle size={14} color="var(--accent-yellow)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: 'var(--accent-yellow)', lineHeight: 1.5 }}>
                      Enabling Auto Mode gives the {settings.agent_personality} agent permission to modify your GitHub issues directly.
                    </span>
                  </div>
                </Section>
              )}

              {activeTab === 'notifications' && (
                <Section title="Notifications" desc="Control how IssueAgent notifies you.">
                  <ToggleRow label="Email Notifications" desc="Get daily digests of AI activity" value={settings.notifications.email} onChange={v => updateNotify('email', v)} />
                  <ToggleRow label="Push Notifications" desc="Real-time alerts for critical issues" value={settings.notifications.push} onChange={v => updateNotify('push', v)} />
                </Section>
              )}

              {activeTab === 'github' && (
                <Section title="GitHub Integration" desc="Manage your GitHub connection.">
                  <div style={{ padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Github size={20} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Connected as {localStorage.getItem('gh_username')}</div>
                        <div style={{ fontSize: 11, color: 'var(--accent-green)' }}>Status: Active</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ fontSize: 12 }}>Disconnect</button>
                  </div>
                </Section>
              )}

              {activeTab === 'appearance' && (
                <Section title="Appearance" desc="Customize how IssueAgent looks on your screen.">
                  <div style={{ marginBottom: 28 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>Theme Mode</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { id: 'dark', label: 'Dark', icon: Moon, desc: 'Default GitHub dark' },
                        { id: 'midnight', label: 'Midnight', icon: Shield, desc: 'Deep black for OLED' },
                        { id: 'light', label: 'Light', icon: Sun, desc: 'Classic clean look' },
                      ].map(theme => (
                        <div 
                          key={theme.id}
                          onClick={() => updateAppearance('theme', theme.id)}
                          className="card"
                          style={{ 
                            padding: 16, 
                            cursor: 'pointer',
                            borderColor: appearance.theme === theme.id ? 'var(--accent-blue)' : 'var(--border-color)',
                            background: appearance.theme === theme.id ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                            position: 'relative'
                          }}
                        >
                          <theme.icon size={18} color={appearance.theme === theme.id ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{theme.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{theme.desc}</div>
                          {appearance.theme === theme.id && (
                            <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={10} color="#fff" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>Accent Color</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {ACCENT_COLORS.map(color => (
                        <motion.div 
                          key={color.name}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateAppearance('accent', color.color)}
                          style={{ 
                            width: 32, height: 32, borderRadius: '50%', 
                            background: color.color,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: appearance.accent === color.color ? '3px solid #fff' : 'none',
                            boxShadow: appearance.accent === color.color ? `0 0 12px ${color.color}` : 'none'
                          }}
                        >
                          {appearance.accent === color.color && <Check size={14} color="#fff" />}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <ToggleRow 
                    label="Compact Mode" 
                    desc="Reduce padding and text size for high-density information" 
                    value={appearance.compact} 
                    onChange={v => updateAppearance('compact', v)} 
                  />
                </Section>
              )}

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, desc, children }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{desc}</p>
      {children}
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <ToggleSwitch enabled={value} onChange={onChange} />
    </div>
  )
}
