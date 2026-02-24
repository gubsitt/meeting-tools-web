import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Use a ref to queue a redirect path after auth resolves
  const pendingRedirect = useRef(null)

  useEffect(() => {
    // Check for auth query params first (OAuth callback)
    const params = new URLSearchParams(window.location.search)
    const authStatus = params.get('auth')

    if (authStatus === 'success') {
      // Clean up URL first
      window.history.replaceState({}, '', window.location.pathname)
      // Auth successful — fetch user, then navigate to calendar (no full reload)
      pendingRedirect.current = '/calendar'
      checkAuth()
    } else if (authStatus === 'error') {
      // Clean up URL and go to login
      window.history.replaceState({}, '', '/login')
      setLoading(false)
    } else {
      // Normal auth check
      checkAuth()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      if (response.data.success) {
        setUser(response.data.data)
        // If we have a pending redirect after OAuth, do it via history API
        // (avoids full page reload; React Router will pick up the new path)
        if (pendingRedirect.current) {
          window.history.pushState({}, '', pendingRedirect.current)
          pendingRedirect.current = null
        }
      } else {
        setUser(null)
      }
    } catch {
      // Not authenticated or backend unavailable — silently fail
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
      setUser(null)
      // Use replace so the user can't navigate back to a protected page
      window.history.replaceState({}, '', '/login')
      window.location.reload() // minimal reload only on logout to clear all state
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
