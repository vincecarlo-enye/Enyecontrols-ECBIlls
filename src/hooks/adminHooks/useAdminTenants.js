import { useCallback, useEffect, useState } from 'react'
import { createAdminTenant, deleteAdminTenant, fetchAdminTenants, fetchAvailableTenantUsers, updateAdminTenant } from '../../services/adminService/adminTenantService'

export function useAdminTenants() {
  const [tenants, setTenants] = useState([])
  const [tenantUsers, setTenantUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadTenants = useCallback(async (options = {}) => {
    const { silent = false } = options

    try {
      if (!silent) {
        setLoading(true)
      }
      setError('')

      const [tenantsRes, usersRes] = await Promise.all([
        fetchAdminTenants(),
        fetchAvailableTenantUsers(),
      ])

      setTenants(Array.isArray(tenantsRes?.data) ? tenantsRes.data : [])
      setTenantUsers(Array.isArray(usersRes?.data) ? usersRes.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load tenants.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  const addTenant = async (payload) => {
    try {
      setSubmitting(true)
      setError('')
      const res = await createAdminTenant(payload)
      const created = res?.data

      if (created) {
        setTenants((prev) => [created, ...prev])
      } else {
        await loadTenants()
      }

      return res
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create tenant.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const editTenant = async (id, payload) => {
    try {
      setSubmitting(true)
      setError('')
      const res = await updateAdminTenant(id, payload)
      const updated = res?.data

      if (updated) {
        setTenants((prev) =>
          prev.map((tenant) => (String(tenant.id) === String(id) ? updated : tenant))
        )
        await loadTenants()
      } else {
        await loadTenants()
      }

      return res
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update tenant.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const removeTenant = async (id) => {
    try {
      setSubmitting(true)
      setError('')
      const res = await deleteAdminTenant(id)
      setTenants((prev) => prev.filter((tenant) => String(tenant.id) !== String(id)))
      await loadTenants()
      return res
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete tenant.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  return {
    tenants,
    tenantUsers,
    loading,
    submitting,
    error,
    loadTenants,
    addTenant,
    editTenant,
    removeTenant,
  }
}
