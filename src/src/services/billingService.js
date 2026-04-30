import { escapeCsvValue } from '@/utils/exportCsv'

function getExportTenant(bill) {
  if (typeof bill?.tenant === 'string') return bill.tenant
  return bill?.tenant?.name || bill?.tenant_name || 'Unknown Tenant'
}

function getExportUnit(bill) {
  if (typeof bill?.unit === 'string') return bill.unit
  return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '-'
}

function getExportMonth(bill) {
  return bill?.month || bill?.billing_month || bill?.billingMonth || '-'
}

function getExportPeriod(bill) {
  return bill?.billingPeriod || bill?.billing_period || '-'
}

function getExportAmount(bill) {
  return Number(
    bill?.amount ??
    bill?.grand_total ??
    bill?.total_amount ??
    0
  )
}

function getExportDueDate(bill) {
  return bill?.dueDate || bill?.due_date || '-'
}

function getExportStatus(bill) {
  return bill?.status || '-'
}


function triggerCsvDownload(filename, rows = []) {
  const csv = '\uFEFF' + rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\r\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  Object.assign(document.createElement('a'), {
    href: url,
    download: filename,
  }).click()
  URL.revokeObjectURL(url)
}

export function exportBillCSV(bill) {
  const e = bill.breakdown?.electricity ?? 0
  const w = bill.breakdown?.water ?? 0
  const t = bill.breakdown?.thermal ?? 0
  const tax = Math.round((e + w + t) * 0.12)

  const rows = [
    ['Invoice', 'Tenant', 'Unit', 'Month', 'Period', 'Due', 'Status', 'Electricity', 'Water', 'Thermal', 'VAT', 'Total'],
    [
      bill.id,
      getExportTenant(bill),
      getExportUnit(bill),
      getExportMonth(bill),
      getExportPeriod(bill),
      getExportDueDate(bill),
      String(getExportStatus(bill)).toUpperCase(),
      e,
      w,
      t,
      tax,
      Number(bill.amount || 0) + tax,
    ],
  ]

  triggerCsvDownload(`Bill_${String(getExportTenant(bill) || 'tenant').replace(/\s+/g, '_')}.csv`, rows)
}

export function exportAllBillsCSV(bills, options = {}) {
  const filterLabel = String(options?.filterLabel || 'all').toLowerCase()
  const rows = [
    ['Invoice', 'Tenant', 'Unit', 'Month', 'Period', 'Amount', 'Due', 'Status'],
    ...bills.map((bill) => [
      bill.id,
      getExportTenant(bill),
      getExportUnit(bill),
      getExportMonth(bill),
      getExportPeriod(bill),
      `PHP ${getExportAmount(bill).toLocaleString()}`,
      getExportDueDate(bill),
      getExportStatus(bill),
    ]),
  ]

  triggerCsvDownload(`EnyeControls_Bills_${filterLabel}.csv`, rows)
}
