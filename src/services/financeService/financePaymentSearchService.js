import api from '@/lib/api'

export async function fetchFinancePaymentsSearch() {
  const res = await api.get('/api/finance/payments')
  return Array.isArray(res?.data?.data) ? res.data.data : []
}
