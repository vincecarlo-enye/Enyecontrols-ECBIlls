import api, { createFreshRequestConfig } from '@/lib/api'

export async function fetchFinancePaymentsSearch() {
  const res = await api.get('/api/finance/payments', createFreshRequestConfig())
  return Array.isArray(res?.data?.data) ? res.data.data : []
}
