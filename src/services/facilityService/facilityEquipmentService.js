import api from '@/lib/api'

export async function fetchFacilityEquipment() {
  const response = await api.get('/api/facility/equipment')
  return response.data
}
