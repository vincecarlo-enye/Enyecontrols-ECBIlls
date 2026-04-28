import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache } from '@/lib/requestCache'

const BILLING_PENALTY_RULE_CACHE_PREFIX = 'billing-penalty-rule'

export async function fetchBillingPenaltyRule() {
  return getCachedResource(
    buildCacheKey(BILLING_PENALTY_RULE_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/billing-penalty-rule')
      return res.data
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}

export async function updateBillingPenaltyRule(payload) {
  const res = await api.put('/api/super-admin/billing-penalty-rule', payload)
  invalidateCache(BILLING_PENALTY_RULE_CACHE_PREFIX)
  return res.data
}

export async function previewFinanceBillPenalties(payload) {
  const res = await api.post('/api/finance/bill-penalties/preview', payload)
  return res.data
}

export async function applyFinanceBillPenalties(payload) {
  const res = await api.post('/api/finance/bill-penalties/apply', payload)
  invalidateCache([
    'finance:bills',
    'finance:payments',
  ])
  return res.data
}
