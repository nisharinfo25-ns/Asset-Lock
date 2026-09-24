import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../lib/api'

const AuthContext = createContext(null)

export const useAuthContext = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (token) {
        // Pre-fill from cache for fast UI feedback
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)) } catch {}
        }
        // Verify with backend /api/auth/me
        try {
          const res = await authAPI.getMe()
          const verifiedUser = res.data.data.user
          localStorage.setItem('user', JSON.stringify(verifiedUser))
          setUser(verifiedUser)
        } catch (err) {
          console.warn('Session verification failed:', err.message)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { user, token } = res.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const register = async (data) => {
    const res = await authAPI.register(data)
    const { user, token } = res.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = async () => {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
