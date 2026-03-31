import api from '@/lib/api'

export async function fetchRateHistory() {
  const { data } = await api.get('/api/rates/history')
  return Array.isArray(data) ? data : data?.data || []
}
