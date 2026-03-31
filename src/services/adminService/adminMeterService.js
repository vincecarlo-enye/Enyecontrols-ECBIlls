import api from "../../lib/api"

export async function fetchAdminMeters(params = {}) {
  const requestParams = { paginate: 1, ...params }

  try {
    const res = await api.get('/api/super-admin/meters', { params: requestParams })
    return res.data
  } catch (error) {
    if (error?.response?.status !== 403) {
      throw error
    }

    const fallback = await api.get('/api/admin/meters', { params: requestParams })
    return fallback.data
  }
}

export async function fetchAdminMeter(id) {
  try {
    const res = await api.get(`/api/super-admin/meters/${id}`)
    return res.data
  } catch (error) {
    if (error?.response?.status !== 403) {
      throw error
    }

    const fallback = await api.get(`/api/admin/meters/${id}`)
    return fallback.data
  }
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

