import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Save, Camera } from 'lucide-react'
import './Settings.css' // เดี๋ยวสร้างไฟล์นี้ต่อ

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Settings() {
  const { user, loading: authLoading } = useAuth()
  
  // Form States
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI States
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'security'
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  // Load initial data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || '')
    }
  }, [user])

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // (สมมติว่ามี Route นี้ใน Backend - ถ้ายังไม่มีเดี๋ยวเราไปเพิ่ม)
      const res = await axios.patch(`${API_URL}/api/users/me`, {
        displayName
      }, { withCredentials: true })

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully! (Please refresh to see changes)' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' })
    } finally {
      setLoading(false)
    }
  }

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await axios.patch(`${API_URL}/api/auth/update-password`, {
        currentPassword,
        newPassword
      }, { withCredentials: true })

      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  // ถ้าเป็น Google/Microsoft User จะไม่มีรหัสผ่านให้เปลี่ยน
  const isLocalUser = user?.provider === 'local'

  return (
    <div className="settings-container">
      <motion.div 
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Account Settings</h1>
        <p>Manage your profile and security preferences</p>
      </motion.div>

      <div className="settings-layout">
        {/* --- Sidebar Tabs --- */}
        <div className="settings-sidebar">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
          
          {isLocalUser && (
            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} />
              <span>Security</span>
            </button>
          )}
        </div>

        {/* --- Content Area --- */}
        <motion.div 
          className="settings-content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          key={activeTab} // Animation เมื่อเปลี่ยน Tab
        >
          {/* Message Alert */}
          {message.text && (
            <div className={`alert-box ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* === PROFILE TAB === */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-section">
                <h2>Public Profile</h2>
                
                <div className="profile-upload">
                  <div className="avatar-preview">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Avatar" />
                    ) : (
                      <span>{user?.displayName?.[0]}</span>
                    )}
                  </div>
                  <div className="upload-btn-wrapper">
                     <button type="button" className="btn-secondary" disabled>
                        <Camera size={16} /> Change Photo
                     </button>
                     <span className="helper-text">Image upload coming soon</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="input-field disabled"
                  />
                  <span className="helper-text">Email cannot be changed</span>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* === SECURITY TAB === */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <div className="form-section">
                <h2>Change Password</h2>
                
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    <Save size={18} /> Update Password
                  </button>
                </div>
              </div>
            </form>
          )}

        </motion.div>
      </div>
    </div>
  )
}