import api, { createFreshRequestConfig } from '../../lib/api'

export async function getTenantDashboard(unit = 'all') {
  const { data } = await api.get(
    '/api/tenant/dashboard',
    createFreshRequestConfig({
      params: { unit },
    })
  )
  return data?.data ?? null
}
