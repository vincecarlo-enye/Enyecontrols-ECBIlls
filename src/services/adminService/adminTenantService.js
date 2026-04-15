import api, { createFreshRequestConfig } from "../../lib/api"

export async function fetchAdminTenants() {
  const res = await api.get('/api/admin/tenants', createFreshRequestConfig())
  return res.data
}

export async function fetchAdminTenant(id) {
  const res = await api.get(`/api/admin/tenants/${id}`)
  return res.data
}

export async function fetchAvailableTenantUsers() {
  const res = await api.get('/api/admin/tenant-users')
  return res.data
}


export async function createAdminTenant(payload) {
  const res = await api.post('/api/admin/tenants', payload)
  return res.data
}

export async function updateAdminTenant(id, payload) {
  const res = await api.put(`/api/admin/tenants/${id}`, payload)
  return res.data
}

export async function deleteAdminTenant(id) {
  const res = await api.delete(`/api/admin/tenants/${id}`)
  return res.data
}
