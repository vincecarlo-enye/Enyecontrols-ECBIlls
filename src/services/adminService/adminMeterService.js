import api from "../../lib/api"

export async function fetchAdminMeters() {
  const res = await api.get('/api/super-admin/meters')
  return res.data
}

export async function fetchAdminMeter(id) {
  const res = await api.get(`/api/super-admin/meters/${id}`)
  return res.data
}

export async function fetchAvailableMeterWatches(pageName) {
  try {
    const res = await api.get('/api/super-admin/meters/available', {
      params: { page_name: pageName },
    })
    return res.data
  } catch (error) {
    const fallback = await api.get(`/api/admin/usages/omni/${encodeURIComponent(pageName)}`)
    return fallback.data
  }
}

export async function createAdminMeter(payload) {
  const res = await api.post('/api/super-admin/meters', payload)
  return res.data
}

export async function updateAdminMeter(id, payload) {
  const res = await api.put(`/api/super-admin/meters/${id}`, payload)
  return res.data
}

export async function deleteAdminMeter(id) {
  const res = await api.delete(`/api/super-admin/meters/${id}`)
  return res.data
}
