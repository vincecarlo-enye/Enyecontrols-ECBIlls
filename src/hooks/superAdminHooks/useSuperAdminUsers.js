import { useCallback, useEffect, useState } from 'react'
import {
  createSuperAdminUser,
  deleteSuperAdminUser,
  fetchSuperAdminUsers,
  resetSuperAdminUserPassword,
  updateSuperAdminUser,
  updateSuperAdminUserStatus,
} from '@/services/superAdminService/superAdminUserService'

function normalizeUsers(rows = []) {
  return rows.map((user) => ({
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'tenant',
    title: user.title || '',
    status: user.status || 'active',
    initials: user.initials || '',
  }))
}

export function useSuperAdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetchSuperAdminUsers()
      setUsers(normalizeUsers(Array.isArray(response?.data) ? response.data : []))
    } catch (err) {
      setUsers([])
      setError(err?.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const createUser = useCallback(async (payload) => {
    try {
      setSaving(true)
      setError('')
      await createSuperAdminUser(payload)
      await loadUsers()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to create user.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers])

  const updateUser = useCallback(async (id, payload) => {
    try {
      setSaving(true)
      setError('')
      await updateSuperAdminUser(id, payload)
      await loadUsers()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update user.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers])

  const toggleUserStatus = useCallback(async (user) => {
    try {
      setSaving(true)
      setError('')
      const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
      await updateSuperAdminUserStatus(user.id, nextStatus)
      await loadUsers()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update user status.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers])

  const removeUser = useCallback(async (id) => {
    try {
      setSaving(true)
      setError('')
      await deleteSuperAdminUser(id)
      await loadUsers()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete user.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers])

  const resetPassword = useCallback(async (id, password) => {
    try {
      setSaving(true)
      setError('')
      await resetSuperAdminUserPassword(id, password)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to reset password.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    users,
    loading,
    saving,
    error,
    reload: loadUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    removeUser,
    resetPassword,
  }
}
