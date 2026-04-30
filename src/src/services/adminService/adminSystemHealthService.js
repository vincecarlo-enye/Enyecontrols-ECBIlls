import api from '@/lib/api'

export async function fetchAdminSystemHealth() {
  const res = await api.get('/api/admin/system-health')
  return res.data
}
