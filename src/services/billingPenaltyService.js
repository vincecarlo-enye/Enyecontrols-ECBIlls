import api from '@/lib/api'

export async function fetchBillingPenaltyRule() {
  const res = await api.get('/api/billing-penalty-rule')
  return res.data
}

export async function updateBillingPenaltyRule(payload) {
  const res = await api.put('/api/super-admin/billing-penalty-rule', payload)
  return res.data
}

export async function previewFinanceBillPenalties(payload) {
  const res = await api.post('/api/finance/bill-penalties/preview', payload)
  return res.data
}

export async function applyFinanceBillPenalties(payload) {
  const res = await api.post('/api/finance/bill-penalties/apply', payload)
  return res.data
}
