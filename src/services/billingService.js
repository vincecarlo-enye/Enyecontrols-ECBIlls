function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

export function exportBillCSV(bill) {
  if (!bill) return

  const e = Number(bill.breakdown?.electricity ?? 0)
  const w = Number(bill.breakdown?.water ?? 0)
  const t = Number(bill.breakdown?.thermal ?? 0)
  const tax = Math.round((e + w + t) * 0.12)
  const tenantName = bill.tenant || bill.tenant_name || bill.tenant?.name || 'Tenant'

  const rows = [
    ['Enyecontrols Statement of Account'],
    [],
    ['Invoice', bill.id],
    ['Tenant', tenantName],
    ['Unit', bill.unit || bill.unit_name || bill.unit?.unit_number || 'N/A'],
    ['Month', bill.month || bill.billing_month || 'N/A'],
    ['Period', bill.billingPeriod || bill.billing_period || 'N/A'],
    ['Due', bill.dueDate || bill.due_date || 'N/A'],
    ['Status', String(bill.status || '').toUpperCase()],
    [],
    ['Description', 'Amount'],
    ['Electricity', `PHP ${e.toLocaleString()}`],
    ['Water', `PHP ${w.toLocaleString()}`],
    ['Thermal Energy', `PHP ${t.toLocaleString()}`],
    ['VAT 12%', `PHP ${tax.toLocaleString()}`],
    ['TOTAL', `PHP ${(Number(bill.amount || 0) + tax).toLocaleString()}`],
  ]

  downloadCsv(`Bill_${String(tenantName).replace(/\s+/g, '_')}.csv`, rows)
}

export function exportAllBillsCSV(bills = []) {
  const rows = [
    ['Enyecontrols Bills Export'],
    [],
    ['Invoice', 'Tenant', 'Unit', 'Month', 'Period', 'Amount', 'Due', 'Status'],
    ...bills.map((bill) => [
      bill.id,
      bill.tenant || bill.tenant_name || bill.tenant?.name || 'Tenant',
      bill.unit || bill.unit_name || bill.unit?.unit_number || 'N/A',
      bill.month || bill.billing_month || 'N/A',
      bill.billingPeriod || bill.billing_period || 'N/A',
      `PHP ${Number(bill.amount || 0).toLocaleString()}`,
      bill.dueDate || bill.due_date || 'N/A',
      bill.status || 'N/A',
    ]),
  ]

  downloadCsv('EnyeControls_Bills.csv', rows)
}
