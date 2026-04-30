import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const inFlightAdminBillingRequests = new Map()
const ADMIN_BILLS_CACHE_PREFIX = 'admin:bills'
const ADMIN_PAYMENTS_CACHE_PREFIX = 'admin:payments'

function getStoredRole() {
  try {
    const raw = localStorage.getItem('sb_auth_user')
    const user = raw ? JSON.parse(raw) : null
    return user?.role || null
  } catch {
    return null
  }
}

export function getAdminBillsSnapshot(params = {}) {
  const shouldPaginate = params?.paginate || params?.page || params?.per_page
  const requestParams = shouldPaginate ? { paginate: 1, ...params } : params
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_BILLS_CACHE_PREFIX, { role, ...requestParams }))
}

export function getAdminPaymentsSnapshot(params = {}) {
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_PAYMENTS_CACHE_PREFIX, { role, ...params }))
}

function buildRequestKey(prefix, params = {}) {
  const entries = Object.entries(params).sort(([left], [right]) => left.localeCompare(right))
  return `${prefix}:${JSON.stringify(entries)}`
}

function runSharedRequest(key, fetcher) {
  if (inFlightAdminBillingRequests.has(key)) {
    return inFlightAdminBillingRequests.get(key)
  }

  const pendingRequest = Promise.resolve()
    .then(fetcher)
    .finally(() => {
      inFlightAdminBillingRequests.delete(key)
    })

  inFlightAdminBillingRequests.set(key, pendingRequest)
  return pendingRequest
}

export async function fetchAdminBills(params = {}) {
  const shouldPaginate = params?.paginate || params?.page || params?.per_page
  const requestParams = shouldPaginate ? { paginate: 1, ...params } : params
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_BILLS_CACHE_PREFIX, { role, ...requestParams }),
    () => runSharedRequest(buildRequestKey('bills', requestParams), async () => {
      const res = await api.get('/api/admin/bills', {
        params: requestParams,
      })
      return res.data
    }),
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export async function fetchAdminBill(id) {
  const res = await api.get(`/api/admin/bills/${id}`)
  return res.data
}

export async function fetchAdminPayments(params = {}) {
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_PAYMENTS_CACHE_PREFIX, { role, ...params }),
    () => runSharedRequest(buildRequestKey('payments', params), async () => {
      const res = await api.get('/api/admin/payments', { params })
      return res.data
    }),
    {
      ttl: 20000,
      persist: true,
    }
  )
}

export async function verifyAdminPayment(id, payload = {}) {
  const res = await api.post(`/api/admin/payments/${id}/verify`, payload)
  invalidateCache([ADMIN_BILLS_CACHE_PREFIX, ADMIN_PAYMENTS_CACHE_PREFIX])
  return res.data
}

export async function rejectAdminPayment(id, payload = {}) {
  const res = await api.post(`/api/admin/payments/${id}/reject`, payload)
  invalidateCache([ADMIN_BILLS_CACHE_PREFIX, ADMIN_PAYMENTS_CACHE_PREFIX])
  return res.data
}

export async function generateAdminBill(payload) {
  const res = await api.post('/api/admin/bills/generate', payload)
  invalidateCache([ADMIN_BILLS_CACHE_PREFIX, ADMIN_PAYMENTS_CACHE_PREFIX])
  return res.data
}

export async function regenerateAdminBill(payload) {
  const res = await api.post('/api/admin/bills/regenerate', payload)
  invalidateCache([ADMIN_BILLS_CACHE_PREFIX, ADMIN_PAYMENTS_CACHE_PREFIX])
  return res.data
}


export async function deleteAdminBill(id) {
  const res = await api.delete(`/api/admin/bills/${id}`)
  invalidateCache([ADMIN_BILLS_CACHE_PREFIX, ADMIN_PAYMENTS_CACHE_PREFIX])
  return res.data
}

