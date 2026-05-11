/**
 * useTenantUtilityCards.js
 *
 * Mirrors the superadmin UtilityCard logic for the tenant role.
 *
 * Key difference vs the shared useUtilityDashboard:
 *   - Superadmin/Admin reads from building-wide meter watch-names via
 *     /api/admin/dashboard/utilities-*
 *   - Tenants have their own meter per unit; consumption comes from their
 *     own bill items, scoped to the tenant's assigned unit(s).
 *
 * This hook:
 *   1. Accepts a time-range filter (7D / 1M / 1Y) — same options as superadmin.
 *   2. Aggregates bill-item consumption into time-bucketed series data.
 *   3. Returns metric objects ready to spread onto <UtilityCard />.
 */

import { normalizeUtilityKey } from '@/utils/utilityTypes'
import { buildUtilityCardMetric } from '@/utils/utilityCards'
import { useMemo } from 'react'

// ── helpers ────────────────────────────────────────────────────────────────

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getBillDate(bill) {
  const raw = bill?.raw ?? {}
  const value = raw?.billing_end || raw?.due_date || raw?.created_at || null
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Extract per-utility consumption from a single bill's items.
 */
function sumBillItems(items = []) {
  const summary = { electricity: 0, water: 0, thermal: 0 }

  items.forEach((item) => {
    const raw = normalizeUtilityKey(item?.type || item?.utility_type || item?.rate?.type || '')
    const key = raw === 'electric' ? 'electricity' : raw
    if (!key || !(key in summary)) return
    summary[key] += toNumber(item?.consumption ?? item?.quantity)
  })

  return summary
}

/**
 * Index bills by a string key (YYYY-MM-DD for daily, YYYY-MM for monthly,
 * YYYY-Www for weekly) so each bucket lookup is O(1).
 */
function indexBills(bills, keyFn) {
  const index = new Map()
  bills.forEach((bill) => {
    const date = getBillDate(bill)
    if (!date) return
    const key = keyFn(date)
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(bill)
  })
  return index
}

function consumptionFromBills(billList, utilityKey) {
  return billList.reduce((sum, bill) => {
    const items = bill?.raw?.items || bill?.raw?.bill_items || []
    return sum + (sumBillItems(items)[utilityKey] ?? 0)
  }, 0)
}

/**
 * 7D: last 7 calendar days, oldest left → today rightmost.
 * Mirrors the backend: for (i = 6; i >= 0; i--) { date = now - i days }
 */
function buildDailySeries(bills, utilityKey) {
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const now = new Date()
  const index = indexBills(bills, (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  )

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (6 - i))   // i=0 → 6 days ago, i=6 → today
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const label = DAY_LABELS[date.getDay()]
    const billList = index.get(key) || []
    return { label, value: Number(consumptionFromBills(billList, utilityKey).toFixed(2)) }
  })
}

/**
 * 1M: Week 1–4 of the current month, same as backend buildWeeklySeries.
 */
function buildWeeklySeries(bills, utilityKey) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()

  const weeks = [
    { label: 'Week 1', start: 1,  end: 7 },
    { label: 'Week 2', start: 8,  end: 14 },
    { label: 'Week 3', start: 15, end: 21 },
    { label: 'Week 4', start: 22, end: lastDay },
  ]

  return weeks.map(({ label, start, end }) => {
    const matchingBills = bills.filter((bill) => {
      const date = getBillDate(bill)
      if (!date) return false
      return date.getFullYear() === year &&
             date.getMonth() === month &&
             date.getDate() >= start &&
             date.getDate() <= end
    })
    return { label, value: Number(consumptionFromBills(matchingBills, utilityKey).toFixed(2)) }
  })
}

/**
 * 1Y: last 7 months oldest-first, current month rightmost.
 * Mirrors the backend buildMonthlySeries (but capped at 7 for the bar chart).
 */
function buildMonthlySeries(bills, utilityKey) {
  const now = new Date()
  const index = indexBills(bills, (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  )

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1) // i=0 → 6mo ago, i=6 → this month
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'short' })
    const billList = index.get(key) || []
    return { label, value: Number(consumptionFromBills(billList, utilityKey).toFixed(2)) }
  })
}

/**
 * Build the series for the UtilityCard bar chart.
 */
function buildSeries(bills, utilityKey, filter) {
  switch (filter) {
    case '1Y': return buildMonthlySeries(bills, utilityKey)
    case '1M': return buildWeeklySeries(bills, utilityKey)
    default:   return buildDailySeries(bills, utilityKey)
  }
}

/**
 * Compute total consumption within the active range window.
 */
function computePeriodConsumption(bills, utilityKey, filter) {
  const now = new Date()
  let cutoff

  if (filter === '7D') {
    cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 6)
    cutoff.setHours(0, 0, 0, 0)
  } else if (filter === '1M') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  }

  return bills.reduce((sum, bill) => {
    const date = getBillDate(bill)
    if (!date || date < cutoff) return sum
    const items = bill?.raw?.items || bill?.raw?.bill_items || []
    return sum + (sumBillItems(items)[utilityKey] ?? 0)
  }, 0)
}

/**
 * Compute a simple trend % between the two most recent period values in
 * the series — matches the superadmin approach.
 */
function computeTrendFromSeries(series) {
  if (!Array.isArray(series) || series.length < 2) return 0
  const last = toNumber(series[series.length - 1]?.value)
  const prev = toNumber(series[series.length - 2]?.value)
  if (prev === 0) return last > 0 ? 100 : 0
  return Number((((last - prev) / prev) * 100).toFixed(1))
}

// ── hook ───────────────────────────────────────────────────────────────────

/**
 * @param {Array}  bills        - Normalized bills (from useBills / tenant context)
 * @param {object} billingRates - Rate map from useTenantRates
 * @param {string} filter       - '7D' | '1M' | '1Y'
 * @returns {{ electricity, water, thermal }}  — props ready for <UtilityCard />
 */
export function useTenantUtilityCards(bills = [], billingRates = null, filter = '7d') {
  return useMemo(() => {
    const normalizedFilter = String(filter || '7d').toUpperCase()
    const UTILITY_KEYS = ['electricity', 'water', 'thermal']

    const cards = {}

    UTILITY_KEYS.forEach((key) => {
      const series = buildSeries(bills, key, normalizedFilter)
      const periodUsage = computePeriodConsumption(bills, key, normalizedFilter)
      const trend = computeTrendFromSeries(series)

      const unitMap = { electricity: 'kWh', water: 'm3', thermal: 'kBTU' }

      cards[key] = buildUtilityCardMetric({
        type: key,
        usage: periodUsage,
        unit: unitMap[key],
        trend,
        rates: billingRates,
        fallbackEstimatedCost: 0,
        series,
      })
    })

    return cards
  }, [bills, billingRates, filter])
}
