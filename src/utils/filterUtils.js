/**
 * utils/filterUtils.js
 * Shared filter utility helpers used across the billing system.
 * Centralizes common filtering, formatting, and search logic.
 */

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

/** "Jan 5, 2025" */
export function formatShortDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/** "January 5, 2025" */
export function formatLongDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Format a "YYYY-MM" billing month string or any date-like value into
 * a readable label like "January 2025".
 */
export function formatBillingMonth(value) {
  if (!value) return '—'

  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
    }
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
  }

  return String(value)
}

// ---------------------------------------------------------------------------
// Bill field accessors (normalize various API shapes)
// ---------------------------------------------------------------------------

export function getBillTenantName(bill) {
  if (typeof bill?.tenant === 'string') return bill.tenant
  return bill?.tenant?.name || bill?.tenant_name || 'Unknown Tenant'
}

export function getBillUnitName(bill) {
  if (typeof bill?.unit === 'string') return bill.unit
  return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '—'
}

export function getBillAmount(bill) {
  return Number(bill?.grand_total ?? bill?.total_amount ?? bill?.amount ?? 0)
}

export function getBillDueDate(bill) {
  return bill?.due_date || bill?.dueDate || null
}

export function getBillPeriod(bill) {
  const start = bill?.billing_start || bill?.period_start || bill?.billingStart || null
  const end = bill?.billing_end || bill?.period_end || bill?.billingEnd || null

  if (start && end) return `${formatShortDate(start)} – ${formatShortDate(end)}`
  if (end) return formatShortDate(end)
  if (bill?.billing_period) return bill.billing_period
  if (bill?.month) return bill.month
  return '—'
}

export function getBillReceiptRef(bill) {
  return (
    bill?.receipt?.referenceNumber ||
    bill?.receipt?.reference_number ||
    bill?.reference_number ||
    '—'
  )
}

// ---------------------------------------------------------------------------
// Generic search helper
// ---------------------------------------------------------------------------

/**
 * Returns true if any of the provided string fields contain the query.
 * Safely handles null/undefined values.
 */
export function matchesSearch(query, ...fields) {
  if (!query) return true
  const q = String(query).toLowerCase().trim()
  if (!q) return true
  return fields.some((field) => String(field ?? '').toLowerCase().includes(q))
}

/**
 * Returns true if the status value passes the filter.
 * @param {string} filterValue - The selected filter (e.g. 'all', 'paid')
 * @param {string} itemStatus  - The item's actual status
 */
export function matchesStatus(filterValue, itemStatus) {
  return filterValue === 'all' || String(itemStatus ?? '') === String(filterValue)
}

/**
 * Returns true if the utility type passes the filter.
 */
export function matchesUtility(filterValue, itemUtility) {
  return filterValue === 'all' || String(itemUtility ?? '').toLowerCase() === String(filterValue).toLowerCase()
}

// ---------------------------------------------------------------------------
// Pagination meta builder (for inline pagination without useClientPagination)
// ---------------------------------------------------------------------------

export function buildPaginationMeta(total, page, perPage) {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, lastPage)
  return {
    current_page: safePage,
    per_page: perPage,
    total,
    last_page: lastPage,
    from: total === 0 ? 0 : (safePage - 1) * perPage + 1,
    to: total === 0 ? 0 : Math.min(safePage * perPage, total),
  }
}

export function paginateItems(items, page, perPage) {
  const lastPage = Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(Math.max(1, page), lastPage)
  const start = (safePage - 1) * perPage
  return items.slice(start, start + perPage)
}

// ---------------------------------------------------------------------------
// Shared formatters (previously duplicated across 10+ pages)
// ---------------------------------------------------------------------------

/**
 * Format any date-like value as a short date+time string.
 * e.g. "Jan 5, 2025, 3:45 PM"
 * @param {*} value
 * @param {string} [fallback='—']
 */
export function formatDateTime(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format any date-like value as a readable date string.
 * e.g. "Jan 5, 2025"
 * Alias for formatShortDate with configurable fallback.
 * @param {*} value
 * @param {string} [fallback='—']
 */
export function formatDate(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Format a number as Philippine Peso.
 * e.g. "PHP 1,234.56"
 * @param {number|string} value
 */
export function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format a plain number with locale separators and 2 decimal places.
 * e.g. 1234.5 → "1,234.50"
 * @param {number|string} value
 */
export function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a billing period date in short form for period displays.
 * e.g. "Jan 5, 2025"  (same as formatDate, kept as named alias for clarity)
 */
export function formatShortPeriodDate(value, fallback = '—') {
  return formatDate(value, fallback)
}
