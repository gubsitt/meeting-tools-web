import { motion } from 'framer-motion'
import { Link } from 'react-router-dom' // [เพิ่ม] ต้องใช้ Link
import { useAuth } from '../context/AuthContext'
import { LogOut, CheckCircle, Users, ShieldCheck } from 'lucide-react' // [เพิ่ม] icon ใหม่
import InfoTooltip from '../components/InfoTooltip'
import '../styles/pages/Home.css'

export default function Home() {
  const { user, logout } = useAuth()

  // เช็คสิทธิ์ Admin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  // Helper เลือกข้อความตาม Role
  const getRoleLabel = (role) => {
    if (role === 'superadmin') return '⚡ Super Admin'
    if (role === 'admin') return '👑 Admin'
    return '👤 User'
  }

  return (
    <div className="home-container">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <motion.div
        className="home-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <InfoTooltip
            title="About Home Page"
            align="right"
            content={
              <>
                <p>Welcome to the EXZY Meeting Tools dashboard. This page shows your current session information.</p>
                <ul>
                  <li><strong>Profile Data:</strong> Retrieved securely from the session context upon successful login via Microsoft/Google OAuth or Local Admin.</li>
                  <li><strong>Role Access:</strong> Your displayed role determines which features and pages you can access in the sidebar.</li>
                </ul>
              </>
            }
          />
        </div>

        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle size={64} />
        </motion.div>

        <h1>
          Welcome to <span className="text-gradient">EXZY</span>
        </h1>

        <p className="welcome-message">
          You have successfully logged in!
        </p>

        <div className="user-info-card">
          <div className="user-avatar-large">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                className="avatar-img"
              />
            ) : (
              <span>{user?.displayName?.[0] || 'U'}</span>
            )}
          </div>

          {/* แก้ไขให้แสดง displayName ถ้ามี */}
          <h2>{user?.displayName || user?.name}</h2>
          <p>{user?.email}</p>

          <span className={`role-badge ${user?.role}`}>
            {getRoleLabel(user?.role)}
          </span>
        </div>

        {/* ปุ่ม Actions */}
        <div className="action-buttons">
          {/* [เพิ่ม] ปุ่ม Manage Users (แสดงเฉพาะ Admin/SuperAdmin) */}
          {isAdmin && (
            <Link to="/users" className="action-btn admin-btn">
              <Users size={20} />
              <span>Manage Users</span>
            </Link>
          )}

          <button
            className="action-btn logout-btn"
            onClick={logout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

      </motion.div>
    </div>
  )
}