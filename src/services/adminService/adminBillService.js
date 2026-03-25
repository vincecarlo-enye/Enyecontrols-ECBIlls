import api from "../../lib/api"

export async function fetchAdminBills() {
  const res = await api.get('/api/admin/bills')
  return res.data
}

export async function fetchAdminBill(id) {
  const res = await api.get(`/api/admin/bills/${id}`)
  return res.data
}
