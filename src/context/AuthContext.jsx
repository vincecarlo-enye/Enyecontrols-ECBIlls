import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import { buildCacheKey, getCachedResource, invalidateCache } from '@/lib/requestCache'

const AuthContext = createContext()
let restoreUserPromise = null
let restoreUserToken = null
const AUTH_USER_CACHE_PREFIX = 'auth:user'
const AUTH_USER_STORAGE_KEY = 'sb_auth_user'
const AUTH_TOKEN_STORAGE_KEY = 'auth_token'
const AUTH_USER_REFRESHED_AT_KEY = 'sb_auth_user_refreshed_at'
const AUTH_USER_TTL = 300000

function readStoredUser() {
  try {
    const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function isStoredUserFresh() {
  try {
    const refreshedAt = Number(localStorage.getItem(AUTH_USER_REFRESHED_AT_KEY) || 0)
    return refreshedAt > 0 && Date.now() - refreshedAt < AUTH_USER_TTL
  } catch {
    return false
  }
}

function fetchRestoredUser(savedToken) {
  if (restoreUserPromise && restoreUserToken === savedToken) {
    return restoreUserPromise
  }

  restoreUserToken = savedToken
  restoreUserPromise = getCachedResource(
    buildCacheKey(AUTH_USER_CACHE_PREFIX, { token: savedToken }),
    async () => {
      const response = await api.get('/api/user')
      return response.data
    },
    {
      ttl: AUTH_USER_TTL,
      persist: true,
    }
  )
    .finally(() => {
      window.setTimeout(() => {
        if (restoreUserToken === savedToken) {
          restoreUserPromise = null
          restoreUserToken = null
        }
      }, 1000)
    })

  return restoreUserPromise
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))
  const [loading, setLoading] = useState(() => !user && !!localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
      localStorage.setItem(AUTH_USER_REFRESHED_AT_KEY, String(Date.now()))
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY)
      localStorage.removeItem(AUTH_USER_REFRESHED_AT_KEY)
    }
  }, [user])

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      return
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    delete api.defaults.headers.common.Authorization
  }, [token])

  useEffect(() => {
    let cancelled = false

    const restoreAuth = async () => {
      const savedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      const savedUser = readStoredUser()

      if (!savedToken) {
        if (!cancelled) setLoading(false)
        return
      }

      if (savedUser) {
        if (!cancelled) {
          setUser(savedUser)
          setLoading(false)
        }
      }

      try {
        if (!cancelled) setToken(savedToken)
        api.defaults.headers.common.Authorization = `Bearer ${savedToken}`

        if (savedUser && isStoredUserFresh()) {
          return
        }

        const restoredUser = await fetchRestoredUser(savedToken)
        if (!cancelled) setUser(restoredUser)
      } catch {
        if (!cancelled) {
          setUser(null)
          setToken(null)
        }
        localStorage.removeItem(AUTH_USER_STORAGE_KEY)
        localStorage.removeItem(AUTH_USER_REFRESHED_AT_KEY)
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        localStorage.removeItem('omni_token')
        delete api.defaults.headers.common.Authorization
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restoreAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    const response = await api.get('/api/user')
    setUser(response.data)
    invalidateCache(AUTH_USER_CACHE_PREFIX)
    return response.data
  }, [])

  const forceChangePassword = useCallback(async (password, passwordConfirmation) => {
    const response = await api.put('/api/password/force-change', {
      password,
      password_confirmation: passwordConfirmation,
    })
    const nextUser = response?.data?.user || null
    if (nextUser) {
      setUser(nextUser)
    }
    return response.data
  }, [])

  const updateCurrentUser = useCallback((nextUser) => {
    setUser(nextUser)
    return nextUser
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/login', { email, password })
      const data = response.data

      if (!data?.token) {
        return { error: true, message: 'Invalid login response.' }
      }

      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token)
      setToken(data.token)
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`

      const meResponse = await api.get('/api/user')
      const me = meResponse.data
      setUser(me)
      invalidateCache(AUTH_USER_CACHE_PREFIX)
      return me
    } catch (error) {
      return {
        error: true,
        message: error?.response?.data?.message || 'Invalid email or password.',
      }
    }
  }

  const logout = async () => {
    const activeToken = token || localStorage.getItem('auth_token')
    const canAttemptServerLogout = !!activeToken && isStoredUserFresh()

    setUser(null)
    setToken(null)
    setLoading(false)
    delete api.defaults.headers.common.Authorization
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    localStorage.removeItem(AUTH_USER_REFRESHED_AT_KEY)
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    localStorage.removeItem('omni_token')
    invalidateCache(AUTH_USER_CACHE_PREFIX)

    if (!canAttemptServerLogout) return

    try {
      await api.post(
        '/api/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
          validateStatus: (status) => status >= 200 && status < 300 || status === 401,
        }
      )
    } catch {
      //
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        refreshCurrentUser,
        updateCurrentUser,
        forceChangePassword,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
