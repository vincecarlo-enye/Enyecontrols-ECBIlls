import api from "../../lib/api"
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const ADMIN_BILLING_CONCERNS_CACHE_PREFIX = 'admin:billing-concerns'
const ADMIN_FINANCE_USERS_CACHE_PREFIX = 'admin:finance-users'

export function getAdminBillingConcernsSnapshot(params = {}) {
  return peekCachedResource(buildCacheKey(ADMIN_BILLING_CONCERNS_CACHE_PREFIX, params))
}

export function getFinanceUsersSnapshot() {
  return peekCachedResource(buildCacheKey(ADMIN_FINANCE_USERS_CACHE_PREFIX))
}

export async function fetchAdminBillingConcerns(params = {}) {
  return getCachedResource(
    buildCacheKey(ADMIN_BILLING_CONCERNS_CACHE_PREFIX, params),
    async () => {
      const res = await api.get('/api/admin/billing-concerns', { params })
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export async function assignBillingConcern(id, payload) {
  const res = await api.post(`/api/admin/billing-concerns/${id}/assign`, payload)
  invalidateCache(ADMIN_BILLING_CONCERNS_CACHE_PREFIX)
  return res.data
}

export async function updateAdminBillingConcernStatus(id, payload) {
  const res = await api.patch(`/api/admin/billing-concerns/${id}/status`, payload)
  invalidateCache(ADMIN_BILLING_CONCERNS_CACHE_PREFIX)
  return res.data
}

export async function fetchFinanceUsers() {
  return getCachedResource(
    buildCacheKey(ADMIN_FINANCE_USERS_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/admin/finance-users')
      return res.data
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}
