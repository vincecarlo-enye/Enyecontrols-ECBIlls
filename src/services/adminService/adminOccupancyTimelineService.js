import api from '@/lib/api'

export async function fetchAdminOccupancyTimeline(params = {}) {
  const res = await api.get('/api/admin/occupancy-timeline', { params })
  return res.data
}
