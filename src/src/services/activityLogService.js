import api from '@/lib/api'
import { buildCacheKey, getCachedResource, peekCachedResource } from '@/lib/requestCache'

const ACTIVITY_LOGS_CACHE_PREFIX = 'activity-logs'
const ACTIVITY_TIMELINE_CACHE_PREFIX = 'activity-timeline'

export function getActivityLogsSnapshot(params = {}) {
  const requestParams = {
    paginate: 1,
    ...params,
  }

  return peekCachedResource(buildCacheKey(ACTIVITY_LOGS_CACHE_PREFIX, requestParams))
}

export async function addLocalActivityLog(entry = {}) {
  const payload = {
    action: entry.action || 'system_event',
    description: entry.description || '',
    entity_type: entry.entity_type || null,
    entity_id: entry.entity_id || null,
    method: entry.method || null,
    path: entry.path || null,
    ip_address: entry.ip_address || null,
    meta: entry.meta || null,
  }

  const res = await api.post('/api/activity-logs', payload)
  return res.data?.data || res.data || null
}

export async function fetchActivityLogs(params = {}) {
  const requestParams = {
    paginate: 1,
    ...params,
  }

  return getCachedResource(
    buildCacheKey(ACTIVITY_LOGS_CACHE_PREFIX, requestParams),
    async () => {
      const res = await api.get('/api/activity-logs', {
        params: requestParams,
      })

      return res.data
    },
    {
      ttl: 15000,
      persist: true,
    }
  )
}

export async function fetchActivityTimeline(entityType, entityId) {
  const params = {
    entityType,
    entityId,
  }

  return getCachedResource(
    buildCacheKey(ACTIVITY_TIMELINE_CACHE_PREFIX, params),
    async () => {
      const res = await api.get(`/api/activity-logs/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`)
      return res.data
    },
    {
      ttl: 15000,
      persist: true,
    }
  )
}
