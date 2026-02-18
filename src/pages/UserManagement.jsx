import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, User, Shield, ShieldAlert, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import '../styles/pages/UserManagement.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function UserManagement() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { userId, userName }

  // ดึงข้อมูล Users
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/users`, { withCredentials: true })
      if (res.data.success) {
        setUsers(res.data.data)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch users')
      setError('Failed to fetch users. You might not have permission.')
    } finally {
      setLoading(false)
    }
  }

  // เปลี่ยน Role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${API_URL}/api/auth/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      )
      // อัปเดตข้อมูลใน State ทันทีไม่ต้องโหลดใหม่
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u))
      toast.success(`Updated role to ${newRole}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  // ลบ User
  const handleDelete = (userId, userName) => {
    setDeleteConfirm({ userId, userName })
  }

  const confirmDelete = async () => {
    const { userId } = deleteConfirm
    setDeleteConfirm(null)

    try {
      await axios.delete(`${API_URL}/api/auth/users/${userId}`, { withCredentials: true })
      setUsers(users.filter(u => u._id !== userId))
      toast.success('User deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // Check if user has admin privileges
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchUsers()
    } else if (user) {
      // User is authenticated but not admin
      setLoading(false)
      setAccessDenied(true)
      setError('Access denied. Admin privileges required.')
    } else {
      // User is not authenticated
      setLoading(false)
      setAccessDenied(true)
      setError('Please login to access this page.')
    }
  }, [user, authLoading])

  // Filter สำหรับช่องค้นหา
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper สำหรับเลือก Icon ตาม Role
  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin': return <ShieldAlert size={16} color="#ff6b6b" />
      case 'admin': return <Shield size={16} color="#4cd137" />
      default: return <User size={16} color="#a4b0be" />
    }
  }

  return (
    <div className="page-container">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="content-wrapper">
        <motion.div
          className="header-section"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>User Management</h1>
          <p>Manage system access and roles</p>
        </motion.div>

        {/* Search Bar */}
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table Card */}
        <motion.div
          className="table-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : accessDenied ? (
            <div className="error" style={{ textAlign: 'center', padding: '3rem' }}>
              <ShieldAlert size={48} style={{ color: '#ff6b6b', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Access Denied</h3>
              <p style={{ color: '#a4b0be' }}>
                This page requires administrator privileges.
                <br />
                Please contact your system administrator for access.
              </p>
            </div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Provider</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td data-label="User">
                        <div className="user-info">
                          <img
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.displayName}`}
                            alt={user.displayName}
                            className="avatar"
                          />
                          <span>{user.displayName}</span>
                        </div>
                      </td>
                      <td data-label="Email">{user.email}</td>
                      <td data-label="Provider">
                        <span className={`provider-badge ${user.provider}`}>
                          {user.provider}
                        </span>
                      </td>
                      <td data-label="Role">
                        <div className="role-selector">
                          {getRoleIcon(user.role)}
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={user.role === 'superadmin'} // ห้ามแก้ Super Admin
                            className={`role-select ${user.role}`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>
                      </td>
                      <td data-label="Actions">
                        {user.role !== 'superadmin' && (
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(user._id, user.name)}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Modal */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 30, 45, 0.98), rgba(20, 20, 35, 0.98))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '20px',
                  padding: '32px',
                  maxWidth: '450px',
                  width: '90%',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
              >
                <h3 style={{
                  color: '#ff6b6b',
                  fontSize: '1.5rem',
                  marginBottom: '16px',
                  fontWeight: 700,
                }}>
                  Delete User
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  marginBottom: '24px',
                  lineHeight: '1.6',
                }}>
                  Are you sure you want to delete <strong style={{ color: '#fff' }}>"{deleteConfirm?.userName}"</strong>?
                  <br />
                  This action cannot be undone.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}