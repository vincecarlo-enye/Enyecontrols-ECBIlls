import api from '@/lib/api'

export async function fetchAdminAnnouncements() {
  const res = await api.get('/api/announcements')
  return res.data
}

export async function fetchAdminAnnouncement(id) {
  const res = await api.get(`/api/announcements/${id}`)
  return res.data
}

export async function createAdminAnnouncement(payload) {
  const res = await api.post('/api/admin/announcements', payload)
  return res.data
}

export async function updateAdminAnnouncement(id, payload) {
  const res = await api.put(`/api/admin/announcements/${id}`, payload)
  return res.data
}

export async function deleteAdminAnnouncement(id) {
  const res = await api.delete(`/api/admin/announcements/${id}`)
  return res.data
}
