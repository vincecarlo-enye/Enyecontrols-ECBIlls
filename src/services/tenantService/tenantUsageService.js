import api, { createFreshRequestConfig } from "../../lib/api"

export async function fetchTenantUsageMonitoring(unit = 'all') {
  const res = await api.get(
    '/api/tenant/usage-monitoring',
    createFreshRequestConfig({
      params: unit && unit !== 'all' ? { unit } : {},
    })
  )
  return res.data
}
