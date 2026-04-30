import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const SUPER_ADMIN_USERS_CACHE_PREFIX = 'super-admin:users'

export function getSuperAdminUsersSnapshot(params = {}) {
  const requestParams = {
    paginate: 1,
    ...params,
  }

  return peekCachedResource(buildCacheKey(SUPER_ADMIN_USERS_CACHE_PREFIX, requestParams))
}

export async function fetchSuperAdminUsers(params = {}, options = {}) {
  const requestParams = {
    paginate: 1,
    ...params,
  }

  return getCachedResource(
    buildCacheKey(SUPER_ADMIN_USERS_CACHE_PREFIX, requestParams),
    async () => {
      const res = await api.get('/api/super-admin/users', {
        params: requestParams,
      })
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
      force: options.force === true,
    }
  )
}

export async function createSuperAdminUser(payload) {
  const res = await api.post('/api/super-admin/users', payload)
  invalidateCache(SUPER_ADMIN_USERS_CACHE_PREFIX)
  return res.data
}

export async function updateSuperAdminUser(id, payload) {
  const res = await api.put(`/api/super-admin/users/${id}`, payload)
  invalidateCache(SUPER_ADMIN_USERS_CACHE_PREFIX)
  return res.data
}

export async function updateSuperAdminUserStatus(id, status) {
  const res = await api.patch(`/api/super-admin/users/${id}/status`, { status })
  invalidateCache(SUPER_ADMIN_USERS_CACHE_PREFIX)
  return res.data
}

export async function resetSuperAdminUserPassword(id) {
  const res = await api.patch(`/api/super-admin/users/${id}/password`)
  invalidateCache(SUPER_ADMIN_USERS_CACHE_PREFIX)
  return res.data
}

export async function deleteSuperAdminUser(id) {
  const res = await api.delete(`/api/super-admin/users/${id}`)
  invalidateCache(SUPER_ADMIN_USERS_CACHE_PREFIX)
  return res.data
}

