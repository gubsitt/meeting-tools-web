import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Trash2, User, Shield, ShieldAlert, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import './UserManagement.css' // เดี๋ยวสร้างไฟล์นี้ต่อ

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)

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
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await axios.delete(`${API_URL}/api/auth/users/${userId}`, { withCredentials: true })
      setUsers(users.filter(u => u._id !== userId))
      toast.success('User deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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
                            onClick={() => handleDelete(user._id)}
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
    </div>
  )
}