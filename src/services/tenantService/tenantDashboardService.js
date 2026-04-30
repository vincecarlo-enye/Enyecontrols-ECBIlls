import api from '../../lib/api'
import { buildCacheKey, getCachedResource, peekCachedResource } from '@/lib/requestCache'

const TENANT_DASHBOARD_CACHE_PREFIX = 'tenant:dashboard'
const TENANT_DASHBOARD_CACHE_TTL = 60 * 1000

function buildTenantDashboardParams(unit = 'all', timeRange = '1m') {
  return {
    ...(unit && unit !== 'all' ? { unit } : {}),
    ...(timeRange ? { time_range: timeRange, range: timeRange } : {}),
  }
}

export function getTenantDashboardSnapshot(unit = 'all', timeRange = '1m') {
  return peekCachedResource(buildCacheKey(TENANT_DASHBOARD_CACHE_PREFIX, buildTenantDashboardParams(unit, timeRange)))
}

export async function getTenantDashboard(unit = 'all', options = {}) {
  const params = buildTenantDashboardParams(unit, options.timeRange || '1m')

  return getCachedResource(
    buildCacheKey(TENANT_DASHBOARD_CACHE_PREFIX, params),
    async () => {
      const { data } = await api.get('/api/tenant/dashboard', { params })
      return data?.data ?? null
    },
    {
      ttl: TENANT_DASHBOARD_CACHE_TTL,
      persist: true,
      force: options.force === true,
    }
  )
}
