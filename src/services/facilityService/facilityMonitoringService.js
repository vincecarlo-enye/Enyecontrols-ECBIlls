import api from '@/lib/api'

export async function fetchFacilityMonitoring() {
  const response = await api.get('/api/facility/monitoring')
  return response.data
}

export async function approveFacilityReading(id, payload = {}) {
  const response = await api.patch(`/api/facility/monitoring/readings/${id}/approve`, payload)
  return response.data
}

export async function rejectFacilityReading(id, payload = {}) {
  const response = await api.patch(`/api/facility/monitoring/readings/${id}/reject`, payload)
  return response.data
}
