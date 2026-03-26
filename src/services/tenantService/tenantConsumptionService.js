import api from "../../lib/api"

export async function getTenantConsumptionReports() {
  const { data } = await api.get('/api/tenant/consumption-reports')
  return data?.data ?? {
    unit: null,
    summary: {
      electricity: 0,
      water: 0,
      thermal: 0,
    },
    monthly: [],
  }
}