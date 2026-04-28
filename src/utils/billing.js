import api from '@/lib/api'

function formatDate(value, options, fallback = '') {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-US', options)
}

export function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function formatBillingDisplayDate(value, fallback = '') {
  return formatDate(value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }, fallback)
}

export function formatBillingShortDate(value, fallback = '') {
  return formatDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }, fallback)
}

export function formatBillingMonthLabel(value, fallback = '--') {
  if (!value) return fallback

  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(date)
    }
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  return String(value)
}

export function normalizeBillBreakdown(items = []) {
  const totals = {
    electricity: 0,
    water: 0,
    thermal: 0,
  }

  if (!Array.isArray(items)) return totals

  items.forEach((item) => {
    const type = String(item?.type || item?.utility_type || '').toLowerCase()
    const mappedType = type === 'electric' ? 'electricity' : type
    const amount = toNumber(item?.amount ?? item?.subtotal ?? item?.cost ?? 0)

    if (mappedType === 'electricity') totals.electricity += amount
    else if (mappedType === 'water') totals.water += amount
    else if (mappedType === 'thermal') totals.thermal += amount
  })

  return totals
}

function getTenantName(bill) {
  if (typeof bill?.tenant === 'string') return bill.tenant
  return bill?.tenant?.name || bill?.tenant_name || 'Unknown Tenant'
}

function getUnitName(bill, fallback = '--') {
  if (typeof bill?.unit === 'string') return bill.unit
  return bill?.unit?.unit_number || bill?.unit?.unitnumber || bill?.unit?.name || bill?.unit?.building_name || bill?.unit_name || bill?.unit || fallback
}

function getBillingStart(bill) {
  return bill?.billing_start || bill?.billingstart || bill?.period_start || bill?.periodstart || null
}

function getBillingEnd(bill) {
  return bill?.billing_end || bill?.billingend || bill?.period_end || bill?.periodend || null
}

function getBillingMonthRaw(bill) {
  return bill?.billing_month || bill?.billingMonth || bill?.billingmonth || bill?.month || bill?.period || null
}

function getBillingPeriod(bill, fallback = '--') {
  const billingStart = getBillingStart(bill)
  const billingEnd = getBillingEnd(bill)

  if (billingStart && billingEnd) {
    return `${formatBillingShortDate(billingStart, fallback)} - ${formatBillingShortDate(billingEnd, fallback)}`
  }

  if (billingEnd) {
    return formatBillingShortDate(billingEnd, fallback)
  }

  return bill?.billing_period || bill?.billingPeriod || fallback
}

function getAmountValue(bill) {
  return toNumber(
    bill?.grand_total ??
    bill?.grandtotal ??
    bill?.total_amount ??
    bill?.totalamount ??
    bill?.amount ??
    bill?.subtotal ??
    0
  )
}

function getPenaltyAmount(bill) {
  const raw = bill?.raw || {}
  const penalties = Array.isArray(bill?.penalties)
    ? bill.penalties
    : Array.isArray(bill?.bill_penalties)
      ? bill.bill_penalties
      : Array.isArray(raw?.penalties)
        ? raw.penalties
        : Array.isArray(raw?.bill_penalties)
          ? raw.bill_penalties
          : []
  const explicit = toNumber(
    bill?.penaltyAmount ??
      bill?.penalty_amount ??
      bill?.late_fee ??
      bill?.lateFee ??
      raw?.penalty_amount ??
      raw?.late_fee ??
      raw?.lateFee ??
      0
  )

  return penalties.reduce(
    (sum, penalty) => sum + toNumber(penalty?.penalty_amount ?? penalty?.amount ?? 0),
    explicit
  )
}

function getDueDateValue(bill) {
  return bill?.due_date || bill?.duedate || bill?.dueDate || bill?.billing_end || bill?.billingEnd || null
}

function normalizeStatus(status, statusMap, fallback) {
  const raw = String(status || '').toLowerCase()
  return statusMap[raw] || raw || fallback
}

