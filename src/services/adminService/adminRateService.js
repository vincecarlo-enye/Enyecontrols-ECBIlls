import api, { createFreshRequestConfig } from "../../lib/api";


export async function fetchAdminRates() {
    const res = await api.get('/api/rates', createFreshRequestConfig())
    return res.data
}

export async function createAdminRate(payload) {
    const res = await api.post('/api/super-admin/rates', payload)
    return res.data
}

export async function updateAdminRate(id, payload) {
    const res = await api.put(`/api/super-admin/rates/${id}`, payload)
    return res.data
}

export async function deleteAdminRate(id) {
    const res = await api.delete(`/api/super-admin/rates/${id}`)
    return res.data
}
