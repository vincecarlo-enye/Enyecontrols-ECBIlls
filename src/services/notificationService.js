import api from '@/lib/api'
import { buildCacheKey, getCachedResource, invalidateCache, peekCachedResource } from '@/lib/requestCache'
import { getAdminNotificationPreferences } from '@/services/adminService/adminNotificationPreferencesService'

const NOTIFICATIONS_CACHE_PREFIX = 'notifications'

function getCurrentUserId() {
  const user = getStoredAuthUser()
  return user?.id || user?.email || user?.username || 'anonymous'
}

function buildNotificationKey(params = {}) {
  return buildCacheKey(`${NOTIFICATIONS_CACHE_PREFIX}:${getCurrentUserId()}`, params)
}

function invalidateCurrentUserCache() {
  invalidateCache(`${NOTIFICATIONS_CACHE_PREFIX}:${getCurrentUserId()}`)
}

function getStoredAuthUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem('sb_auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function inferNotificationPreferenceKey(notification = {}) {
  const explicitKey =
    notification?.preference_key
    || notification?.preferenceKey
    || notification?.meta?.preference_key
    || notification?.meta?.preferenceKey
    || null

  if (explicitKey) return explicitKey

  const title = String(notification?.title || '').toLowerCase()
  const message = String(notification?.message || '').toLowerCase()
  const entityType = String(notification?.entity_type || '').toLowerCase()

  if (entityType === 'bill' && title.includes('bill generated')) return 'billGenerated'
  if (entityType === 'payment' && title.includes('payment received')) return 'paymentReceived'
  if (entityType === 'payment' && message.includes('payment received')) return 'paymentReceived'
  if (entityType === 'bill_overdue' || title.includes('overdue bill') || message.includes('overdue bill')) return 'overdueBills'
  if (entityType === 'utility_spike' || title.includes('utility spike') || message.includes('usage spike')) return 'utilitySpikeDetected'
  if (entityType === 'maintenance' || title.includes('maintenance reminder') || message.includes('maintenance notification')) return 'maintenanceReminders'

  return null
}

function shouldIncludeNotificationForCurrentUser(notification = {}) {
  const user = getStoredAuthUser()
  const role = user?.role || null

  if (!role) return true

  const preferenceKey = inferNotificationPreferenceKey(notification)
  if (!preferenceKey) return true

  const preferences = getAdminNotificationPreferences(
    user?.id || user?.email || user?.username || user?.name,
    role
  )

  if (!(preferenceKey in preferences)) return true
  return Boolean(preferences[preferenceKey])
}

function filterNotificationsForCurrentUser(rows = []) {
  return rows.filter((notification) => shouldIncludeNotificationForCurrentUser(notification))
}

export function getNotificationsSnapshot(params = {}) {
  const requestParams = {
    paginate: 1,
    ...params,
  }
  const snapshot = peekCachedResource(buildNotificationKey(requestParams))

  if (!snapshot) return snapshot

  return {
    ...snapshot,
    data: filterNotificationsForCurrentUser(Array.isArray(snapshot?.data) ? snapshot.data : []),
  }
}

export async function addLocalNotification(notification = {}) {
  const payload = {
    title: notification.title || 'System Notification',
    message: notification.message || '',
    recipient_user_id: notification.recipient_user_id || notification.user_id || null,
    recipient_tenant_id: notification.recipient_tenant_id || notification.recipientTenantId || notification.tenant_id || notification.recipient_tenant || null,
    target_roles: Array.isArray(notification.target_roles)
      ? notification.target_roles
      : Array.isArray(notification.targetRoles)
        ? notification.targetRoles
        : notification.role
          ? [notification.role]
          : [],
    entity_type: notification.entity_type || null,
    entity_id: notification.entity_id || null,
    meta: notification.meta || (notification.preferenceKey ? { preference_key: notification.preferenceKey } : null),
  }

  const res = await api.post('/api/notifications', payload)
  invalidateCurrentUserCache()
  return res.data?.data || res.data || null
}

export async function fetchNotifications(params = {}) {
  const requestParams = {
    paginate: 1,
    ...params,
  }
  const requestKey = buildNotificationKey(requestParams)
  return getCachedResource(
    requestKey,
    async () => {
      const res = await api.get('/api/notifications', {
        params: requestParams,
      })
      return {
        ...res.data,
        data: filterNotificationsForCurrentUser(Array.isArray(res.data?.data) ? res.data.data : []),
      }
    },
    {
      ttl: 15000,
      persist: true,
    }
  )
}

export async function fetchNotification(id) {
  return getCachedResource(
    buildCacheKey(`${NOTIFICATIONS_CACHE_PREFIX}:detail`, { id }),
    async () => {
      const res = await api.get(`/api/notifications/${id}`)
      const detail = res.data?.data || res.data || null
      if (!shouldIncludeNotificationForCurrentUser(detail)) {
        return { ...res.data, data: null }
      }
      return res.data
    },
    {
      ttl: 15000,
      persist: true,
    }
  )
}

export async function markNotificationAsRead(id) {
  const res = await api.post(`/api/notifications/${id}/read`)
  invalidateCurrentUserCache()
  return res.data
}

export async function markAllNotificationsAsRead(notifications = []) {
  const unread = notifications.filter((item) => !item.is_read)
  if (unread.length === 0) return
  await Promise.all(unread.map((item) => api.post(`/api/notifications/${item.id}/read`)))
  invalidateCurrentUserCache()
}