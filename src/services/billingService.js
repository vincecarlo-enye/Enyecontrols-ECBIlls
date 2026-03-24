/**
 * billingService.js
 * Service layer for all billing-related data operations.
 * Replace the mock implementations below with real API calls
 * when a backend is available (e.g. fetch('/api/bills')).
 */

import initialBills from '@/data/mock/bills.json'

// ─── In-memory store (swap with API calls later) ────────────────────────────
let _bills = [...initialBills]

// ─── Helpers ────────────────────────────────────────────────────────────────
function delay(ms = 0) {
  return new Promise((res) => setTimeout(res, ms))
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch all bills.
 * @returns {Promise<Array>}
 */
export async function fetchBills() {
  await delay()
  return [..._bills]
}

/**
 * Fetch a single bill by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function fetchBillById(id) {
  await delay()
  return _bills.find((b) => b.id === id) ?? null
}

/**
 * Update the status of a bill.
 * @param {string} id
 * @param {'paid'|'unpaid'|'pending'} status
 * @returns {Promise<Object>} Updated bill
 */
export async function updateBillStatus(id, status) {
  await delay()
  const bill = _bills.find((b) => b.id === id)
  if (!bill) throw new Error(`Bill ${id} not found`)
  bill.status = status
  return { ...bill }
}

/**
 * Create a new bill.
 * @param {Object} billData
 * @returns {Promise<Object>} Created bill
 */
export async function createBill(billData) {
  await delay()
  const newBill = {
    ...billData,
    id: `BL-2026-${String(Date.now()).slice(-3)}`,
  }
  _bills = [newBill, ..._bills]
  return { ...newBill }
}

/**
 * Delete a bill by ID.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteBill(id) {
  await delay()
  const before = _bills.length
  _bills = _bills.filter((b) => b.id !== id)
  return _bills.length < before
}

/**
 * Upload a payment receipt and mark a bill as pending.
 * @param {string} billId
 * @param {Object} paymentData  { method, notes, receipt }
 * @returns {Promise<Object>} Updated bill
 */
export async function uploadReceipt(billId, paymentData) {
  await delay()
  // In a real implementation, you would POST FormData to /api/payments
  return updateBillStatus(billId, 'pending')
}

/**
 * Build a CSV string for a single bill and trigger a download.
 * Pure utility – no network call needed.
 * @param {Object} bill
 */
export function exportBillCSV(bill) {
  const e = bill.breakdown?.electricity ?? 0
  const w = bill.breakdown?.water ?? 0
  const t = bill.breakdown?.thermal ?? 0
  const tax = Math.round((e + w + t) * 0.12)

  const rows = [
    ['Enyecontrols — Statement of Account'],
    [],
    ['Invoice', bill.id],
    ['Tenant', bill.tenant],
    ['Unit', bill.unit],
    ['Month', bill.month],
    ['Period', bill.billingPeriod],
    ['Due', bill.dueDate],
    ['Status', bill.status.toUpperCase()],
    [],
    ['Description', 'Amount'],
    ['Electricity', `₱${e.toLocaleString()}`],
    ['Water', `₱${w.toLocaleString()}`],
    ['Thermal Energy', `₱${t.toLocaleString()}`],
    ['VAT 12%', `₱${tax.toLocaleString()}`],
    ['TOTAL', `₱${(bill.amount + tax).toLocaleString()}`],
  ]

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), {
    href: url,
    download: `Bill_${bill.tenant.replace(/\s+/g, '_')}.csv`,
  }).click()
  URL.revokeObjectURL(url)
}

/**
 * Export all bills to CSV and trigger download.
 * @param {Array} bills
 */
export function exportAllBillsCSV(bills) {
  const rows = [
    ['Enyecontrols — Bills Export'],
    [],
    ['Invoice', 'Tenant', 'Unit', 'Month', 'Period', 'Amount', 'Due', 'Status'],
    ...bills.map((b) => [
      b.id,
      b.tenant,
      b.unit,
      b.month,
      b.billingPeriod,
      `₱${b.amount.toLocaleString()}`,
      b.dueDate,
      b.status,
    ]),
  ]

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), {
    href: url,
    download: 'EnyeControls_Bills.csv',
  }).click()
  URL.revokeObjectURL(url)
}
