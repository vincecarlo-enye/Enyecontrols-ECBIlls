import api from '@/services/api'

export async function getTenantBillingReports() {
  const { data } = await api.get('/tenant/billing-reports')
  return data?.data ?? {
    concerns: [],
    counts: {
      total: 0,
      pending: 0,
      active: 0,
      resolved: 0,
    },
  }
}

export async function submitTenantBillingReport(payload) {
  const { data } = await api.post('/tenant/billing-reports', payload)
  return data?.data ?? null
}

export async function reopenTenantBillingReport(id, payload = {}) {
  const { data } = await api.post(`/tenant/billing-reports/${id}/reopen`, payload)
  return data?.data ?? null
}
