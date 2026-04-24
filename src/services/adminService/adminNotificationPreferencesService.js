const STORAGE_KEY_PREFIX = 'admin_notification_preferences'

export const DEFAULT_ADMIN_NOTIFICATION_PREFERENCES = {
  billGenerated: true,
  paymentReceived: true,
  overdueBills: true,
  utilitySpikeDetected: false,
  maintenanceReminders: false,
}

export const NOTIFICATION_PREFERENCE_DEFINITIONS = [
  {
    key: 'billGenerated',
    label: 'Bill Generated',
    sub: 'Get notified when a new bill is created',
  },
  {
    key: 'paymentReceived',
    label: 'Payment Received',
    sub: 'Alert when tenant makes a payment',
  },
  {
    key: 'overdueBills',
    label: 'Overdue Bills',
    sub: 'Remind when bills pass due date',
  },
  {
    key: 'utilitySpikeDetected',
    label: 'Utility Spike Detected',
    sub: 'Alert on unusual usage spikes',
  },
  {
    key: 'maintenanceReminders',
    label: 'Maintenance Reminders',
    sub: 'Scheduled maintenance notifications',
  },
]

const ROLE_NOTIFICATION_KEYS = {
  super_admin: ['billGenerated', 'paymentReceived', 'overdueBills', 'utilitySpikeDetected', 'maintenanceReminders'],
  admin: ['billGenerated', 'paymentReceived', 'overdueBills', 'utilitySpikeDetected', 'maintenanceReminders'],
  finance: ['billGenerated', 'paymentReceived', 'overdueBills'],
  facility_manager: ['utilitySpikeDetected', 'maintenanceReminders'],
  tenant: ['billGenerated', 'overdueBills', 'maintenanceReminders'],
}

function buildStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}:${userId || 'default'}`
}

function getAllowedPreferenceKeys(role) {
  return ROLE_NOTIFICATION_KEYS[role] || ROLE_NOTIFICATION_KEYS.admin
}

function applyRolePolicy(preferences, role) {
  const allowedKeys = new Set(getAllowedPreferenceKeys(role))
  return Object.fromEntries(
    Object.entries({
      ...DEFAULT_ADMIN_NOTIFICATION_PREFERENCES,
      ...(preferences && typeof preferences === 'object' ? preferences : {}),
    }).map(([key, value]) => [key, allowedKeys.has(key) ? Boolean(value) : false])
  )
}

export function getNotificationPreferenceItemsForRole(role) {
  const allowedKeys = new Set(getAllowedPreferenceKeys(role))
  return NOTIFICATION_PREFERENCE_DEFINITIONS.filter((item) => allowedKeys.has(item.key))
}

export function getAdminNotificationPreferences(userId, role = 'admin') {
  if (typeof window === 'undefined') {
    return applyRolePolicy(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES, role)
  }

  try {
    const raw = window.localStorage.getItem(buildStorageKey(userId))
    if (!raw) {
      return applyRolePolicy(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES, role)
    }

    const parsed = JSON.parse(raw)
    return applyRolePolicy(parsed, role)
  } catch {
    return applyRolePolicy(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES, role)
  }
}

export function saveAdminNotificationPreferences(userId, preferences, role = 'admin') {
  const nextPreferences = applyRolePolicy(preferences, role)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(buildStorageKey(userId), JSON.stringify(nextPreferences))
  }

  return nextPreferences
}
