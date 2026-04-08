import api from '@/lib/api'

export async function fetchBillingPeriodLocks() {
  const res = await api.get('/api/billing-period-locks')
  return res.data
}

export async function lockBillingPeriod(scope, payload) {
  const res = await api.post(`/api/${scope}/billing-period-locks`, payload)
  return res.data
}

export async function unlockBillingPeriod(scope, billingMonth, payload = {}) {
  const res = await api.delete(`/api/${scope}/billing-period-locks/${billingMonth}`, { data: payload })
  return res.data
}
