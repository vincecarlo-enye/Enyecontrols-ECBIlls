const cacheStore = new Map()
const SESSION_CACHE_PREFIX = 'ecbills:cache:'

function stableStringify(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${key}:${stableStringify(value[key])}`).join(',')}}`
  }
  return String(value)
}

export function buildCacheKey(namespace, params = {}) {
  return `${namespace}::${stableStringify(params)}`
}

function readSessionCache(key) {
  if (typeof window === 'undefined' || !window.sessionStorage) return null

  try {
    const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${key}`)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeSessionCache(key, entry) {
  if (typeof window === 'undefined' || !window.sessionStorage) return

  try {
    window.sessionStorage.setItem(
      `${SESSION_CACHE_PREFIX}${key}`,
      JSON.stringify(entry)
    )
  } catch {
    // Ignore session storage quota and serialization errors.
  }
}

function deleteSessionCache(key) {
  if (typeof window === 'undefined' || !window.sessionStorage) return

  try {
    window.sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${key}`)
  } catch {
    // Ignore storage errors.
  }
}

export function peekCachedResource(key, { allowExpired = true } = {}) {
  const now = Date.now()
  const cached = cacheStore.get(key)

  if (cached?.value && (allowExpired || cached.expiresAt > now)) {
    return cached.value
  }

  const persisted = readSessionCache(key)
  if (!persisted?.value) return null

  if (!allowExpired && persisted.expiresAt <= now) {
    return null
  }

  cacheStore.set(key, persisted)
  return persisted.value
}

export async function getCachedResource(key, fetcher, { ttl = 15000, force = false, persist = false } = {}) {
  const now = Date.now()
  const cached = cacheStore.get(key)

  if (!force && cached) {
    if (cached.promise) return cached.promise
    if (cached.expiresAt > now) return cached.value
  }

  if (!force && persist) {
    const persisted = readSessionCache(key)
    if (persisted?.expiresAt > now) {
      cacheStore.set(key, persisted)
      return persisted.value
    }
    if (persisted) {
      deleteSessionCache(key)
    }
  }

  const pending = Promise.resolve()
    .then(fetcher)
    .then((value) => {
      const nextEntry = {
        value,
        expiresAt: Date.now() + ttl,
      }
      cacheStore.set(key, nextEntry)
      if (persist) {
        writeSessionCache(key, nextEntry)
      }
      return value
    })
    .catch((error) => {
      cacheStore.delete(key)
      if (persist) {
        deleteSessionCache(key)
      }
      throw error
    })

  cacheStore.set(key, {
    promise: pending,
    expiresAt: now + ttl,
  })

  return pending
}

export function invalidateCache(matchers = []) {
  const list = Array.isArray(matchers) ? matchers : [matchers]

  if (list.length === 0) {
    cacheStore.clear()
    return
  }

  for (const key of cacheStore.keys()) {
    if (list.some((matcher) => key.startsWith(String(matcher)))) {
      cacheStore.delete(key)
      deleteSessionCache(key)
    }
  }
}
