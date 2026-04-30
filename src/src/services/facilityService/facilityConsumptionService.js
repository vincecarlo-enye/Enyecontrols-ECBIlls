import api from '@/lib/api'

export async function fetchFacilityConsumption(params = {}) {
  const response = await api.get('/api/facility/consumption', { params })
  return response.data
}
