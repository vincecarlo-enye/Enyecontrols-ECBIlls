import api from '../../lib/api'

export async function getTenantRates() {
  const { data } = await api.get('/api/rates')
  return Array.isArray(data) ? data : []
}
