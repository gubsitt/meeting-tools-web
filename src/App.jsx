import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import UserManagement from './pages/UserManagement'
import Loading from './components/Loading'
import Layout from './components/Layout'
import Settings from './pages/Settings'
import Calendar from './pages/Calendar'
import UserEvents from './pages/UserEvents'

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

function App() {
  return (
    <Router>
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

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Catch all - 404 */}
        <Route path="*" element={<Navigate to="/calendar" />} />
      </Routes>
    </Router>
  )
}

export default App