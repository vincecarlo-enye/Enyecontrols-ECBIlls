/**
 * hooks/adminHooks/utils.js
 * Shared utilities for admin hooks.
 * Consolidates the duplicated normalizeResponse pattern.
 */

/**
 * Unwrap a standard admin API response into a { data } shape.
 * Handles both `{ data: { ... } }` and bare object responses.
 * @param {*} response
 * @returns {object}
 */
export function normalizeResponse(response) {
  return response?.data || response || {}
}
