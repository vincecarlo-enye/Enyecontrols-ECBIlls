import api from "../../lib/api"
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const ADMIN_OMNI_PAGES_CACHE_PREFIX = 'admin:omni-pages'
const ADMIN_OMNI_PAGE_CACHE_PREFIX = 'admin:omni-page'
const OMNI_PAGES_CACHE_TTL = 5 * 60 * 1000
const OMNI_PAGE_CACHE_TTL = 5 * 60 * 1000

export function getAdminOmniPagesSnapshot() {
  return peekCachedResource(buildCacheKey(ADMIN_OMNI_PAGES_CACHE_PREFIX))
}

export function getAdminOmniPageSnapshot(pageName) {
  if (!pageName) return null
  return peekCachedResource(buildCacheKey(ADMIN_OMNI_PAGE_CACHE_PREFIX, { pageName }))
}

export async function fetchAdminOmniPages() {
  return getCachedResource(
    buildCacheKey(ADMIN_OMNI_PAGES_CACHE_PREFIX),
    async () => {
      const res = await api.get('/api/admin/usages/omni')
      return res.data
    },
    {
      ttl: OMNI_PAGES_CACHE_TTL,
      persist: true,
    }
  )
}

export async function fetchAdminOmniPage(pageName) {
  return getCachedResource(
    buildCacheKey(ADMIN_OMNI_PAGE_CACHE_PREFIX, { pageName }),
    async () => {
      const res = await api.get(`/api/admin/usages/omni/${encodeURIComponent(pageName)}`)
      return res.data
    },
    {
      ttl: OMNI_PAGE_CACHE_TTL,
      persist: true,
    }
  )
}

export async function syncAdminOmniPage(pageName) {
  const res = await api.post(`/api/admin/usages/sync/${encodeURIComponent(pageName)}`)
  invalidateCache([
    ADMIN_OMNI_PAGES_CACHE_PREFIX,
    ADMIN_OMNI_PAGE_CACHE_PREFIX,
  ])
  return res.data
}
