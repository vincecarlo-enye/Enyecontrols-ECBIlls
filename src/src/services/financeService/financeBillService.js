import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const FINANCE_BILLS_CACHE_PREFIX = 'finance:bills'
const FINANCE_PAYMENTS_CACHE_PREFIX = 'finance:payments'
const FINANCE_TENANTS_CACHE_PREFIX = 'finance:tenants'
const SHARED_RATES_CACHE_PREFIX = 'shared:rates'

export function getFinanceBillsSnapshot(params = {}) {
  return peekCachedResource(buildCacheKey(FINANCE_BILLS_CACHE_PREFIX, params))
}

export function getFinancePaymentsSnapshot(params = {}) {
  return peekCachedResource(buildCacheKey(FINANCE_PAYMENTS_CACHE_PREFIX, params))
}

export function getSharedRatesSnapshot() {
  return peekCachedResource(buildCacheKey(SHARED_RATES_CACHE_PREFIX))
}

export async function fetchFinanceBills(params = {}) {
  return getCachedResource(
    buildCacheKey(FINANCE_BILLS_CACHE_PREFIX, params),
    async () => {
      const res = await api.get('/api/finance/bills', { params })
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export async function fetchFinanceBill(id) {
  const res = await api.get(`/api/finance/bills/${id}`)
  return res.data
}

export async function fetchFinancePayments(params = {}) {
  return getCachedResource(
    buildCacheKey(FINANCE_PAYMENTS_CACHE_PREFIX, params),
    async () => {
      const res = await api.get('/api/finance/payments', { params })
      return res.data
    },
    {
      ttl: 20000,
      persist: true,
    }
  )
}

export async function generateFinanceBill(payload) {
  const res = await api.post('/api/finance/bills/generate', payload)
  invalidateCache([
    FINANCE_BILLS_CACHE_PREFIX,
    FINANCE_TENANTS_CACHE_PREFIX,
    FINANCE_PAYMENTS_CACHE_PREFIX,
    SHARED_RATES_CACHE_PREFIX,
  ])
  return res.data
}

export async function regenerateFinanceBill(payload) {
  const res = await api.post('/api/finance/bills/regenerate', payload)
  invalidateCache([
    FINANCE_BILLS_CACHE_PREFIX,
    FINANCE_PAYMENTS_CACHE_PREFIX,
  ])
  return res.data
}

export async function generateAllFinanceBills(payload) {
  const res = await api.post('/api/finance/bills/generate-all', payload)
  invalidateCache([
    FINANCE_BILLS_CACHE_PREFIX,
    FINANCE_TENANTS_CACHE_PREFIX,
    FINANCE_PAYMENTS_CACHE_PREFIX,
  ])
  return res.data
}

export async function updateFinanceBillStatus(id, status) {
  const res = await api.patch(`/api/finance/bills/${id}/status`, { status })
  invalidateCache([
    FINANCE_BILLS_CACHE_PREFIX,
    FINANCE_PAYMENTS_CACHE_PREFIX,
  ])
  return res.data
}

export async function verifyFinancePayment(id, payload = {}) {
  const res = await api.post(`/api/finance/payments/${id}/verify`, payload)
  invalidateCache([
    FINANCE_BILLS_CACHE_PREFIX,
    FINANCE_PAYMENTS_CACHE_PREFIX,
  ])
  return res.data
}

export async function rejectFinancePayment(id, payload = {}) {
  const res = await api.post(`/api/finance/payments/${id}/reject`, payload)
  invalidateCache([
    FINANCE_BILLS_CACHE_PREFIX,
    FINANCE_PAYMENTS_CACHE_PREFIX,
  ])
  return res.data
}

export async function deleteFinanceBill(id) {
  const res = await api.delete(`/api/finance/bills/${id}`)
  invalidateCache([
    FINANCE_BILLS_CACHE_PREFIX,
    FINANCE_PAYMENTS_CACHE_PREFIX,
  ])
  return res.data
}

export async function fetchFinanceTenants(params = {}) {
  return getCachedResource(
    buildCacheKey(FINANCE_TENANTS_CACHE_PREFIX, params),
    async () => {
      const res = await api.get('/api/finance/tenants', { params })
      return res.data
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}

export async function fetchSharedRates(options = {}) {
  return getCachedResource(
    buildCacheKey(SHARED_RATES_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/rates')
      return res.data
    },
    {
      ttl: 60000,
      force: options?.force === true,
      persist: true,
    }
  )
}
