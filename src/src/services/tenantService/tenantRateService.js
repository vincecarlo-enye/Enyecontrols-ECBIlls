import api from '../../lib/api'
import { buildCacheKey, getCachedResource } from '@/lib/requestCache'

const SHARED_RATE_CACHE_PREFIX = 'shared:rates'

export async function getTenantRates() {
  return getCachedResource(
    buildCacheKey(SHARED_RATE_CACHE_PREFIX),
    async () => {
      const { data } = await api.get('/api/rates')
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.data)) return data.data
      return []
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}
