/**
 * tenantService.js
 * Service layer for tenant and unit management.
 * Swap mock implementations for real API calls when backend is ready.
 */

import initialTenants from '@/data/mock/tenants.json'
import initialUnits from '@/data/mock/units.json'

let _tenants = [...initialTenants]
let _units = [...initialUnits]

function delay(ms = 0) {
  return new Promise((res) => setTimeout(res, ms))
}

// ─── Tenants ────────────────────────────────────────────────────────────────

export async function fetchTenants() {
  await delay()
  return [..._tenants]
}

export async function fetchTenantById(id) {
  await delay()
  return _tenants.find((t) => t.id === id) ?? null
}

export async function createTenant(tenantData) {
  await delay()
  const tenantUnits = Array.isArray(tenantData.units)
    ? tenantData.units.filter(Boolean)
    : []

  const newTenant = {
    ...tenantData,
    id: `T-${String(Date.now()).slice(-3)}`,
    units: tenantUnits,
  }

  _tenants = [..._tenants, newTenant]

  if (tenantUnits.length > 0) {
    _units = _units.map((u) =>
      tenantUnits.includes(u.unit)
        ? { ...u, tenant: newTenant.name, status: 'occupied' }
        : u
    )
  }

  return { tenant: { ...newTenant }, units: [..._units] }
}

export async function updateTenant(id, data) {
  await delay()
  const old = _tenants.find((t) => t.id === id)
  const oldUnits = old?.units || []
  const newUnits = Array.isArray(data.units) ? data.units.filter(Boolean) : []
  const removedUnits = oldUnits.filter((u) => !newUnits.includes(u))
  const addedUnits = newUnits.filter((u) => !oldUnits.includes(u))

  _units = _units.map((u) => {
    if (removedUnits.includes(u.unit)) return { ...u, tenant: null, status: 'vacant' }
    if (addedUnits.includes(u.unit)) return { ...u, tenant: data.name || old?.name, status: 'occupied' }
    if (newUnits.includes(u.unit) && data.name && u.tenant === old?.name)
      return { ...u, tenant: data.name }
    return u
  })

  _tenants = _tenants.map((t) =>
    t.id === id ? { ...t, ...data, units: newUnits } : t
  )

  return { tenant: _tenants.find((t) => t.id === id), units: [..._units] }
}

export async function deleteTenant(id) {
  await delay()
  const tenant = _tenants.find((t) => t.id === id)

  if (tenant?.units?.length) {
    _units = _units.map((u) =>
      tenant.units.includes(u.unit) ? { ...u, tenant: null, status: 'vacant' } : u
    )
  }

  _tenants = _tenants.filter((t) => t.id !== id)
  return { units: [..._units] }
}

// ─── Units ───────────────────────────────────────────────────────────────────

export async function fetchUnits() {
  await delay()
  return [..._units]
}

export async function createUnit(unitData) {
  await delay()
  const newUnit = { ...unitData, id: `U-${String(Date.now()).slice(-3)}` }
  _units = [..._units, newUnit]
  return { ...newUnit }
}

export async function updateUnit(id, data) {
  await delay()
  _units = _units.map((u) => (u.id === id ? { ...u, ...data } : u))
  return _units.find((u) => u.id === id)
}

export async function deleteUnit(id) {
  await delay()
  _units = _units.filter((u) => u.id !== id)
  return true
}
