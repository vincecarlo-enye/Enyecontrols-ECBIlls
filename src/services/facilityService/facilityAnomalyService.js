import api from '@/lib/api'

export async function fetchFacilityAnomalies(params = {}) {
  const response = await api.get('/api/facility/anomalies', { params })
  return response.data
}

export async function fetchFacilityAnomalyAnalytics() {
  const response = await api.get('/api/facility/anomalies/analytics')
  return response.data
}

export async function updateFacilityAnomaly(id, payload) {
  const response = await api.patch(`/api/facility/anomalies/${id}`, payload)
  return response.data
}
