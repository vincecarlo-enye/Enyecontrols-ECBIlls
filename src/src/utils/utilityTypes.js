/**
 * utils/utilityTypes.js
 * Single source of truth for utility type normalization.
 *
 * Previously there were 4 different normalizeType implementations returning
 * different values ('electric' vs 'electricity', null vs '').
 *
 * Contract:
 *  - normalizeUtilityKey(type)    → 'electricity' | 'water' | 'thermal' | ''
 *  - normalizeUtilityShort(type)  → 'electric'    | 'water' | 'thermal' | 'electric'
 *
 * Use normalizeUtilityKey  in hooks/services that work with API data.
 * Use normalizeUtilityShort in UI components that key into colorMap / iconMap.
 */

/**
 * Normalize a utility type string to the canonical long-form key.
 * Returns '' for unrecognized types.
 * @param {string} type
 * @returns {'electricity'|'water'|'thermal'|''}
 */
export function normalizeUtilityKey(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'electric' || t === 'electricity' || t.includes('power')) return 'electricity'
  if (t === 'water') return 'water'
  if (t === 'thermal' || t.includes('btu')) return 'thermal'
  return ''
}

/**
 * Normalize a utility type string to the short UI form used in component maps.
 * Falls back to 'electric' for unknown types.
 * @param {string} type
 * @returns {'electric'|'water'|'thermal'}
 */
export function normalizeUtilityShort(type) {
  const key = normalizeUtilityKey(type)
  if (key === 'electricity') return 'electric'
  if (key === 'water') return 'water'
  if (key === 'thermal') return 'thermal'
  return 'electric'
}
