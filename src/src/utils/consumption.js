/**
 * utils/consumption.js — API-aware replacement for the previous mock version.
 *
 * The original file imported a static utilities.json and returned hard-coded
 * monthly consumption figures. All facility/admin consumption data is now
 * fetched from the backend via:
 *
 *   - facilityConsumptionService  →  GET /api/facility/consumption
 *   - adminUsageService           →  GET /api/admin/usages/omni (+ dashboard endpoints)
 *
 * The helpers below are kept for backwards compatibility so that any component
 * that still imports from this module does not break at runtime. They now
 * return empty/zero values and will be phased out once every call-site has been
 * migrated to use the real API hooks.
 */

/**
 * @deprecated Use useFacilityConsumption() hook instead.
 * Returns an empty series; retained only so old imports do not crash.
 */
export function getCombinedConsumption(_units = []) {
  return []
}

/**
 * @deprecated No longer backed by static JSON.
 * Returns an empty object; retained only so old imports do not crash.
 */
export const MONTHLY_CONSUMPTION = {}
