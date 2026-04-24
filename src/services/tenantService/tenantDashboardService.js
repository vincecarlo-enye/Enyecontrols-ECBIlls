import api from '../../lib/api'
import { buildCacheKey, getCachedResource, peekCachedResource } from '@/lib/requestCache'

const TENANT_DASHBOARD_CACHE_PREFIX = 'tenant:dashboard'
const TENANT_DASHBOARD_CACHE_TTL = 60 * 1000

function buildTenantDashboardParams(unit = 'all') {
  return unit && unit !== 'all' ? { unit } : {}
}

export function getTenantDashboardSnapshot(unit = 'all') {
  return peekCachedResource(buildCacheKey(TENANT_DASHBOARD_CACHE_PREFIX, buildTenantDashboardParams(unit)))
}

export async function getTenantDashboard(unit = 'all') {
  const params = buildTenantDashboardParams(unit)

  return getCachedResource(
    buildCacheKey(TENANT_DASHBOARD_CACHE_PREFIX, params),
    async () => {
      const { data } = await api.get('/api/tenant/dashboard', { params })
      return data?.data ?? null
    },
    {
      ttl: TENANT_DASHBOARD_CACHE_TTL,
      persist: true,
    }
  )
}
