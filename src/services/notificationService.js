import api from '@/lib/api'

export async function fetchNotifications(params = {}) {
  const res = await api.get('/api/notifications', {
    params: {
      paginate: 1,
      ...params,
    },
  })
  return res.data
}

export async function fetchNotification(id) {
  const res = await api.get(`/api/notifications/${id}`)
  return res.data
}

export async function markNotificationAsRead(id) {
  const res = await api.post(`/api/notifications/${id}/read`)
  return res.data
}

export async function markAllNotificationsAsRead() {
  const res = await api.post('/api/notifications/read-all')
  return res.data
}
