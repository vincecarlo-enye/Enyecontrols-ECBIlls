import api from '../../lib/api'

export async function getTenantProfile() {
  const { data } = await api.get('/api/tenant/profile')
  return data?.data ?? null
}

export async function updateTenantProfile(payload) {
  const { data } = await api.put('/api/tenant/profile', payload)
  return data?.data ?? null
}

export async function updateTenantPassword(payload) {
  const { data } = await api.put('/api/tenant/profile/password', payload)
  return data ?? null
}
