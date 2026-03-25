import api from "../../lib/api"


export async function fetchUtilitySummary() {
  const res = await api.get('/api/admin/dashboard/utilities-summary')
  return res.data
}

export async function fetchUtilityDaily() {
  const res = await api.get('/api/admin/dashboard/utilities-daily')
  return res.data
}
