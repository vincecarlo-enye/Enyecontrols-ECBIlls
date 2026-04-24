import { fetchAdminTenants, fetchAvailableTenantUsers } from './adminTenantService'
import { fetchAdminUnits } from './adminUnitService'

const TTL_MS = 30000

const cache = {
  tenants: { value: null, promise: null, expiresAt: 0 },
  units: { value: null, promise: null, expiresAt: 0 },
  tenantUsers: { value: null, promise: null, expiresAt: 0 },
}

function isFresh(entry) {
  return entry.value != null && entry.expiresAt > Date.now()
}

async function loadEntry(key, loader, force = false) {
  const entry = cache[key]

  if (!force && isFresh(entry)) {
    return entry.value
  }

  if (!force && entry.promise) {
    return entry.promise
  }

  entry.promise = Promise.resolve()
    .then(loader)
    .then((value) => {
      entry.value = value
      entry.expiresAt = Date.now() + TTL_MS
      entry.promise = null
      return value
    })
    .catch((error) => {
      entry.promise = null
      throw error
    })

  return entry.promise
}

export function invalidateAdminDirectory(keys = ['tenants', 'units', 'tenantUsers']) {
  keys.forEach((key) => {
    if (!cache[key]) return
    cache[key].value = null
    cache[key].promise = null
    cache[key].expiresAt = 0
  })
}

export function getSharedAdminTenants(options = {}) {
  return loadEntry(
    'tenants',
    async () => {
      const res = await fetchAdminTenants()
      return Array.isArray(res?.data) ? res.data : []
    },
    options.force === true
  )
}

export function getSharedAdminUnits(options = {}) {
  return loadEntry(
    'units',
    async () => {
      const res = await fetchAdminUnits()
      return Array.isArray(res?.data) ? res.data : []
    },
    options.force === true
  )
}

export function getSharedTenantUsers(options = {}) {
  return loadEntry(
    'tenantUsers',
    async () => {
      const res = await fetchAvailableTenantUsers()
      return Array.isArray(res?.data) ? res.data : []
    },
    options.force === true
  )
}
