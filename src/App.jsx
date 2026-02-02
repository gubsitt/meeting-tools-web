import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import UserManagement from './pages/UserManagement'
import Loading from './components/Loading'
import Layout from './components/Layout'
import Settings from './pages/Settings'
import Calendar from './pages/Calendar'
import UserEvents from './pages/UserEvents'
import CancelledEvents from './pages/CancelledEvents'
import MissSyncEvents from './pages/MissSyncEvents'

// Route สำหรับคนยังไม่ Login (ถ้า Login แล้วจะดีดไป Calendar)
function LoginRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (user) return <Navigate to="/calendar" replace />

  return <Login />
}

// Route สำหรับ User ทั่วไป (ต้อง Login เท่านั้น)
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" />

  // หุ้มด้วย Layout (Sidebar จะแสดงผลจากตรงนี้)
  return <Layout>{children}</Layout>
}

// Route สำหรับ Admin/SuperAdmin
function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" />

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/calendar" replace />
  }

  // หุ้มด้วย Layout
  return <Layout>{children}</Layout>
}

import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: 'rgba(22, 33, 62, 0.95)', // Dark Blue-Purple Theme
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(108, 92, 231, 0.2)', // Soft Purple Border
            borderLeft: '6px solid #6c5ce7', // Primary Purple
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
            fontSize: '0.95rem',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#00b894',
              secondary: '#fff',
            },
            style: {
              borderLeft: '6px solid #00b894', // Green
              background: 'rgba(22, 33, 62, 0.95)',
            }
          },
          error: {
            iconTheme: {
              primary: '#ff7675',
              secondary: '#fff',
            },
            style: {
              borderLeft: '6px solid #ff7675', // Red
              background: 'rgba(22, 33, 62, 0.95)',
            }
          },
        }}
      />
      <Routes>
        {/* Public Route */}
        <Route
          path="/login"
          element={<LoginRoute />}
        />

        {/* Route สำหรับหน้า Settings */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Admin Route (จัดการ User) */}
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <Calendar />
            </PrivateRoute>
          }
        />

        <Route
          path="/user-events"
          element={
            <PrivateRoute>
              <UserEvents />
            </PrivateRoute>
          }
        />

        <Route
          path="/cancelled-events"
          element={
            <PrivateRoute>
              <CancelledEvents />
            </PrivateRoute>
          }
        />

        <Route
          path="/miss-sync-events"
          element={
            <PrivateRoute>
              <MissSyncEvents />
            </PrivateRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Catch all - 404 */}
        <Route path="*" element={<Navigate to="/calendar" />} />
      </Routes>
    </Router>
  )
}

export default App