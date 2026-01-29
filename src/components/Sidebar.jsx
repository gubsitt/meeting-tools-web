import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  Users,
  Settings,
  Calendar,
  LogOut,
  Menu,
  UserCircle2
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [imgError, setImgError] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const menuItems = [
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/user-events', icon: UserCircle2, label: 'User Events' },
    ...(isAdmin ? [{ path: '/users', icon: Users, label: 'User Management' }] : []),
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <>
      <motion.aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <img src="/Logo Exzy_Horizon[no_padding].png" alt="EXZY" />
        </div>

        {/* Menu Items */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)} // Close on navigate
            >
              <item.icon size={20} />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
              {location.pathname === item.path && (
                <motion.div layoutId="active-pill" className="active-pill" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-small">
              {user?.profilePicture && !imgError ? (
                <img
                  src={user.profilePicture}
                  alt="Avatar"
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{user?.displayName?.[0]?.toUpperCase()}</span>
              )}
            </div>
            {/* On mobile, always show details if open (css handles display:flex via !important override in .collapsed)
                But logic here: if !isCollapsed show details. 
                CSS takes care of mobile showing even if collapsed is true, 
                but we need 'user-details' to exist in DOM. 
                Wait, !isCollapsed checks react state. 
                Let's reuse the same logic: !isCollapsed && ... 
                But in mobile, sidebar might be technically 'collapsed' on desktop state but 'open' on mobile.
                Let's rely on CSS hiding/showing. Render it always? No, simpler to keep logic matched with desktop first. 
                The CSS added: .sidebar.collapsed .user-details { display: flex !important } on mobile.
                So we must render it if isMobileOpen OR !isCollapsed.
             */}
            {(!isCollapsed || isMobileOpen) && (
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
        <button className="collapse-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Menu size={16} />
        </button>
      </motion.aside>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'show' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />
    </>
  )
}