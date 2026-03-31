import api from '@/lib/api'

export async function fetchAdminAnomalies(params = {}) {
  const response = await api.get('/api/admin/anomalies', { params })
  return response.data
}

export async function fetchAdminAnomalySummary() {
  const response = await api.get('/api/admin/anomalies/summary')
  return response.data
}

export async function updateAdminAnomaly(id, payload) {
  const response = await api.patch(`/api/admin/anomalies/${id}`, payload)
  return response.data
}
