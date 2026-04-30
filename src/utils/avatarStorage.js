const AVATAR_STORAGE_KEY = 'ecbills:tenantAvatars'

function readAvatarMap() {
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAvatarMap(map) {
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(map))
  } catch {
    //
  }
}

export function getAvatarIdentityKeys(user) {
  const tenant = user?.tenant || {}
  const values = [
    ['user', user?.id],
    ['user', user?.user_id],
    ['email', user?.email],
    ['tenant', tenant?.id],
    ['tenant-user', tenant?.user_id],
    ['tenant-email', tenant?.email],
  ]

  return values
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([prefix, value]) => `${prefix}:${String(value).toLowerCase()}`)
}

export function getStoredAvatar(user) {
  const map = readAvatarMap()
  const keys = getAvatarIdentityKeys(user)
  const key = keys.find((item) => map[item])
  return key ? map[key] : ''
}

export function persistUserAvatar(user, avatar) {
  if (!avatar) return

  const keys = getAvatarIdentityKeys(user)
  if (keys.length === 0) return

  const map = readAvatarMap()
  keys.forEach((key) => {
    map[key] = avatar
  })
  writeAvatarMap(map)
}

export function applyStoredAvatarToUser(user) {
  if (!user) return user

  const storedAvatar = getStoredAvatar(user)
  if (!storedAvatar) return user

  return {
    ...user,
    avatar: storedAvatar,
    tenant: user.tenant
      ? {
          ...user.tenant,
          avatar: storedAvatar,
        }
      : user.tenant,
  }
}
