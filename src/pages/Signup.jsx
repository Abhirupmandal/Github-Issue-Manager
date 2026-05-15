import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Zap, Shield, CheckCircle2, Eye, EyeOff, ArrowRight, Github, User, Mail, Lock } from 'lucide-react'
import { API_BASE } from '../config'

const features = [
  { icon: Bot, text: 'Autonomous issue triage and labeling' },
  { icon: Zap, text: 'Instant AI summaries and next steps' },
  { icon: Shield, text: 'Secure integration with GitHub OAuth' },
  { icon: CheckCircle2, text: 'Bulk actions via natural language' },
]

export default function Signup() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('gh_token', data.token)
        localStorage.setItem('gh_username', data.username)
        navigate('/dashboard')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/auth/github`)
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Login failed:', error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)',
    }}>
      {}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          padding: 60, position: 'relative', overflow: 'hidden',
        }}
      >
        {}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #1f6feb22 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        {}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px #1f6feb44',
          }}>
            <Zap size={28} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Issue<span className="gradient-text">Agent</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create your account to get started</p>
        </div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ width: '100%', maxWidth: 400, padding: 32 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28 }}>Get Started</h2>

          {error && (
            <div style={{ padding: '10px 14px', background: '#f8514915', border: '1px solid #f8514933', borderRadius: 8, color: '#f85149', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  type="text"
                  placeholder="johndoe"
                  required
                  style={{ paddingLeft: 38 }}
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  type="email"
                  placeholder="john@example.com"
                  required
                  style={{ paddingLeft: 38 }}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 14, marginTop: 10 }}
            >
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                : <><span>Create Account</span><ArrowRight size={16} /></>
              }
            </motion.button>
          </form>

          <div style={{ margin: '24px 0', position: 'relative', textAlign: 'center' }}>
            <div className="divider" />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-card)', padding: '0 12px', fontSize: 12, color: 'var(--text-muted)' }}>or join with</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGithubLogin}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', height: 42 }}
          >
            <Github size={16} /> GitHub
          </motion.button>
        </motion.div>

        <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>

      {}
      <div style={{
        width: '45%', background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: 60,
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 16 }}>
          Join the future of<br />repository <span className="gradient-text">Management</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
          {features.map(({ icon: Icon, text }, i) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1f6feb18, #a371f718)', border: '1px solid #1f6feb33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="var(--accent-blue)" />
              </div>
              <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
