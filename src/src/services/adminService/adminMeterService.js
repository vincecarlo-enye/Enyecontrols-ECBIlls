import api from "../../lib/api"
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const ADMIN_METERS_CACHE_PREFIX = 'admin:meters'
const AVAILABLE_METER_WATCHES_CACHE_PREFIX = 'admin:meter-watches'

export function getAdminMetersSnapshot(params = {}) {
  const shouldPaginate = params?.paginate || params?.page || params?.per_page
  const requestParams = shouldPaginate ? { paginate: 1, ...params } : params
  const role = getStoredRole()
  return peekCachedResource(buildCacheKey(ADMIN_METERS_CACHE_PREFIX, { role, ...requestParams }))
}

function getStoredRole() {
  try {
    const raw = localStorage.getItem('sb_auth_user')
    const user = raw ? JSON.parse(raw) : null
    return user?.role || null
  } catch {
    return null
  }
}

function isAuthorizationError(error) {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    ''

  return (
    error?.response?.status === 401 ||
    error?.response?.status === 403 ||
    /invalid token|authorisation denied|authorization denied/i.test(String(message))
  )
}

export async function fetchAdminMeters(params = {}) {
  const shouldPaginate = params?.paginate || params?.page || params?.per_page
  const requestParams = shouldPaginate ? { paginate: 1, ...params } : params
  const role = getStoredRole()

  return getCachedResource(
    buildCacheKey(ADMIN_METERS_CACHE_PREFIX, { role, ...requestParams }),
    async () => {
      if (role !== 'super_admin') {
        const res = await api.get('/api/admin/meters', { params: requestParams })
        return res.data
      }

      try {
        const res = await api.get('/api/super-admin/meters', { params: requestParams })
        return res.data
      } catch (error) {
        if (error?.response?.status !== 403) {
          throw error
        }

        const fallback = await api.get('/api/admin/meters', { params: requestParams })
        return fallback.data
      }
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}

export async function fetchAdminMeter(id) {
  const role = getStoredRole()

  if (role !== 'super_admin') {
    const res = await api.get(`/api/admin/meters/${id}`)
    return res.data
  }

  try {
    const res = await api.get(`/api/super-admin/meters/${id}`)
    return res.data
  } catch (error) {
    if (error?.response?.status !== 403) {
      throw error
    }

    const fallback = await api.get(`/api/admin/meters/${id}`)
    return fallback.data
  }
}

export async function fetchAvailableMeterWatches(pageName) {
  const role = getStoredRole()

  return getCachedResource(
    buildCacheKey(AVAILABLE_METER_WATCHES_CACHE_PREFIX, { role, pageName }),
    async () => {
      if (role !== 'super_admin') {
        try {
          const fallback = await api.get(`/api/admin/usages/omni/${encodeURIComponent(pageName)}`)
          return fallback.data
        } catch (error) {
          if (isAuthorizationError(error)) {
            return { data: [] }
          }

          throw error
        }
      }

      try {
        const res = await api.get('/api/super-admin/meters/available', {
          params: { page_name: pageName },
        })
        return res.data
      } catch (error) {
        try {
          const fallback = await api.get(`/api/admin/usages/omni/${encodeURIComponent(pageName)}`)
          return fallback.data
        } catch (fallbackError) {
          if (isAuthorizationError(fallbackError)) {
            return { data: [] }
          }

          throw fallbackError
        }
      }
    },
    {
      ttl: 60000,
      persist: true,
    }
  )
}

export async function createAdminMeter(payload) {
  const role = getStoredRole()
  const endpoint = role === 'super_admin' ? '/api/super-admin/meters' : '/api/admin/meters'
  const res = await api.post(endpoint, payload)
  invalidateCache([ADMIN_METERS_CACHE_PREFIX, AVAILABLE_METER_WATCHES_CACHE_PREFIX])
  return res.data
}

export async function updateAdminMeter(id, payload) {
  const role = getStoredRole()
  const endpoint = role === 'super_admin' ? `/api/super-admin/meters/${id}` : `/api/admin/meters/${id}`
  const res = await api.put(endpoint, payload)
  invalidateCache([ADMIN_METERS_CACHE_PREFIX, AVAILABLE_METER_WATCHES_CACHE_PREFIX])
  return res.data
}

export async function deleteAdminMeter(id) {
  const role = getStoredRole()
  const endpoint = role === 'super_admin' ? `/api/super-admin/meters/${id}` : `/api/admin/meters/${id}`
  const res = await api.delete(endpoint)
  invalidateCache([ADMIN_METERS_CACHE_PREFIX, AVAILABLE_METER_WATCHES_CACHE_PREFIX])
  return res.data
}

