import api, { createFreshRequestConfig } from "../../lib/api"

export async function fetchAdminUnits() {
  const res = await api.get('/api/admin/units', createFreshRequestConfig())
  return res.data
}

export async function fetchAdminUnit(id) {
  const res = await api.get(`/api/admin/units/${id}`)
  return res.data
}

export async function createAdminUnit(payload) {
  const res = await api.post('/api/admin/units', payload)
  return res.data
}

export async function updateAdminUnit(id, payload) {
  const res = await api.put(`/api/admin/units/${id}`, payload)
  return res.data
}

export async function deleteAdminUnit(id) {
  const res = await api.delete(`/api/admin/units/${id}`)
  return res.data
}
