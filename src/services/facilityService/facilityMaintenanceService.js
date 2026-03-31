import api from '@/lib/api'

export async function fetchFacilityMaintenanceTickets() {
  const response = await api.get('/api/facility/maintenance')
  return response.data
}

export async function createFacilityMaintenanceTicket(payload) {
  const response = await api.post('/api/facility/maintenance', payload)
  return response.data
}

export async function updateFacilityMaintenanceTicketStatus(id, payload) {
  const response = await api.patch(`/api/facility/maintenance/${id}/status`, payload)
  return response.data
}
