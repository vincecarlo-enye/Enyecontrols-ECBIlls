import api from '@/lib/api'

export async function fetchFacilityReports() {
  const response = await api.get('/api/facility/reports')
  return response.data
}
