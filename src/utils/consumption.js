import utilitiesData from '@/data/mock/utilities.json'

const { monthlyConsumption: MONTHLY_CONSUMPTION = {} } = utilitiesData

export function getCombinedConsumption(units = []) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

  return months.map((month) => {
    const combined = { month, electricity: 0, water: 0, thermal: 0 }

    units.forEach((unit) => {
      const rows = MONTHLY_CONSUMPTION[unit]
      if (!rows) return
      const row = rows.find((entry) => entry.month === month)
      if (!row) return
      combined.electricity += Number(row.electricity || 0)
      combined.water += Number(row.water || 0)
      combined.thermal += Number(row.thermal || 0)
    })

    return combined
  })
}

export { MONTHLY_CONSUMPTION }
