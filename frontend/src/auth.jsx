import { createContext, useContext, useEffect, useState } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Whenever the token changes, (re)load the current user.
  useEffect(() => {
    let cancelled = false
    async function loadUser() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/api/auth/me')
        if (!cancelled) setUser(data)
      } catch {
        // Token invalid/expired — clear it.
        localStorage.removeItem('token')
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadUser()
    return () => {
      cancelled = true
    }
  }, [token])

  async function authenticate(path, username, password) {
    const { data } = await api.post(path, { username, password })
    localStorage.setItem('token', data.access_token)
    const me = await api.get('/api/auth/me')
    setUser(me.data)
    setToken(data.access_token)
  }

  const login = (username, password) => authenticate('/api/auth/login', username, password)
  const register = (username, password) => authenticate('/api/auth/register', username, password)

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
