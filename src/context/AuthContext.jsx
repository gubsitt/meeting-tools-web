import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for auth query params first
    const params = new URLSearchParams(window.location.search)
    const authStatus = params.get('auth')
    
    if (authStatus === 'success') {
      // Auth successful, fetch user data
      checkAuth(true)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (authStatus === 'error') {
      // Auth failed
      setLoading(false)
      // Clean up URL
      window.history.replaceState({}, '', '/login')
      window.location.href = '/login'
    } else {
      // Normal auth check
      checkAuth()
    }
  }, [])

  const checkAuth = async (forceRefresh = false) => {
    try {
      const response = await authAPI.getCurrentUser()
      if (response.data.success) {
        setUser(response.data.data)
        // If this is after OAuth, redirect to home
        if (forceRefresh) {
          window.location.href = '/home'
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      // If backend not available or auth failed, just set user to null
      console.log('Not authenticated or backend unavailable')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const value = {
    user,
    loading,
    logout,
    refreshUser: checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
