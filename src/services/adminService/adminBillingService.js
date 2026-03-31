import api from '@/lib/api'

export async function fetchAdminBills(params = {}) {
  const res = await api.get('/api/admin/bills', {
    params: {
      paginate: 1,
      ...params,
    },
  })
  return res.data
}

export async function fetchAdminBill(id) {
  const res = await api.get(`/api/admin/bills/${id}`)
  return res.data
}

export async function generateAdminBill(payload) {
  const res = await api.post('/api/admin/bills/generate', payload)
  return res.data
}

export async function regenerateAdminBill(payload) {
  const res = await api.post('/api/admin/bills/regenerate', payload)
  return res.data
}


export async function deleteAdminBill(id) {
  const res = await api.delete(`/api/admin/bills/${id}`)
  return res.data
}

