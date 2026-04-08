import api from '@/lib/api'

export async function fetchAdminOwnerPortal(month) {
  const response = await api.get('/api/admin/owner-portal', {
    params: month ? { month } : {},
  })

  return response.data
}
