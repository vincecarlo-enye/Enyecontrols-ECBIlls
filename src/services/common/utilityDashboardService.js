/**
 * utilityDashboardService.js
 *
 * Shared utility dashboard service that hits the role-agnostic
 * /api/dashboard/utilities-* endpoint accessible to admin, super_admin, and finance.
 *
 * Replaces the role-specific adminUtilityService and financeUtilityService for
 * consumption data — all three roles see the same meter readings.
 */

import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const UTILITY_SUMMARY_CACHE_PREFIX = 'shared:utility-summary'
const UTILITY_DAILY_CACHE_PREFIX = 'shared:utility-daily'
const UTILITY_COMPARISON_CACHE_PREFIX = 'shared:utility-comparison'

export function getUtilitySummarySnapshot() {
  return peekCachedResource(buildCacheKey(UTILITY_SUMMARY_CACHE_PREFIX))
}

export function getUtilityDailySnapshot() {
  return peekCachedResource(buildCacheKey(UTILITY_DAILY_CACHE_PREFIX))
}

export function getUtilityComparisonSnapshot(range = '7D') {
  return peekCachedResource(buildCacheKey(UTILITY_COMPARISON_CACHE_PREFIX, { range }))
}

export async function fetchSharedUtilitySummary(options = {}) {
  return getCachedResource(
    buildCacheKey(UTILITY_SUMMARY_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/admin/dashboard/utilities-summary')
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
      force: Boolean(options.force),
    }
  )
}

export async function fetchSharedUtilityDaily(options = {}) {
  return getCachedResource(
    buildCacheKey(UTILITY_DAILY_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/admin/dashboard/utilities-daily')
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
      force: Boolean(options.force),
    }
  )
}

export async function fetchSharedUtilityComparison(range = '7D', options = {}) {
  return getCachedResource(
    buildCacheKey(UTILITY_COMPARISON_CACHE_PREFIX, { range }),
    async () => {
      const res = await api.get('/api/admin/dashboard/utilities-comparison', {
        params: { range },
      })
      return res.data
    },
    {
      ttl: 30000,
      persist: true,
      force: Boolean(options.force),
    }
  )
}

export function invalidateSharedUtilityCache() {
  invalidateCache([
    UTILITY_SUMMARY_CACHE_PREFIX,
    UTILITY_DAILY_CACHE_PREFIX,
    UTILITY_COMPARISON_CACHE_PREFIX,
  ])
}
