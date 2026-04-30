import api from "../../lib/api"

export async function getTenantConsumptionReports({ unit = 'all', timeRange = '1m' } = {}) {
  const params = {
    ...(unit && unit !== 'all' ? { unit } : {}),
    ...(timeRange ? { time_range: timeRange, range: timeRange } : {}),
  }

  const { data } = await api.get('/api/tenant/consumption-reports', {
    params,
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
