import axios from 'axios'

function resolveBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) return envUrl

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000'
    }

    return `${window.location.protocol}//${host}:8000`
  }

  return 'http://127.0.0.1:8000'
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function recordRequestProfile(entry) {
  if (typeof window === 'undefined') return

  const bucket = window.__ecBillsApiProfile || {
    entries: [],
    totals: {},
  }

  bucket.entries.push(entry)
  if (bucket.entries.length > 150) {
    bucket.entries.shift()
  }

  const aggregateKey = `${entry.method} ${entry.url}`
  const current = bucket.totals[aggregateKey] || {
    count: 0,
    totalMs: 0,
    maxMs: 0,
    lastMs: 0,
    status: null,
  }

  current.count += 1
  current.totalMs += entry.durationMs
  current.maxMs = Math.max(current.maxMs, entry.durationMs)
  current.lastMs = entry.durationMs
  current.status = entry.status
  bucket.totals[aggregateKey] = current
  window.__ecBillsApiProfile = bucket

  if (entry.durationMs >= 800) {
    console.warn(`[API SLOW] ${aggregateKey} ${entry.durationMs.toFixed(1)}ms`, entry)
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  config.metadata = {
    startedAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const startedAt = response?.config?.metadata?.startedAt
    const durationMs = typeof performance !== 'undefined' && typeof startedAt === 'number'
      ? performance.now() - startedAt
      : 0

    recordRequestProfile({
      method: String(response?.config?.method || 'get').toUpperCase(),
      url: response?.config?.url || '',
      status: response?.status || null,
      durationMs,
      params: response?.config?.params || null,
    })

    return response
  },
  (error) => {
    const startedAt = error?.config?.metadata?.startedAt
    const durationMs = typeof performance !== 'undefined' && typeof startedAt === 'number'
      ? performance.now() - startedAt
      : 0

    recordRequestProfile({
      method: String(error?.config?.method || 'get').toUpperCase(),
      url: error?.config?.url || '',
      status: error?.response?.status || null,
      durationMs,
      params: error?.config?.params || null,
    })

    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('sb_auth_user')
      localStorage.removeItem('omni_token')
      delete api.defaults.headers.common.Authorization

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
