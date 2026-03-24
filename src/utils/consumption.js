import utilitiesData from '@/data/mock/utilities.json'

const { monthlyConsumption: MONTHLY_CONSUMPTION } = utilitiesData

/**
 * Combine monthly consumption data across multiple units.
 * @param {string[]} units - Array of unit IDs (e.g. ['12F-A', '12F-B'])
 * @returns {{ month: string, electricity: number, water: number, thermal: number }[]}
 */
export function getCombinedConsumption(units) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  return months.map(month => {
    const combined = { month, electricity: 0, water: 0, thermal: 0 }
    units.forEach(unit => {
      const data = MONTHLY_CONSUMPTION[unit]
      if (data) {
        const row = data.find(r => r.month === month)
        if (row) {
          combined.electricity += row.electricity
          combined.water += row.water
          combined.thermal += row.thermal
        }
      }
    })
    return combined
  })
}

export { MONTHLY_CONSUMPTION }
