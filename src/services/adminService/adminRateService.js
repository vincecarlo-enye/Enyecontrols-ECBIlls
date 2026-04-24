import api from "../../lib/api";
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'

const RATE_CACHE_PREFIX = 'admin:rates'
const SHARED_RATE_CACHE_PREFIX = 'shared:rates'
const RATE_HISTORY_CACHE_PREFIX = 'rates:history'

function getStoredRole() {
    try {
        const raw = localStorage.getItem('sb_auth_user')
        const user = raw ? JSON.parse(raw) : null
        return user?.role || null
    } catch {
        return null
    }
}

export function getAdminRatesSnapshot() {
    const role = getStoredRole()
    return peekCachedResource(buildCacheKey(RATE_CACHE_PREFIX, { role }))
}

export async function fetchAdminRates(options = {}) {
    const role = getStoredRole()
    return getCachedResource(
        buildCacheKey(RATE_CACHE_PREFIX, { role }),
        async () => {
            const endpoint = role === 'super_admin' ? '/api/super-admin/rates' : '/api/rates'
            const res = await api.get(endpoint)
            return res.data
        },
        {
            ttl: 60000,
            force: options?.force === true,
            persist: true,
        }
    )
}

export async function createAdminRate(payload) {
    if (getStoredRole() !== 'super_admin') {
        throw new Error('Only super admins can create rates.')
    }
    const res = await api.post('/api/super-admin/rates', payload)
    invalidateCache([
        RATE_CACHE_PREFIX,
        SHARED_RATE_CACHE_PREFIX,
        RATE_HISTORY_CACHE_PREFIX,
    ])
    return res.data
}

export async function updateAdminRate(id, payload) {
    if (getStoredRole() !== 'super_admin') {
        throw new Error('Only super admins can update rates.')
    }
    const res = await api.put(`/api/super-admin/rates/${id}`, payload)
    invalidateCache([
        RATE_CACHE_PREFIX,
        SHARED_RATE_CACHE_PREFIX,
        RATE_HISTORY_CACHE_PREFIX,
    ])
    return res.data
}

export async function deleteAdminRate(id) {
    if (getStoredRole() !== 'super_admin') {
        throw new Error('Only super admins can delete rates.')
    }
    const res = await api.delete(`/api/super-admin/rates/${id}`)
    invalidateCache([
        RATE_CACHE_PREFIX,
        SHARED_RATE_CACHE_PREFIX,
        RATE_HISTORY_CACHE_PREFIX,
    ])
    return res.data
}
