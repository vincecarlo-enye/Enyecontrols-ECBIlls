import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache } from '@/lib/requestCache'

const BILLING_PERIOD_LOCKS_CACHE_PREFIX = 'billing-period-locks'

export async function fetchBillingPeriodLocks() {
  return getCachedResource(
    buildCacheKey(BILLING_PERIOD_LOCKS_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/billing-period-locks')
      return res.data
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}

export async function lockBillingPeriod(scope, payload) {
  const res = await api.post(`/api/${scope}/billing-period-locks`, payload)
  invalidateCache(BILLING_PERIOD_LOCKS_CACHE_PREFIX)
  return res.data
}

export async function unlockBillingPeriod(scope, billingMonth, payload = {}) {
  const res = await api.delete(`/api/${scope}/billing-period-locks/${billingMonth}`, { data: payload })
  invalidateCache(BILLING_PERIOD_LOCKS_CACHE_PREFIX)
  return res.data
}
