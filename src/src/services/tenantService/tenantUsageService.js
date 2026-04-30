import api from "../../lib/api"

export async function fetchTenantUsageMonitoring({ unit = 'all', timeRange = '1m' } = {}) {
  const res = await api.get('/api/tenant/usage-monitoring', {
    params: {
      ...(unit && unit !== 'all' ? { unit } : {}),
      ...(timeRange ? { time_range: timeRange, range: timeRange } : {}),
    },
  })
  return res.data
}
