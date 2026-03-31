import api from "../../lib/api"

export async function fetchTenantUsageMonitoring(unit = 'all') {
  const res = await api.get('/api/tenant/usage-monitoring', {
    params: unit && unit !== 'all' ? { unit } : {},
  })
  return res.data
}
