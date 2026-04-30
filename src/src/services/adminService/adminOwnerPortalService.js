import api from '@/lib/api'
import { buildCacheKey, getCachedResource, peekCachedResource } from '@/lib/requestCache'

const ADMIN_OWNER_PORTAL_CACHE_PREFIX = 'admin:owner-portal'
const ADMIN_OWNER_PORTAL_SERVICE_STATUS_CACHE_PREFIX = 'admin:owner-portal:service-status'

export function getAdminOwnerPortalSnapshot(month) {
  const params = month ? { month } : {}
  return peekCachedResource(buildCacheKey(ADMIN_OWNER_PORTAL_CACHE_PREFIX, params))
}

export function getAdminOwnerPortalServiceStatusSnapshot() {
  return peekCachedResource(buildCacheKey(ADMIN_OWNER_PORTAL_SERVICE_STATUS_CACHE_PREFIX))
}

export async function fetchAdminOwnerPortal(month) {
  const params = month ? { month } : {}
  return getCachedResource(
    buildCacheKey(ADMIN_OWNER_PORTAL_CACHE_PREFIX, params),
    async () => {
      const response = await api.get('/api/admin/owner-portal', {
        params,
      })

      return response.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export async function fetchAdminOwnerPortalServiceStatus() {
  return getCachedResource(
    buildCacheKey(ADMIN_OWNER_PORTAL_SERVICE_STATUS_CACHE_PREFIX),
    async () => {
      const response = await api.get('/api/admin/owner-portal/service-status')
      return response.data
    },
    {
      ttl: 15000,
      persist: true,
    }
  )
}
