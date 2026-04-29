import api from "../../lib/api"
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const ADMIN_UTILITY_SUMMARY_CACHE_PREFIX = 'admin:utility-summary'
const ADMIN_UTILITY_DAILY_CACHE_PREFIX = 'admin:utility-daily'
const ADMIN_UTILITY_COMPARISON_CACHE_PREFIX = 'admin:utility-comparison'

function getStoredRole() {
  try {
    const raw = localStorage.getItem('sb_auth_user')
    const user = raw ? JSON.parse(raw) : null
    return user?.role || null
  } catch {
    return null
  }
}

export function getUtilitySummarySnapshot() {
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_UTILITY_SUMMARY_CACHE_PREFIX, { role }))
}

export function getUtilityDailySnapshot() {
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_UTILITY_DAILY_CACHE_PREFIX, { role }))
}

export function getUtilityComparisonSnapshot(range = '7D') {
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_UTILITY_COMPARISON_CACHE_PREFIX, { role, range }))
}

export async function fetchUtilitySummary() {
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_UTILITY_SUMMARY_CACHE_PREFIX, { role }),
    async () => {
      const res = await api.get('/api/admin/dashboard/utilities-summary')
      return res.data
    },
    {
      ttl: 5000,
      persist: true,
    }
  )
}

export async function fetchUtilityDaily() {
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_UTILITY_DAILY_CACHE_PREFIX, { role }),
    async () => {
      const res = await api.get('/api/admin/dashboard/utilities-daily')
      return res.data
    },
    {
      ttl: 5000,
      persist: true,
    }
  )
}

export async function fetchUtilityComparison(range = '7D') {
  const role = getStoredRole()
  return getCachedResource(
    buildCacheKey(ADMIN_UTILITY_COMPARISON_CACHE_PREFIX, { role, range }),
    async () => {
      const res = await api.get('/api/admin/dashboard/utilities-comparison', {
        params: { range },
      })
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
    }
  )
}

export function invalidateAdminUtilityCache() {
  invalidateCache([
    ADMIN_UTILITY_SUMMARY_CACHE_PREFIX,
    ADMIN_UTILITY_DAILY_CACHE_PREFIX,
    ADMIN_UTILITY_COMPARISON_CACHE_PREFIX,
  ])
}
