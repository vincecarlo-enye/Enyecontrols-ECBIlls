import { createContext, useContext, useState, useCallback } from 'react'
import { can, canModifyUser, ROLES } from '@/permissions'
import INITIAL_MOCK_USERS from '@/data/users.json'

const AuthContext = createContext()

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('sb_auth_user'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [users, setUsers] = useState(() => {
    try { const s = localStorage.getItem('sb_users_list'); return s ? JSON.parse(s) : INITIAL_MOCK_USERS } catch { return INITIAL_MOCK_USERS }
  })

  const persistUsers = useCallback((list) => {
    localStorage.setItem('sb_users_list', JSON.stringify(list))
    setUsers(list)
  }, [])

  const login = (email, password) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!found) return null
    if (found.status === 'suspended') return { error: 'suspended', message: 'Your account has been suspended. Please contact the Super Admin.' }
    const { password: _pw, ...safe } = found
    setUser(safe); localStorage.setItem('sb_auth_user', JSON.stringify(safe))
    return safe
  }

  const logout = () => { setUser(null); localStorage.removeItem('sb_auth_user') }

  const addUser = useCallback((actorRole, userData) => {
    if (!can(actorRole, 'users:create')) return { error: 'Unauthorized: Only Super Admin can create users.' }
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) return { error: 'A user with this email already exists.' }
    const newUser = { ...userData, id: Date.now(), initials: getInitials(userData.name), status: 'active', password: userData.password || 'change123' }
    persistUsers([...users, newUser])
    return { success: true, user: newUser }
  }, [users, persistUsers])

  const editUser = useCallback((actorRole, userId, data) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { error: 'User not found.' }
    if (!canModifyUser(actorRole, target.role)) return { error: 'Unauthorized: Cannot modify a Super Admin account.' }
    const updated = users.map(u => {
      if (u.id !== userId) return u
      const merged = { ...u, ...data }
      if (data.name) merged.initials = getInitials(data.name)
      return merged
    })
    persistUsers(updated)
    if (user && user.id === userId) {
      const { password: _pw, ...safe } = updated.find(u => u.id === userId)
      setUser(safe); localStorage.setItem('sb_auth_user', JSON.stringify(safe))
    }
    return { success: true }
  }, [users, user, persistUsers])

  const deleteUser = useCallback((actorRole, userId) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { error: 'User not found.' }
    if (!canModifyUser(actorRole, target.role)) return { error: 'Unauthorized: Cannot delete a Super Admin account.' }
    persistUsers(users.filter(u => u.id !== userId))
    return { success: true }
  }, [users, persistUsers])

  const suspendUser = useCallback((actorRole, userId) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { error: 'User not found.' }
    if (!can(actorRole, 'users:suspend')) return { error: 'Unauthorized.' }
    if (!canModifyUser(actorRole, target.role)) return { error: 'Cannot suspend a Super Admin account.' }
    const newStatus = target.status === 'suspended' ? 'active' : 'suspended'
    return editUser(actorRole, userId, { status: newStatus })
  }, [users, editUser])

  const resetPassword = useCallback((actorRole, userId, newPassword) => {
    if (!can(actorRole, 'users:reset-password')) return { error: 'Unauthorized.' }
    if (!users.find(u => u.id === userId)) return { error: 'User not found.' }
    persistUsers(users.map(u => u.id === userId ? { ...u, password: newPassword } : u))
    return { success: true }
  }, [users, persistUsers])

  return (
    <AuthContext.Provider value={{ user, users, login, logout, addUser, editUser, deleteUser, suspendUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
