import api from "../../lib/api"

export async function fetchTenantBills(params = {}) {
  const res = await api.get('/api/tenant/bills', { params })
  return res.data
}

export async function fetchTenantBill(id) {
  const res = await api.get(`/api/tenant/bills/${id}`)
  return res.data
}

export async function fetchTenantPayments() {
  const res = await api.get('/api/tenant/payments')
  return res.data
}

export async function submitTenantBillPayment(billId, payload) {
  const formData = new FormData()

  formData.append('amount', payload.amount)
  formData.append('payment_method', payload.payment_method)

  if (payload.reference_no) {
    formData.append('reference_no', payload.reference_no)
  }

  if (payload.notes) {
    formData.append('notes', payload.notes)
  }

  if (payload.proof_image instanceof File) {
    formData.append('proof_image', payload.proof_image)
  }

  const res = await api.post(`/api/tenant/bills/${billId}/payments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return res.data
}
