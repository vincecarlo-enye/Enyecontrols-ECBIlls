import api from '@/lib/api'

export async function fetchFinancePaymentsSearch(params = {}) {
  const res = await api.get('/api/finance/payments', { params })
  return Array.isArray(res?.data?.data) ? res.data.data : []
}
