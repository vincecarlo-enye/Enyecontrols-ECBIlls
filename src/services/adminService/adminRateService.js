import api from "../../lib/api";


export async function fetchAdminRates() {
    const res = await api.get('/api/admin/rates')
    return res.data
}

export async function updateAdminRate(id, payload) {
    const res = await api.put(`/api/admin/rates/${id}`, payload)
    return res.data
}