import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const RATE_HISTORY_CACHE_PREFIX = 'rates:history'

export function getRateHistorySnapshot() {
  return peekCachedResource(buildCacheKey(RATE_HISTORY_CACHE_PREFIX))
}

export async function fetchRateHistory() {
  return getCachedResource(
    buildCacheKey(RATE_HISTORY_CACHE_PREFIX),
    async () => {
      const { data } = await api.get('/api/rates/history')
      return Array.isArray(data) ? data : data?.data || []
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}

export function invalidateRateHistoryCache() {
  invalidateCache(RATE_HISTORY_CACHE_PREFIX)
}
