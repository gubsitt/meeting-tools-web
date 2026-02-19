import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { TOAST_CONFIG } from './config/constants'
import Login from './pages/Login'
import UserManagement from './pages/UserManagement'
import Loading from './components/Loading'
import Layout from './components/Layout'
import Calendar from './pages/Calendar'
import UserEvents from './pages/UserEvents'
import CancelledEvents from './pages/CancelledEvents'
import MissSyncEvents from './pages/MissSyncEvents'
import ConfigFile from './pages/ConfigFile'
import ActivityLog from './pages/ActivityLog'

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

  return <Layout>{children}</Layout>
}

function App() {
  return (
    <Router>
      <Toaster
        position={TOAST_CONFIG.POSITION}
        toastOptions={{
          className: '',
          style: TOAST_CONFIG.STYLE,
          success: TOAST_CONFIG.SUCCESS,
          error: TOAST_CONFIG.ERROR,
        }}
      />
      <Routes>
        {/* Public Route */}
        <Route
          path="/login"
          element={<LoginRoute />}
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
          path="/activity-logs"
          element={
            <AdminRoute>
              <ActivityLog />
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

        <Route
          path="/config-file"
          element={
            <PrivateRoute>
              <ConfigFile />
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