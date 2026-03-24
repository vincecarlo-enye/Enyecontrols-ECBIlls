/**
 * reportService.js
 * Service layer for report generation and consumption data.
 * Swap mock implementations for real API calls when backend is ready.
 */

import utilitiesData from '@/data/mock/utilities.json'

const { stats, electricityDaily, waterDaily, thermalDaily, rateConfig } = utilitiesData

// ─── Utility Stats ────────────────────────────────────────────────────────────

export async function fetchUtilityStats() {
  return { ...stats }
}

export async function fetchDailyUsage() {
  return {
    electricity: [...electricityDaily],
    water: [...waterDaily],
    thermal: [...thermalDaily],
  }
}

export async function fetchRateConfig() {
  return { ...rateConfig }
}

// ─── Report Exports ───────────────────────────────────────────────────────────

/**
 * Generate and download a usage report as CSV.
 * @param {Array} data  Array of usage rows
 * @param {string} filename
 */
export function exportReportCSV(data, filename = 'Report') {
  if (!data?.length) return

  const headers = Object.keys(data[0])
  const rows = [headers, ...data.map((row) => headers.map((h) => row[h] ?? ''))]

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), {
    href: url,
    download: `${filename}.csv`,
  }).click()
  URL.revokeObjectURL(url)
}