function parseBillingDate(value) {
  if (!value) return null

  const raw = String(value).trim()
  if (!raw) return null

  const localDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (localDateMatch) {
    const [, year, month, day] = localDateMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function shouldMarkOverdue(status, dueDateValue) {
  const normalizedStatus = String(status || '').toLowerCase()
  if (!['published', 'unpaid'].includes(normalizedStatus)) return false
  if (!dueDateValue) return false

  const dueDate = parseBillingDate(dueDateValue)
  if (!dueDate) return false

  const overdueAfter = new Date(dueDate)
  overdueAfter.setHours(23, 59, 59, 999)

  return Date.now() > overdueAfter.getTime()
}

export function resolveStorageAssetUrl(value) {
  if (!value) return ''

  const raw = String(value).trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  const baseUrl = String(import.meta.env.VITE_API_URL || api?.defaults?.baseURL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  const normalizedPath = raw
    .replace(/^\/+/, '')
    .replace(/^storage\/+/i, '')

  return `${baseUrl}/storage/${normalizedPath}`
}

function buildReceipt(payment, bill) {
  if (!payment) return null

  const paymentDateValue = payment?.paid_at || payment?.created_at || null
  const receiptImage =
    payment?.proof_image_url ||
    payment?.receipt_image_url ||
    payment?.proofImageUrl ||
    payment?.receiptImageUrl ||
    payment?.proof_image ||
    payment?.receipt_image ||
    payment?.proofImage ||
    payment?.receiptImage ||
    ''

  return {
    referenceNumber: payment?.reference_no || payment?.referenceNumber || '-',
    paymentDate: paymentDateValue ? formatBillingDisplayDate(paymentDateValue, 'N/A') : 'N/A',
    submittedBy: payment?.tenant?.name || getTenantName(bill),
    note: payment?.notes || '',
    receiptImage: resolveStorageAssetUrl(receiptImage),
  }
}

export function normalizeTenantBill(raw = {}) {
  const billingMonth = getBillingMonthRaw(raw) || ''
  const dueDateValue = getDueDateValue(raw)
  const breakdown = raw?.breakdown || normalizeBillBreakdown(raw?.items || raw?.bill_items || [])
  const normalizedStatus = normalizeStatus(raw?.status, {
    unpaid: 'published',
    pending: 'submitted',
    published: 'published',
    payment_submitted: 'submitted',
    paid: 'paid',
    overdue: 'overdue',
  }, 'published')

  return {
    id: raw?.id,
    tenantId: raw?.tenant_id ?? raw?.tenantId ?? raw?.tenant?.id ?? null,
    unitId: raw?.unit_id ?? raw?.unitId ?? raw?.unit?.id ?? null,
    unit: getUnitName(raw, 'N/A'),
    month: billingMonth,
    dueDate: formatBillingDisplayDate(dueDateValue),
    billingPeriod: getBillingPeriod(raw, ''),
    amount: getAmountValue(raw),
    penaltyAmount: getPenaltyAmount(raw),
    status: shouldMarkOverdue(normalizedStatus, dueDateValue) ? 'overdue' : normalizedStatus,
    breakdown: {
      electricity: toNumber(breakdown?.electricity ?? breakdown?.electric ?? 0),
      water: toNumber(breakdown?.water ?? 0),
      thermal: toNumber(breakdown?.thermal ?? 0),
    },
    raw,
  }
}

export function normalizeAdminBill(bill = {}, payment = null) {
  const billingMonthRaw = getBillingMonthRaw(bill)
  const billingEnd = getBillingEnd(bill)
  const dueDateValue = getDueDateValue(bill)
  const paymentStatus = String(payment?.status || '').trim().toLowerCase()
  const normalizedStatus = ['pending', 'submitted', 'payment_submitted'].includes(paymentStatus)
    ? 'payment_submitted'
    : normalizeStatus(bill?.status, { submitted: 'payment_submitted' }, 'draft')

  return {
    id: String(bill?.id ?? ''),
    tenant: getTenantName(bill),
    unit: getUnitName(bill, '--'),
    month: billingMonthRaw ? formatBillingMonthLabel(billingMonthRaw, '--') : billingEnd ? formatBillingMonthLabel(billingEnd, '--') : '--',
    billingMonth: billingMonthRaw || '--',
    billingStart: getBillingStart(bill),
    billingEnd,
    billingPeriod: getBillingPeriod(bill, '--'),
    amount: getAmountValue(bill),
    penaltyAmount: getPenaltyAmount(bill),
    dueDate: formatBillingDisplayDate(dueDateValue, '--'),
    dueDateRaw: dueDateValue,
    status: shouldMarkOverdue(normalizedStatus, dueDateValue) ? 'overdue' : normalizedStatus,
    paymentId: payment?.id || null,
    receipt: buildReceipt(payment, bill),
    breakdown: normalizeBillBreakdown(bill?.items),
    raw: bill,
  }
}

// ---------------------------------------------------------------------------
// Named exports for previously private helpers (used across multiple pages)
// ---------------------------------------------------------------------------
export { getTenantName, getUnitName, getBillingPeriod }
