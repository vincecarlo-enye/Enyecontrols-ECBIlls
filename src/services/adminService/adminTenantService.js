import api from "../../lib/api"
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'
import { invalidateAdminDirectory } from './adminDirectoryStore'

const ADMIN_TENANTS_CACHE_PREFIX = 'admin:tenants'
const ADMIN_TENANT_USERS_CACHE_PREFIX = 'admin:tenant-users'

function getStoredRole() {
  try {
    const raw = localStorage.getItem('sb_auth_user')
    const user = raw ? JSON.parse(raw) : null
    return user?.role || null
  } catch {
    return null
  }
}

export function getAdminTenantsSnapshot(params = {}) {
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_TENANTS_CACHE_PREFIX, { role, ...params }))
}

export async function fetchAdminTenants(params = {}, options = {}) {
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_TENANTS_CACHE_PREFIX, { role, ...params }),
    async () => {
      const res = await api.get('/api/admin/tenants', { params })
      return res.data
    },
    {
      ttl: 60000,
      force: options?.force === true,
      persist: true,
    }
  )
}

export async function fetchAdminTenant(id) {
  const res = await api.get(`/api/admin/tenants/${id}`)
  return res.data
}

export async function fetchAvailableTenantUsers() {
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_TENANT_USERS_CACHE_PREFIX, { role }),
    async () => {
      const res = await api.get('/api/admin/tenant-users')
      return res.data
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}


export async function createAdminTenant(payload) {
  const res = await api.post('/api/admin/tenants', payload)
  invalidateCache([ADMIN_TENANTS_CACHE_PREFIX, ADMIN_TENANT_USERS_CACHE_PREFIX])
  invalidateAdminDirectory(['tenants', 'units'])
  return res.data
}

export async function updateAdminTenant(id, payload) {
  const res = await api.put(`/api/admin/tenants/${id}`, payload)
  invalidateCache([ADMIN_TENANTS_CACHE_PREFIX, ADMIN_TENANT_USERS_CACHE_PREFIX])
  invalidateAdminDirectory(['tenants', 'units'])
  return res.data
}

export async function deleteAdminTenant(id) {
  const res = await api.delete(`/api/admin/tenants/${id}`)
  invalidateCache([ADMIN_TENANTS_CACHE_PREFIX, ADMIN_TENANT_USERS_CACHE_PREFIX])
  invalidateAdminDirectory(['tenants', 'units'])
  return res.data
}
