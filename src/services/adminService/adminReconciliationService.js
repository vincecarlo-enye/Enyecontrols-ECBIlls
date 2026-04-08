import api from '@/lib/api'

export async function fetchAdminReconciliation(params = {}) {
  const res = await api.get('/api/admin/reconciliation', { params })
  return res.data
}
