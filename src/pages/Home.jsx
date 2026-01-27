import { motion } from 'framer-motion'
import { Link } from 'react-router-dom' // [เพิ่ม] ต้องใช้ Link
import { useAuth } from '../context/AuthContext'
import { LogOut, CheckCircle, Users, ShieldCheck } from 'lucide-react' // [เพิ่ม] icon ใหม่
import './Home.css'

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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle size={64} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Welcome to <span className="text-gradient">EXZY</span>
        </motion.h1>

        <motion.p
          className="welcome-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          You have successfully logged in!
        </motion.p>

        <motion.div
          className="user-info-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
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
        </motion.div>

        {/* ปุ่ม Actions */}
        <motion.div 
          className="action-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
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
        </motion.div>

      </motion.div>
    </div>
  )
}