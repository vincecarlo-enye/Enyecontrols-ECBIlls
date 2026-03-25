import api from "../../lib/api"

export async function sendAdminAIChat(question) {
  const res = await api.post('/api/admin/ai/chat', { question })
  return res.data
}

export async function sendTenantAIChat(question) {
  const res = await api.post('/api/tenant/ai/chat', { question })
  return res.data
}

export async function analyzeAdminMeter(meterId) {
  const res = await api.get('/api/admin/ai/analyze-meter', {
    params: { meter_id: meterId },
  })
  return res.data
}

export async function analyzeTenantMeter(meterId) {
  const res = await api.get('/api/tenant/ai/analyze-meter', {
    params: { meter_id: meterId },
  })
  return res.data
}