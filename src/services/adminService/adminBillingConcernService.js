import api, { createFreshRequestConfig } from "../../lib/api"

export async function fetchAdminBillingConcerns() {
  const res = await api.get('/api/admin/billing-concerns', createFreshRequestConfig())
  return res.data
}

export async function assignBillingConcern(id, payload) {
  const res = await api.post(`/api/admin/billing-concerns/${id}/assign`, payload)
  return res.data
}

export async function updateAdminBillingConcernStatus(id, payload) {
  const res = await api.patch(`/api/admin/billing-concerns/${id}/status`, payload)
  return res.data
}

export async function fetchFinanceUsers() {
  const res = await api.get('/api/admin/finance-users')
  return res.data
}
