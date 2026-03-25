import api from "../../lib/api"

export async function fetchAdminOmniPages() {
  const res = await api.get('/api/admin/usages/omni')
  return res.data
}

export async function fetchAdminOmniPage(pageName) {
  const res = await api.get(`/api/admin/usages/omni/${encodeURIComponent(pageName)}`)
  return res.data
}

export async function syncAdminOmniPage(pageName) {
  const res = await api.post(`/api/admin/usages/sync/${encodeURIComponent(pageName)}`)
  return res.data
}
