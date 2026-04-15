import api, { createFreshRequestConfig } from "../../lib/api"


export async function fetchUtilitySummary() {
  const res = await api.get('/api/admin/dashboard/utilities-summary', createFreshRequestConfig())
  return res.data
}

export async function fetchUtilityDaily() {
  const res = await api.get('/api/admin/dashboard/utilities-daily', createFreshRequestConfig())
  return res.data
}
