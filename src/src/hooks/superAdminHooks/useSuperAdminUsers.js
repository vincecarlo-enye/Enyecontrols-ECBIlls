import { useCallback, useEffect, useState } from 'react'
import {
  createSuperAdminUser,
  deleteSuperAdminUser,
  fetchSuperAdminUsers,
  getSuperAdminUsersSnapshot,
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

const DEFAULT_PER_PAGE = 10
const DEFAULT_META = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
}

export function useSuperAdminUsers() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const initialSnapshot = getSuperAdminUsersSnapshot({
    page: 1,
    per_page: DEFAULT_PER_PAGE,
  })
  const initialUsers = normalizeUsers(Array.isArray(initialSnapshot?.data) ? initialSnapshot.data : [])
  const hasInitialUsers = initialUsers.length > 0
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState(!hasInitialUsers)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState(initialSnapshot?.meta || DEFAULT_META)

  const loadUsers = useCallback(async (nextPage = page, nextPerPage = perPage) => {
    try {
      setLoading((current) => current || !hasInitialUsers)
      setError('')
      const response = await fetchSuperAdminUsers({
        page: nextPage,
        per_page: nextPerPage,
      })
      setUsers(normalizeUsers(Array.isArray(response?.data) ? response.data : []))
      setMeta(response?.meta || {
        ...DEFAULT_META,
        current_page: nextPage,
        per_page: nextPerPage,
      })
    } catch (err) {
      setUsers([])
      setMeta(DEFAULT_META)
      setError(err?.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [page, perPage])

  useEffect(() => {
    loadUsers(page, perPage)
  }, [loadUsers, page, perPage])

  const createUser = useCallback(async (payload) => {
    try {
      setSaving(true)
      setError('')
      await createSuperAdminUser(payload)
      await loadUsers(1, perPage)
      setPage(1)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to create user.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers, perPage])

  const updateUser = useCallback(async (id, payload) => {
    try {
      setSaving(true)
      setError('')
      await updateSuperAdminUser(id, payload)
      await loadUsers(page, perPage)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update user.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers, page, perPage])

  const toggleUserStatus = useCallback(async (user) => {
    try {
      setSaving(true)
      setError('')
      const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
      await updateSuperAdminUserStatus(user.id, nextStatus)
      await loadUsers(page, perPage)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update user status.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers, page, perPage])

  const removeUser = useCallback(async (id) => {
    try {
      setSaving(true)
      setError('')
      await deleteSuperAdminUser(id)
      const nextPage = page > 1 && users.length === 1 ? page - 1 : page
      if (nextPage !== page) setPage(nextPage)
      await loadUsers(nextPage, perPage)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete user.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers, page, perPage, users.length])

  const resetPassword = useCallback(async (id) => {
    try {
      setSaving(true)
      setError('')
      await resetSuperAdminUserPassword(id)
      await loadUsers(page, perPage)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to reset password.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadUsers, page, perPage])

  return {
    users,
    loading,
    saving,
    error,
    meta,
    page,
    perPage,
    setPage,
    setPerPage,
    reload: loadUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    removeUser,
    resetPassword,
  }
}
