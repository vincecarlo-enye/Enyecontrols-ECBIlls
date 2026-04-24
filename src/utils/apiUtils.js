/**
 * utils/apiUtils.js
 * Shared API response unwrapping utilities used across all hooks.
 * Consolidates the duplicated unwrapPayload / unwrapCollection pattern.
 */

/**
 * Unwrap a standard API response envelope.
 * Handles both `{ data: { ... } }` and bare object responses.
 * @param {*} payload
 * @returns {object}
 */
export function unwrapPayload(payload) {
  if (!payload || typeof payload !== 'object') return {}
  return payload.data && typeof payload.data === 'object' ? payload.data : payload
}

/**
 * Unwrap a standard API response that returns an array.
 * Handles both `{ data: [...] }` and bare array responses.
 * @param {*} payload
 * @returns {Array}
 */
export function unwrapCollection(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}
