import api from '@/lib/api'
import { buildCacheKey, getCachedResource, peekCachedResource } from '@/lib/requestCache'

const ADMIN_RECONCILIATION_CACHE_PREFIX = 'admin:reconciliation'
const RECONCILIATION_CACHE_TTL = 2 * 60 * 1000

export function getAdminReconciliationSnapshot(params = {}) {
  return peekCachedResource(buildCacheKey(ADMIN_RECONCILIATION_CACHE_PREFIX, params))
}

export async function fetchAdminReconciliation(params = {}) {
  return getCachedResource(
    buildCacheKey(ADMIN_RECONCILIATION_CACHE_PREFIX, params),
    async () => {
      const res = await api.get('/api/admin/reconciliation', { params })
      return res.data
    },
    {
      ttl: RECONCILIATION_CACHE_TTL,
      persist: true,
    }
  )
}
