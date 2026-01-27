import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { 
  Home, 
  Users, 
  Settings, 
  Calendar, 
  LogOut, 
  ChevronLeft,
  Menu 
} from 'lucide-react'
import './Sidebar.css'
// import { useState } from 'react' // ❌ ไม่ต้องใช้ useState ในนี้แล้ว

// 👇 [แก้ไขสำคัญ] ต้องใส่ { isCollapsed, setIsCollapsed } ในวงเล็บ
export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // ❌ ลบ state ตัวเก่าออก (เพราะรับมาจาก Layout แล้ว)
  // const [isCollapsed, setIsCollapsed] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const menuItems = [
    { path: '/home', icon: Home, label: 'Dashboard' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    ...(isAdmin ? [{ path: '/users', icon: Users, label: 'User Management' }] : []),
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  const showBackButton = location.pathname !== '/home'

  return (
    <>
      <motion.aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
        // ลบ initial/animate ของ framer-motion ออกชั่วคราวเพื่อให้ transition ของ CSS ทำงานเนียนกว่ากับ Layout
      >
        {/* Logo Section */}
        <div className="sidebar-header">
          <img src="/Logo Exzy_Horizon[no_padding].png" alt="EXZY" />
        </div>

        {/* Back Button */}
        {showBackButton && (
          <div className="back-btn-container">
            <button onClick={() => navigate(-1)} className="back-btn">
              <ChevronLeft size={20} />
              {!isCollapsed && <span>Back</span>}
            </button>
          </div>
        )}

        {/* Menu Items */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="active-pill" 
                  className="active-pill" 
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile">
             <div className="avatar-small">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Avatar" />
                ) : (
                  <span>{user?.displayName?.[0]}</span>
                )}
             </div>
             {!isCollapsed && (
               <div className="user-details">
                 <p className="user-name">{user?.displayName}</p>
                 <p className="user-role">{user?.role}</p>
               </div>
             )}
          </div>
          
          <button onClick={logout} className="logout-btn-sidebar">
            <LogOut size={20} />
          </button>
        </div>

        {/* Collapse Toggle */}
        <button 
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu size={16} />
        </button>
      </motion.aside>
    </>
  )
}