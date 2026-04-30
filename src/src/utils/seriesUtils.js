/**
 * Shared series utilities used across admin, facility, finance, and tenant hooks.
 * Consolidates duplicated normalizeSeries / computeTrendPercent logic.
 */

/**
 * Normalize a raw API array into { day, date, usage } rows suitable for charts.
 * @param {Array} rows
 * @returns {Array<{ day: string, date: string|null, usage: number }>}
 */
export function normalizeSeries(rows = []) {
  return rows.map((item, index) => ({
    day: item.day || item.label || item.date || `Day ${index + 1}`,
    date: item.date || null,
    usage: Number(item.usage ?? item.value ?? item.total ?? 0),
  }))
}

/**
 * Compute percent change between the last two values in a series.
 * Series items must have a `usage` or `value` numeric field.
 * @param {Array} series
 * @returns {number}
 */
export function computeTrendPercent(series = []) {
  if (!Array.isArray(series) || series.length < 2) return 0
  const last = Number(series[series.length - 1]?.usage ?? series[series.length - 1]?.value ?? 0)
  const prev = Number(series[series.length - 2]?.usage ?? series[series.length - 2]?.value ?? 0)
  if (prev === 0) return last === 0 ? 0 : 100
  return Number((((last - prev) / prev) * 100).toFixed(1))
}

/**
 * Build a { text, className } badge descriptor for a trend value.
 * @param {number} value
 * @param {string} positiveClass
 * @param {string} negativeClass
 * @returns {{ text: string, className: string }}
 */
export function badgeMeta(value, positiveClass, negativeClass) {
  const sign = value > 0 ? '+' : ''
  return {
    text: `${sign}${value}%`,
    className: value >= 0 ? positiveClass : negativeClass,
  }
}
