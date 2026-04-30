import api from "../../lib/api"
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'
import { invalidateAdminDirectory } from './adminDirectoryStore'

const ADMIN_UNITS_CACHE_PREFIX = 'admin:units'

function getStoredRole() {
  try {
    const raw = localStorage.getItem('sb_auth_user')
    const user = raw ? JSON.parse(raw) : null
    return user?.role || null
  } catch {
    return null
  }
}

export function getAdminUnitsSnapshot(params = {}) {
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_UNITS_CACHE_PREFIX, { role, ...params }))
}

export async function fetchAdminUnits(params = {}, options = {}) {
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_UNITS_CACHE_PREFIX, { role, ...params }),
    async () => {
      const res = await api.get('/api/admin/units', { params })
      return res.data
    },
    {
      ttl: 60000,
      force: options?.force === true,
      persist: true,
    }
  )
}

export async function fetchAdminUnit(id) {
  const res = await api.get(`/api/admin/units/${id}`)
  return res.data
}

export async function createAdminUnit(payload) {
  const res = await api.post('/api/admin/units', payload)
  invalidateCache(ADMIN_UNITS_CACHE_PREFIX)
  invalidateAdminDirectory(['units', 'tenants'])
  return res.data
}

export async function updateAdminUnit(id, payload) {
  const res = await api.put(`/api/admin/units/${id}`, payload)
  invalidateCache(ADMIN_UNITS_CACHE_PREFIX)
  invalidateAdminDirectory(['units', 'tenants'])
  return res.data
}

export async function deleteAdminUnit(id) {
  const res = await api.delete(`/api/admin/units/${id}`)
  invalidateCache(ADMIN_UNITS_CACHE_PREFIX)
  invalidateAdminDirectory(['units', 'tenants'])
  return res.data
}
