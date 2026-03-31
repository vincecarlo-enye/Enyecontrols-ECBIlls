import api from "../../lib/api"

export async function getTenantConsumptionReports(unit = 'all') {
  const { data } = await api.get('/api/tenant/consumption-reports', {
    params: unit && unit !== 'all' ? { unit } : {},
  })
  return data?.data ?? {
    unit: null,
    units: [],
    summary: {
      electricity: 0,
      water: 0,
      thermal: 0,
    },
    monthly: [],
  }
}
