import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import { buildCacheKey, getCachedResource, invalidateCache } from '@/lib/requestCache'
import { applyStoredAvatarToUser } from '@/utils/avatarStorage'

const AuthContext = createContext()
let restoreUserPromise = null
let restoreUserToken = null
const AUTH_USER_CACHE_PREFIX = 'auth:user'
const AUTH_USER_STORAGE_KEY = 'sb_auth_user'
const AUTH_TOKEN_STORAGE_KEY = 'auth_token'
const AUTH_USER_REFRESHED_AT_KEY = 'sb_auth_user_refreshed_at'
const AUTH_USER_TTL = 300000

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
      return applyStoredAvatarToUser(response.data)
    },
    {
      ttl: AUTH_USER_TTL,
      force: true,
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
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))
  const [loading, setLoading] = useState(() => !!localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))

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

      if (!savedToken) {
        if (!cancelled) {
          setUser(null)
          setToken(null)
        }
        if (!cancelled) setLoading(false)
        return
      }

      try {
        if (!cancelled) setToken(savedToken)
        api.defaults.headers.common.Authorization = `Bearer ${savedToken}`

        const restoredUser = await fetchRestoredUser(savedToken)
        if (!cancelled) setUser(applyStoredAvatarToUser(restoredUser))
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

  useEffect(() => {
    if (!token || !user) return

    let cancelled = false

    const heartbeat = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

      try {
        const response = await api.get('/api/user')
        if (cancelled) return
        setUser(applyStoredAvatarToUser(response.data))
        invalidateCache(AUTH_USER_CACHE_PREFIX)
      } catch {
        // Session validation failures are handled by normal API interceptors.
      }
    }

    const interval = window.setInterval(heartbeat, 60000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') heartbeat()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [token, user])

  const refreshCurrentUser = useCallback(async () => {
    const response = await api.get('/api/user')
    const nextUser = applyStoredAvatarToUser(response.data)
    setUser(nextUser)
    invalidateCache(AUTH_USER_CACHE_PREFIX)
    return nextUser
  }, [])

  const forceChangePassword = useCallback(async (password, passwordConfirmation) => {
    const response = await api.put('/api/password/force-change', {
      password,
      password_confirmation: passwordConfirmation,
    })
    const nextUser = response?.data?.user || null
    if (nextUser) {
      setUser(applyStoredAvatarToUser(nextUser))
    }
    return response.data
  }, [])

  const updateCurrentUser = useCallback((nextUser) => {
    const userWithStoredAvatar = applyStoredAvatarToUser(nextUser)
    setUser(userWithStoredAvatar)
    return userWithStoredAvatar
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
      setUser(applyStoredAvatarToUser(me))
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
