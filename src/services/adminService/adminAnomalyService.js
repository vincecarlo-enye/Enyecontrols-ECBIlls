import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const ADMIN_ANOMALIES_CACHE_PREFIX = 'admin:anomalies'
const ADMIN_ANOMALY_SUMMARY_CACHE_PREFIX = 'admin:anomalies-summary'

export function getAdminAnomaliesSnapshot(params = {}) {
  return peekCachedResource(buildCacheKey(ADMIN_ANOMALIES_CACHE_PREFIX, params))
}

export function getAdminAnomalySummarySnapshot() {
  return peekCachedResource(buildCacheKey(ADMIN_ANOMALY_SUMMARY_CACHE_PREFIX))
}

export async function fetchAdminAnomalies(params = {}) {
  return getCachedResource(
    buildCacheKey(ADMIN_ANOMALIES_CACHE_PREFIX, params),
    async () => {
      const response = await api.get('/api/admin/anomalies', { params })
      return response.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export async function fetchAdminAnomalySummary() {
  return getCachedResource(
    buildCacheKey(ADMIN_ANOMALY_SUMMARY_CACHE_PREFIX),
    async () => {
      const response = await api.get('/api/admin/anomalies/summary')
      return response.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export async function updateAdminAnomaly(id, payload) {
  const response = await api.patch(`/api/admin/anomalies/${id}`, payload)
  invalidateCache([ADMIN_ANOMALIES_CACHE_PREFIX, ADMIN_ANOMALY_SUMMARY_CACHE_PREFIX])
  return response.data
}
