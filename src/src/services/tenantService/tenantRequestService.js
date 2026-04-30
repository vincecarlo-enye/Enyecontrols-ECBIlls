/**
 * tenantRequestService.js
 *
 * Replaces the mock ReportsContext / reports.json workflow.
 * All requests are now persisted to the database via the API.
 *
 * Tenant routes  →  /api/tenant/requests
 */
import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const TENANT_REQUESTS_CACHE_PREFIX = 'tenant:requests'

export function getTenantRequestsSnapshot() {
  return peekCachedResource(buildCacheKey(TENANT_REQUESTS_CACHE_PREFIX))
}

/** Fetch all requests submitted by the authenticated tenant. */
export async function fetchTenantRequests() {
  return getCachedResource(
    buildCacheKey(TENANT_REQUESTS_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/tenant/requests')
      return res.data
    },
    { ttl: 30000, persist: true }
  )
}

/** Fetch a single request by ID. */
export async function fetchTenantRequest(id) {
  const res = await api.get(`/api/tenant/requests/${id}`)
  return res.data
}

/**
 * Submit a new request / report.
 * @param {{ subject: string, message: string, category?: string, priority?: string }} payload
 */
export async function submitTenantRequest(payload) {
  const res = await api.post('/api/tenant/requests', payload)
  invalidateCache(TENANT_REQUESTS_CACHE_PREFIX)
  return res.data
}
