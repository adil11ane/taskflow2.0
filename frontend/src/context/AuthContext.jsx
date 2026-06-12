import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const saveAuth = useCallback((data) => {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
    } else {
      // Minimal user from token
      const payload = JSON.parse(atob(data.access_token.split('.')[1]))
      const u = { id: payload.user_id, email: payload.email || '' }
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
    }
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await authApi.logout(refresh) } catch {}
    localStorage.clear()
    setUser(null)
  }, [])

  const isAuthenticated = !!localStorage.getItem('access_token')

  return (
    <AuthContext.Provider value={{ user, saveAuth, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
