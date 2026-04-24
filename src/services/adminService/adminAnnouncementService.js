import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const ANNOUNCEMENTS_CACHE_PREFIX = 'announcements'

export function getAdminAnnouncementsSnapshot() {
  return peekCachedResource(buildCacheKey(ANNOUNCEMENTS_CACHE_PREFIX))
}

export async function fetchAdminAnnouncements() {
  return getCachedResource(
    buildCacheKey(ANNOUNCEMENTS_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/announcements')
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export async function fetchAdminAnnouncement(id) {
  const res = await api.get(`/api/announcements/${id}`)
  return res.data
}

export async function createAdminAnnouncement(payload) {
  const res = await api.post('/api/announcements', payload)
  invalidateCache(ANNOUNCEMENTS_CACHE_PREFIX)
  return res.data
}

export async function updateAdminAnnouncement(id, payload) {
  const res = await api.put(`/api/announcements/${id}`, payload)
  invalidateCache(ANNOUNCEMENTS_CACHE_PREFIX)
  return res.data
}

export async function deleteAdminAnnouncement(id) {
  const res = await api.delete(`/api/announcements/${id}`)
  invalidateCache(ANNOUNCEMENTS_CACHE_PREFIX)
  return res.data
}
