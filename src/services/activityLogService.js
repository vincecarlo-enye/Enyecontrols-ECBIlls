import api from '@/lib/api'

export async function fetchActivityLogs(params = {}) {
  const res = await api.get('/api/activity-logs', {
    params: {
      paginate: 1,
      ...params,
    },
  })

  return res.data
}
