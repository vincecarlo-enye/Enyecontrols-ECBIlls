import api from '@/lib/api'

export async function fetchFacilityConsumption() {
  const response = await api.get('/api/facility/consumption')
  return response.data
}
