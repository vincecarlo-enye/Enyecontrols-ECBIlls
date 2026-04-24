import api from '@/lib/api'
import { buildCacheKey, getCachedResource, peekCachedResource } from '@/lib/requestCache'

const ADMIN_OCCUPANCY_TIMELINE_CACHE_PREFIX = 'admin:occupancy-timeline'

export function getAdminOccupancyTimelineSnapshot(params = {}) {
  return peekCachedResource(buildCacheKey(ADMIN_OCCUPANCY_TIMELINE_CACHE_PREFIX, params))
}

export async function fetchAdminOccupancyTimeline(params = {}) {
  return getCachedResource(
    buildCacheKey(ADMIN_OCCUPANCY_TIMELINE_CACHE_PREFIX, params),
    async () => {
      const res = await api.get('/api/admin/occupancy-timeline', { params })
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}
