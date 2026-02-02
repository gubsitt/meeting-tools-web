import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import './Login.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Login() {
  // เปลี่ยนชื่อตัวแปรจาก isAdminMode เป็น isEmailMode เพื่อความเข้าใจที่ถูกต้อง
  const [isEmailMode, setIsEmailMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`
  }

  const handleMicrosoftLogin = () => {
    window.location.href = `${API_URL}/api/auth/microsoft`
  }

  const handleLocalLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      }, { withCredentials: true })

      if (res.data.success) {
        window.location.href = '/home'
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Animation Variants
  const fadeVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }

  return (
    <div className="login-container">
      
      {/* --- LEFT SIDE: Image --- */}
      <div className="login-left">
        <div className="login-image-overlay" />
        <div className="login-quote">
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Explore the Horizon.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Experience the future of management with EXZY.
          </motion.p>
        </div>
      </div>

      {/* --- RIGHT SIDE: Login Form --- */}
      <div className="login-right">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <motion.div
          className="login-content"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <motion.div className="logo" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <img src="/Logo Exzy_Horizon[no_padding].png" alt="EXZY" className="logo-image" />
          </motion.div>

          {/* Title - ปรับข้อความให้เป็นกลาง */}
          <div className="login-header">
            <h2>{isEmailMode ? 'Sign In' : 'Welcome Back'}</h2>
            <p>{isEmailMode ? 'Enter your email and password' : 'Sign in to access your dashboard'}</p>
          </div>

          {/* Form / Buttons Switcher */}
          <div className="login-body" style={{ minHeight: '220px' }}>
            <AnimatePresence mode="wait">
              {!isEmailMode ? (
                // --- Social Login Mode ---
                <motion.div
                  key="oauth"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="login-buttons-wrapper"
                >
                  <button className="login-btn google-btn" onClick={handleGoogleLogin}>
                    <svg className="provider-icon" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  <button className="login-btn microsoft-btn" onClick={handleMicrosoftLogin}>
                    <svg className="provider-icon" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    <span>Sign in with Microsoft</span>
                  </button>
                </motion.div>
              ) : (
                // --- Email Login Mode (เปลี่ยนจาก Admin Form เป็น Form ทั่วไป) ---
                <motion.form
                  key="email-login"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleLocalLogin}
                  className="admin-form"
                >
                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="Email Address" /* เปลี่ยน Placeholder */
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="login-input"
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="login-input"
                    />
                  </div>

                  {error && <p className="error-msg">{error}</p>}

                  <button type="submit" className="login-btn submit-btn" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'} {/* เปลี่ยนข้อความปุ่ม */}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Link - ปรับข้อความ */}
          <div className="login-footer">
            <button 
              className="toggle-link" 
              onClick={() => {
                setIsEmailMode(!isEmailMode)
                setError('')
              }}
            >
              {isEmailMode ? '← Back to Social Login' : 'Sign in with Email'}
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  )
}