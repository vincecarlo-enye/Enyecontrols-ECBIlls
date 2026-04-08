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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  return config
})

export default api
