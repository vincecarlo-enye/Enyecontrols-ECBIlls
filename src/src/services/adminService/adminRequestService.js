/**
 * adminRequestService.js
 *
 * Admin-side counterpart to tenantRequestService.
 * Provides list, status-update, and reply actions for tenant requests/reports.
 *
 * Admin routes  →  /api/admin/requests
 */
import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const ADMIN_REQUESTS_CACHE_PREFIX = 'admin:requests'

export function getAdminRequestsSnapshot(params = {}) {
  return peekCachedResource(buildCacheKey(ADMIN_REQUESTS_CACHE_PREFIX, params))
}

/** Fetch all tenant requests. Supports ?status=, ?category= filters. */
export async function fetchAdminRequests(params = {}) {
  return getCachedResource(
    buildCacheKey(ADMIN_REQUESTS_CACHE_PREFIX, params),
    async () => {
      const res = await api.get('/api/admin/requests', { params })
      return res.data
    },
    { ttl: 30000, persist: true }
  )
}

/** Fetch a single tenant request by ID. */
export async function fetchAdminRequest(id) {
  const res = await api.get(`/api/admin/requests/${id}`)
  return res.data
}

/**
 * Update the status of a request.
 * @param {number|string} id
 * @param {{ status: string, assigned_to?: number }} payload
 */
export async function updateAdminRequestStatus(id, payload) {
  const res = await api.patch(`/api/admin/requests/${id}/status`, payload)
  invalidateCache(ADMIN_REQUESTS_CACHE_PREFIX)
  return res.data
}

/**
 * Post an admin reply to a tenant request.
 * @param {number|string} id
 * @param {{ message: string }} payload
 */
export async function replyToAdminRequest(id, payload) {
  const res = await api.post(`/api/admin/requests/${id}/reply`, payload)
  invalidateCache(ADMIN_REQUESTS_CACHE_PREFIX)
  return res.data
}
