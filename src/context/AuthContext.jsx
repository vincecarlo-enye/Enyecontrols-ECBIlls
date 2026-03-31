import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { can, canModifyUser } from '@/permissions'
import INITIAL_MOCK_USERS from '@/data/users.json'
import api from '../lib/api'

const AuthContext = createContext()

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('sb_auth_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })

  const [users, setUsers] = useState(() => {
    try {
      const s = localStorage.getItem('sb_users_list')
      return s ? JSON.parse(s) : INITIAL_MOCK_USERS
    } catch {
      return INITIAL_MOCK_USERS
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(() => !user && !!localStorage.getItem('auth_token'))

  useEffect(() => {
    if (user) {
      localStorage.setItem('sb_auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('sb_auth_user')
    }
  }, [user])

  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token)
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      localStorage.removeItem('auth_token')
      delete api.defaults.headers.common.Authorization
    }
  }, [token])

  useEffect(() => {
    const restoreAuth = async () => {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('sb_auth_user')

      if (!savedToken) {
        setLoading(false)
        return
      }

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          setLoading(false)
        } catch {
          //
        }
      }

      try {
        setToken(savedToken)
        api.defaults.headers.common.Authorization = `Bearer ${savedToken}`

        const response = await api.get('/api/user')
        setUser(response.data)
      } catch {
        setUser(null)
        setToken(null)
        localStorage.removeItem('sb_auth_user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('omni_token')
        delete api.defaults.headers.common.Authorization
      } finally {
        setLoading(false)
      }
    }

    restoreAuth()
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    const response = await api.get('/api/user')
    setUser(response.data)
    return response.data
  }, [])

  const updateCurrentUser = useCallback((nextUser) => {
    setUser(nextUser)
    return nextUser
  }, [])

  const persistUsers = useCallback((list) => {
    localStorage.setItem('sb_users_list', JSON.stringify(list))
    setUsers(list)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/login', { email, password })
      const data = response.data

      if (!data?.token) {
        return { error: true, message: 'Invalid login response.' }
      }

      localStorage.setItem('auth_token', data.token)
      setToken(data.token)
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`

      
      const meResponse = await api.get('/api/user')
      const me = meResponse.data

      setUser(me)

      return me
    } catch (error) {
      return {
        error: true,
        message:
          error?.response?.data?.message ||
          'Invalid email or password.',
      }
    }
  }

  const logout = async () => {
    const activeToken = token || localStorage.getItem('auth_token')

    setUser(null)
    setToken(null)
    setLoading(false)
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem('sb_auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('omni_token')

    if (!activeToken) return

    try {
      await api.post(
        '/api/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        }
      )
    } catch {
      //
    }
  }

  const addUser = useCallback((actorRole, userData) => {
    if (!can(actorRole, 'users:create')) return { error: 'Unauthorized: Only Super Admin can create users.' }
    if (users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase())) return { error: 'A user with this email already exists.' }
    const newUser = {
      ...userData,
      id: Date.now(),
      initials: getInitials(userData.name),
      status: 'active',
      password: userData.password || 'change123',
    }
    persistUsers([...users, newUser])
    return { success: true, user: newUser }
  }, [users, persistUsers])

  const editUser = useCallback((actorRole, userId, data) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return { error: 'User not found.' }
    if (!canModifyUser(actorRole, target.role)) return { error: 'Unauthorized: Cannot modify a Super Admin account.' }

    const updated = users.map((u) => {
      if (u.id !== userId) return u
      const merged = { ...u, ...data }
      if (data.name) merged.initials = getInitials(data.name)
      return merged
    })

    persistUsers(updated)

    if (user && user.id === userId) {
      const { password: _pw, ...safe } = updated.find((u) => u.id === userId)
      setUser(safe)
      localStorage.setItem('sb_auth_user', JSON.stringify(safe))
    }

    return { success: true }
  }, [users, user, persistUsers])

  const deleteUser = useCallback((actorRole, userId) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return { error: 'User not found.' }
    if (!canModifyUser(actorRole, target.role)) return { error: 'Unauthorized: Cannot delete a Super Admin account.' }
    persistUsers(users.filter((u) => u.id !== userId))
    return { success: true }
  }, [users, persistUsers])

  const suspendUser = useCallback((actorRole, userId) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return { error: 'User not found.' }
    if (!can(actorRole, 'users:suspend')) return { error: 'Unauthorized.' }
    if (!canModifyUser(actorRole, target.role)) return { error: 'Cannot suspend a Super Admin account.' }
    const newStatus = target.status === 'suspended' ? 'active' : 'suspended'
    return editUser(actorRole, userId, { status: newStatus })
  }, [users, editUser])

  const resetPassword = useCallback((actorRole, userId, newPassword) => {
    if (!can(actorRole, 'users:reset-password')) return { error: 'Unauthorized.' }
    if (!users.find((u) => u.id === userId)) return { error: 'User not found.' }
    persistUsers(users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)))
    return { success: true }
  }, [users, persistUsers])

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        refreshCurrentUser,
        updateCurrentUser,
        login,
        logout,
        addUser,
        editUser,
        deleteUser,
        suspendUser,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
