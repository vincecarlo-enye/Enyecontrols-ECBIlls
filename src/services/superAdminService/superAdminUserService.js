import api from '@/lib/api'

export async function fetchSuperAdminUsers() {
  const res = await api.get('/api/super-admin/users')
  return res.data
}

export async function createSuperAdminUser(payload) {
  const res = await api.post('/api/super-admin/users', payload)
  return res.data
}

export async function updateSuperAdminUser(id, payload) {
  const res = await api.put(`/api/super-admin/users/${id}`, payload)
  return res.data
}

export async function updateSuperAdminUserStatus(id, status) {
  const res = await api.patch(`/api/super-admin/users/${id}/status`, { status })
  return res.data
}

export async function resetSuperAdminUserPassword(id, password) {
  const res = await api.patch(`/api/super-admin/users/${id}/password`, { password })
  return res.data
}

export async function deleteSuperAdminUser(id) {
  const res = await api.delete(`/api/super-admin/users/${id}`)
  return res.data
}
