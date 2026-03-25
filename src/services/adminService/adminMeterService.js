import api from "../../lib/api"


export async function fetchAdminMeters() {
  const res = await api.get('/api/admin/meters')
  return res.data
}

export async function fetchAdminMeter(id) {
  const res = await api.get(`/api/admin/meters/${id}`)
  return res.data
}
