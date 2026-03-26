import api from "../../lib/api"

export async function fetchTenantUsageMonitoring() {
  const res = await api.get('/api/tenant/usage-monitoring')
  return res.data
}