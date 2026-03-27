import api from '../../lib/api'

export async function getTenantDashboard() {
  const { data } = await api.get('/api/tenant/dashboard')
  return data?.data ?? null
}
