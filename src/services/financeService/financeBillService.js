import api, { createFreshRequestConfig } from '@/lib/api'

export async function fetchFinanceBills() {
  const res = await api.get('/api/finance/bills', createFreshRequestConfig())
  return res.data
}

export async function fetchFinanceBill(id) {
  const res = await api.get(`/api/finance/bills/${id}`)
  return res.data
}

export async function generateFinanceBill(payload) {
  const res = await api.post('/api/finance/bills/generate', payload)
  return res.data
}

export async function fetchFinanceBillingAssistPreview(payload) {
  const res = await api.post('/api/finance/bills/generate-assist-preview', payload)
  return res.data
}

export async function syncFinanceOverdueBills(payload) {
  const res = await api.post('/api/finance/bills/sync-overdue', payload)
  return res.data
}

export async function generateFinanceBillsBulk(payload) {
  const res = await api.post('/api/finance/bills/generate-bulk', payload)
  return res.data
}

export async function regenerateFinanceBill(payload) {
  const res = await api.post('/api/finance/bills/regenerate', payload)
  return res.data
}

export async function updateFinanceBillStatus(id, status) {
  const res = await api.patch(`/api/finance/bills/${id}/status`, { status })
  return res.data
}

export async function deleteFinanceBill(id) {
  const res = await api.delete(`/api/finance/bills/${id}`)
  return res.data
}

export async function createFinanceBillAdjustment(billId, payload) {
  const res = await api.post(`/api/finance/bills/${billId}/adjustments`, payload)
  return res.data
}

export async function fetchFinanceBillAdjustments(params = {}) {
  const res = await api.get('/api/finance/bill-adjustments', { params })
  return res.data
}

export async function submitFinanceBillAdjustment(id) {
  const res = await api.patch(`/api/finance/bill-adjustments/${id}/submit`)
  return res.data
}

export async function fetchFinanceTenants() {
  const res = await api.get('/api/finance/tenants')
  return res.data
}

export async function fetchSharedRates() {
  const res = await api.get('/api/rates')
  return res.data
}
