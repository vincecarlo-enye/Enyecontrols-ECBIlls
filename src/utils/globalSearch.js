const STOP_WORDS = new Set([
  'the', 'a', 'an', 'for', 'to', 'of', 'in', 'on', 'at', 'with', 'show', 'me',
  'my', 'all', 'find', 'search', 'look', 'latest', 'recent', 'newest', 'new',
])

const CATEGORY_TERMS = {
  Pages: ['page', 'pages', 'module', 'modules', 'screen', 'screens'],
  Bills: ['bill', 'bills', 'billing', 'invoice', 'invoices', 'soa'],
  Transactions: ['transaction', 'transactions', 'payment', 'payments', 'receipt', 'receipts', 'verification', 'verifications'],
  Tenants: ['tenant', 'tenants', 'resident', 'residents', 'occupant', 'occupants'],
  Units: ['unit', 'units', 'room', 'rooms', 'space', 'spaces'],
  'Billing Tickets': ['ticket', 'tickets', 'concern', 'concerns', 'dispute', 'disputes', 'report', 'reports'],
  Notifications: ['notification', 'notifications', 'alert', 'alerts', 'notice', 'notices', 'announcement', 'announcements'],
  Maintenance: ['maintenance', 'repair', 'repairs', 'request', 'requests', 'workorder', 'workorders'],
}

const STATUS_TERMS = {
  pending: ['pending', 'submitted', 'review', 'awaiting'],
  paid: ['paid', 'complete', 'completed'],
  overdue: ['overdue', 'late', 'delayed'],
  unread: ['unread', 'new'],
  read: ['read', 'seen'],
  active: ['active', 'open'],
  draft: ['draft'],
  published: ['published', 'unpaid'],
}

function tokenize(query) {
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9#-]+/)
    .filter(Boolean)
}

export function parseSearchQuery(query) {
  const tokens = tokenize(query)
  const intents = {
    latest: tokens.some((token) => ['latest', 'recent', 'newest', 'new'].includes(token)),
  }

  const categories = Object.entries(CATEGORY_TERMS)
    .filter(([, terms]) => tokens.some((token) => terms.includes(token)))
    .map(([category]) => category)

  const statuses = Object.entries(STATUS_TERMS)
    .filter(([, terms]) => tokens.some((token) => terms.includes(token)))
    .map(([status]) => status)

  const freeTokens = tokens.filter((token) => {
    if (STOP_WORDS.has(token)) return false
    if (Object.values(CATEGORY_TERMS).some((terms) => terms.includes(token))) return false
    if (Object.values(STATUS_TERMS).some((terms) => terms.includes(token))) return false
    return true
  })

  return { raw: String(query || '').trim().toLowerCase(), categories, statuses, freeTokens, intents }
}

export function buildSearchMeta(item, extra = {}) {
  return {
    category: item.category || '',
    label: item.label || '',
    description: item.description || '',
    path: item.path || '',
    status: String(extra.status || item.status || '').toLowerCase(),
    timestamp: extra.timestamp || item.timestamp || null,
    keywords: Array.isArray(extra.keywords) ? extra.keywords : [],
  }
}

function matchesRequestedCategory(meta, parsed) {
  if (!parsed.categories.length) return true
  return parsed.categories.includes(meta.category)
}

function matchesRequestedStatus(meta, parsed) {
  if (!parsed.statuses.length) return true
  return parsed.statuses.some((status) => {
    if (meta.status.includes(status)) return true
    const terms = STATUS_TERMS[status] || []
    return terms.some((term) => meta.status.includes(term))
  })
}

function matchesFreeTokens(meta, parsed) {
  if (!parsed.freeTokens.length) return true
  const haystack = [meta.label, meta.description, meta.path, ...(meta.keywords || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return parsed.freeTokens.every((token) => haystack.includes(token))
}

export function matchesSearch(item, query) {
  const parsed = typeof query === 'string' ? parseSearchQuery(query) : query
  const meta = item.searchMeta || buildSearchMeta(item)

  return matchesRequestedCategory(meta, parsed)
    && matchesRequestedStatus(meta, parsed)
    && matchesFreeTokens(meta, parsed)
}

export function scoreSearch(item, query) {
  const parsed = typeof query === 'string' ? parseSearchQuery(query) : query
  const meta = item.searchMeta || buildSearchMeta(item)
  let score = 0

  if (parsed.categories.includes(meta.category)) score += 80
  if (parsed.statuses.length && matchesRequestedStatus(meta, parsed)) score += 30

  const haystack = [meta.label, meta.description, meta.path, ...(meta.keywords || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (parsed.raw && haystack.includes(parsed.raw)) score += 50

  for (const token of parsed.freeTokens) {
    if (haystack.includes(token)) score += 20
  }

  if (!parsed.freeTokens.length && parsed.categories.length && parsed.categories.includes(meta.category)) {
    score += 25
  }

  if (parsed.intents.latest && meta.timestamp) {
    score += 10
  }

  return score
}

export function sortSearchResults(results, query) {
  const parsed = typeof query === 'string' ? parseSearchQuery(query) : query

  return [...results].sort((a, b) => {
    const scoreDiff = scoreSearch(b, parsed) - scoreSearch(a, parsed)
    if (scoreDiff !== 0) return scoreDiff

    const aTime = a.searchMeta?.timestamp ? new Date(a.searchMeta.timestamp).getTime() : 0
    const bTime = b.searchMeta?.timestamp ? new Date(b.searchMeta.timestamp).getTime() : 0
    if (bTime !== aTime) return bTime - aTime

    return String(a.label || '').localeCompare(String(b.label || ''))
  })
}

export function filterAndRankResults(results, query) {
  const parsed = typeof query === 'string' ? parseSearchQuery(query) : query
  return sortSearchResults(results.filter((item) => matchesSearch(item, parsed)), parsed)
}
