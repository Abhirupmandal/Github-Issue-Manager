import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Zap, Shield, CheckCircle2, Eye, EyeOff, ArrowRight, Github } from 'lucide-react'
import { API_BASE } from '../config'

const features = [
  { icon: Bot, text: 'Autonomous issue triage and labeling' },
  { icon: Zap, text: 'Instant AI summaries and next steps' },
  { icon: Shield, text: 'Secure integration with GitHub OAuth' },
  { icon: CheckCircle2, text: 'Bulk actions via natural language' },
]

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
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
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Authentication failed. Please try again.')
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
        <div style={{ position: 'absolute', bottom: -100, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #a371f718 0%, transparent 70%)', pointerEvents: 'none' }} />

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
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>AI-Powered GitHub Issues Manager</p>
        </div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ width: '100%', maxWidth: 400, padding: 32 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Sign in to your workspace</p>

          {error && (
            <div style={{ padding: '10px 14px', background: '#f8514915', border: '1px solid #f8514933', borderRadius: 8, color: '#f85149', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                className="input"
                type="email"
                placeholder="alex@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: 40 }}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, color: 'var(--accent-blue)', cursor: 'pointer' }}>Forgot password?</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 14 }}
            >
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                : <><span>Sign In</span><ArrowRight size={16} /></>
              }
            </motion.button>
          </form>

          <div style={{ margin: '20px 0', position: 'relative', textAlign: 'center' }}>
            <div className="divider" />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-card)', padding: '0 12px', fontSize: 12, color: 'var(--text-muted)' }}>or continue with</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGithubLogin}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', height: 42 }}
          >
            <Github size={16} /> Sign in with GitHub
          </motion.button>
        </motion.div>

        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign up free</Link>
        </p>
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          width: '45%', background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: 60,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '20%', right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #a371f714, transparent 70%)', pointerEvents: 'none' }} />

        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 16 }}>
          Manage GitHub Issues<br />with <span className="gradient-text">AI Intelligence</span>
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
          IssueAgent automatically triages, analyzes, and resolves GitHub issues across your repositories using advanced AI.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1f6feb18, #a371f718)', border: '1px solid #1f6feb33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="var(--accent-blue)" />
              </div>
              <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{text}</span>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 50, padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Trusted by teams at</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {['Vercel', 'Linear', 'Stripe', 'GitHub'].map(c => (
              <span key={c} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>{c}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
