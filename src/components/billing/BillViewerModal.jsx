import { formatLongDate, formatShortPeriodDate } from '@/utils/filterUtils'
import { useRef, useState } from 'react'
import Modal from '@/components/ui/Modal'
import {
  Printer,
  Download,
  FileText,
  Building2,
  Zap,
  Droplets,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'

const ICONS = {
  Electricity: Zap,
  Water: Droplets,
  'Thermal Energy': Flame,
}

const STATUS_CFG = {
  paid: {
    label: 'PAID',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Icon: CheckCircle2,
  },
  unpaid: {
    label: 'UNPAID',
    badge:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Icon: XCircle,
  },
  pending: {
    label: 'PENDING',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Icon: Clock,
  },
  published: {
    label: 'PUBLISHED',
    badge:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Icon: Clock,
  },
  payment_submitted: {
    label: 'PENDING REVIEW',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Icon: Clock,
  },
  overdue: {
    label: 'OVERDUE',
    badge:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    Icon: XCircle,
  },
  draft: {
    label: 'DRAFT',
    badge:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Icon: Clock,
  },
}

function peso(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}



function mapStatus(status) {
  if (status === 'published') return 'pending'
  if (status === 'payment_submitted') return 'pending'
  return status || 'unpaid'
}

function getUtilityLabel(type) {
  const t = String(type || '').toLowerCase()

  if (t.includes('electric') || t.includes('power')) return 'Electricity'
  if (t.includes('water')) return 'Water'
  if (t.includes('thermal') || t.includes('btu')) return 'Thermal Energy'

  return type || 'Utility'
}

function getUnitLabel(unit) {
  if (!unit) return ''
  if (typeof unit === 'string') return String(unit).trim()

  return String(
    unit?.unit_number ||
    unit?.name ||
    unit?.label ||
    unit?.unit ||
    ''
  ).trim()
}

function collectBillUnits(bill) {
  const raw = bill?.raw || {}
  const candidates = [
    bill?.unit,
    raw?.unit,
    ...(Array.isArray(bill?.units) ? bill.units : []),
    ...(Array.isArray(raw?.units) ? raw.units : []),
    ...(Array.isArray(bill?.linkedUnits) ? bill.linkedUnits : []),
    ...(Array.isArray(raw?.linkedUnits) ? raw.linkedUnits : []),
    ...(Array.isArray(bill?.tenant?.units) ? bill.tenant.units : []),
    ...(Array.isArray(raw?.tenant?.units) ? raw.tenant.units : []),
  ]

  return Array.from(new Set(candidates.map(getUnitLabel).filter(Boolean)))
}

function inferChargesFromBreakdown(breakdown = {}) {
  const electric = Number(
    breakdown.electric ??
      breakdown.electricity ??
      0
  )
  const water = Number(breakdown.water || 0)
  const thermal = Number(breakdown.thermal || 0)

  return [
    {
      id: 'electric',
      particular: 'Electricity',
      prev: '—',
      curr: '—',
      used: electric > 0 ? `${(electric / 10.99).toFixed(1)} kWh` : '—',
      rate: electric > 0 ? '₱10.99/kWh' : '—',
      amount: electric,
    },
    {
      id: 'water',
      particular: 'Water',
      prev: '—',
      curr: '—',
      used: water > 0 ? `${(water / 30).toFixed(1)} m³` : '—',
      rate: water > 0 ? '₱30.00/m³' : '—',
      amount: water,
    },
    {
      id: 'thermal',
      particular: 'Thermal Energy',
      prev: '—',
      curr: '—',
      used: thermal > 0 ? `${(thermal / 11).toFixed(1)} kBTU` : '—',
      rate: thermal > 0 ? '₱11.00/kBTU' : '—',
      amount: thermal,
    },
  ].filter((row) => Number(row.amount) > 0)
}

function buildChargesFromItems(items = []) {
  return items.map((item, index) => {
    const rateType =
      item?.rate?.type ||
      item?.meter?.type ||
      item?.type ||
      item?.name ||
      'utility'

    const label = getUtilityLabel(rateType)

    const previousReading =
      item?.previous_reading ??
      item?.prev_reading ??
      item?.start_reading ??
      item?.previous ??
      '—'

    const currentReading =
      item?.current_reading ??
      item?.curr_reading ??
      item?.end_reading ??
      item?.current ??
      '—'

    const consumption = Number(
      item?.consumption ??
        item?.usage ??
        item?.quantity ??
        0
    )

    const unit =
      item?.rate?.unit_measure ||
      item?.unit ||
      item?.meter?.unit ||
      ''

    const pricePerUnit = Number(
      item?.rate?.price_per_unit ??
        item?.rate_value ??
        item?.rate_amount ??
        item?.unit_price ??
        0
    )

    const amount = Number(
      item?.amount ??
        item?.total ??
        item?.charge_amount ??
        0
    )

    return {
      id: item?.id || index,
      particular: label,
      prev: previousReading,
      curr: currentReading,
      used: unit
        ? `${consumption.toLocaleString()} ${unit}`
        : `${consumption.toLocaleString()}`,
      rate: pricePerUnit
        ? `₱${pricePerUnit.toFixed(2)}/${unit || 'unit'}`
        : '—',
      amount,
    }
  })
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
  const explicit = Number(
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
    (sum, penalty) => sum + Number(penalty?.penalty_amount ?? penalty?.amount ?? 0),
    explicit
  )
}

function normalizeBill(bill) {
  if (!bill) return null
  const raw = bill.raw || {}

  const tenantName =
    typeof bill.tenant === 'string'
      ? bill.tenant
      : bill.tenant?.name || bill.tenant_name || raw.tenant?.name || raw.tenant_name || 'Unknown Tenant'

  const unitName =
    typeof bill.unit === 'string'
      ? bill.unit
      : bill.unit?.unit_number || bill.unit?.name || bill.unit_name || raw.unit?.unit_number || raw.unit?.name || raw.unit_name || '—'

  const units = collectBillUnits(bill)
  const primaryUnitName = units[0] || unitName
  const items = Array.isArray(bill.items)
    ? bill.items
    : Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.bill_items)
        ? raw.bill_items
        : []
  const fallbackBreakdown = bill.breakdown || raw.breakdown || {}

  const charges =
    items.length > 0
      ? buildChargesFromItems(items)
      : inferChargesFromBreakdown(fallbackBreakdown)

  const computedSubtotal = charges.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  )

  const subtotal = Number(
    bill.subtotal ??
      bill.sub_total ??
      raw.subtotal ??
      raw.sub_total ??
      computedSubtotal
  )

  const tax = Number(
    bill.tax ??
      bill.vat ??
      bill.tax_amount ??
      raw.tax ??
      raw.vat ??
      raw.tax_amount ??
      0
  )

  const penaltyAmount = getPenaltyAmount(bill)
  const rawPreviousBalance = Number(
    bill.previous_balance ??
      bill.balance_forward ??
      raw.previous_balance ??
      raw.balance_forward ??
      0
  )
  const previousBalance = Math.max(0, rawPreviousBalance - penaltyAmount)

  const paymentsReceived = Number(
    bill.payments_received ??
      bill.amount_paid ??
      raw.payments_received ??
      raw.amount_paid ??
      0
  )

  const grandTotal = Number(
    bill.grand_total ??
      bill.total_amount ??
      bill.amount ??
      raw.grand_total ??
      raw.total_amount ??
      raw.amount ??
      (subtotal + tax + previousBalance - paymentsReceived)
  )

  const billDateRaw =
    bill.billDate ||
    bill.created_at ||
    bill.billing_start ||
    raw.created_at ||
    raw.billing_start ||
    null

  const dueDateRaw =
    bill.dueDateRaw ||
    bill.dueDate ||
    bill.due_date ||
    raw.due_date ||
    null

  const billingStart =
    bill.billing_start ||
    bill.period_start ||
    raw.billing_start ||
    raw.period_start ||
    null

  const billingEnd =
    bill.billing_end ||
    bill.period_end ||
    raw.billing_end ||
    raw.period_end ||
    null

  const billingPeriod =
    billingStart && billingEnd
      ? `${formatShortPeriodDate(billingStart)} - ${formatShortPeriodDate(billingEnd)}`
      : billingEnd
        ? formatShortPeriodDate(billingEnd)
        : '—'

  return {
    invoiceNo: bill.id,
    tenantName,
    unit: primaryUnitName,
    units,
    unitsLabel: units.length > 0 ? units.join(', ') : primaryUnitName,
    billDate: formatLongDate(billDateRaw),
    dueDate: formatLongDate(dueDateRaw),
    billingPeriod,
    status: mapStatus(bill.status),
    charges,
    subtotal,
    tax,
    previousBalance,
    penaltyAmount,
    paymentsReceived,
    grandTotal,
    adjustmentState: bill?.adjustmentState || null,
    adjustmentHistory: bill?.adjustmentHistory || [],
    receipt: bill?.receipt || null,
  }
}

function BillContent({ bill }) {
  const pdfRef = useRef(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const d = normalizeBill(bill)
  const st = STATUS_CFG[d.status] || STATUS_CFG.unpaid

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=860,height=1000')
    if (!w) return

    w.document.write(`<!DOCTYPE html><html><head>
      <title>SOA_${String(d.tenantName).replace(/\s+/g, '_')}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:system-ui,sans-serif;font-size:13px;color:#1e293b;padding:28px;line-height:1.5}
        .hdr{background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;padding:18px 22px;border-radius:12px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center}
        .hdr h1{font-size:16px;font-weight:700}.hdr p{font-size:11px;opacity:.75;margin-top:2px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px}
        .section{background:#f8fafc;border-radius:10px;padding:14px}
        .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;font-weight:700;margin-bottom:10px}
        .kv{display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px}
        .kv .k{color:#64748b}.kv .v{font-weight:600;text-align:right}
        table{width:100%;border-collapse:collapse;margin-bottom:14px}
        th{font-size:9px;text-transform:uppercase;color:#94a3b8;padding:8px 10px;border-bottom:2px solid #e2e8f0;text-align:left}
        td{padding:9px 10px;border-bottom:1px solid #f1f5f9;font-size:12px}
        .ar{text-align:right;font-weight:700}
        .sum{background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px}
        .sr{display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:5px}
        .tot{background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
        .foot{margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.8}
        @media print{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      </style>
    </head><body>
      <div class="hdr">
        <div><h1>Enyecontrols</h1><p>Official Statement of Account</p></div>
        <div style="text-align:right">
          <p style="font-weight:700;font-size:14px">${d.invoiceNo}</p>
          <p style="opacity:.75;font-size:11px">Bill Date: ${d.billDate}</p>
        </div>
      </div>

      <div class="grid2">
        <div class="section">
          <p class="lbl">Account Information</p>
          <div class="kv"><span class="k">Tenant</span><span class="v">${d.tenantName}</span></div>
          <div class="kv"><span class="k">${d.units.length > 1 ? 'Units' : 'Unit'}</span><span class="v">${d.unitsLabel}</span></div>
          <div class="kv"><span class="k">Invoice No.</span><span class="v">${d.invoiceNo}</span></div>
        </div>
        <div class="section">
          <p class="lbl">Bill Details</p>
          <div class="kv"><span class="k">Bill Date</span><span class="v">${d.billDate}</span></div>
          <div class="kv"><span class="k">Due Date</span><span class="v">${d.dueDate}</span></div>
          <div class="kv"><span class="k">Period</span><span class="v">${d.billingPeriod}</span></div>
        </div>
      </div>

      <p class="lbl">Utility Charges</p>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Prev Reading</th>
            <th>Curr Reading</th>
            <th>Consumption</th>
            <th>Rate</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            d.charges.length === 0
              ? `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:18px">No utility charges available.</td></tr>`
              : d.charges
                  .map(
                    (c) => `
            <tr>
              <td><strong>${c.particular}</strong></td>
              <td>${c.prev}</td>
              <td>${c.curr}</td>
              <td>${c.used}</td>
              <td>${c.rate}</td>
              <td class="ar">₱${peso(c.amount)}</td>
            </tr>
          `
                  )
                  .join('')
          }
        </tbody>
      </table>

      <div class="sum">
        <p class="lbl">Summary</p>
        <div class="sr"><span>Subtotal</span><span>₱${peso(d.subtotal)}</span></div>
        <div class="sr"><span>VAT (12%)</span><span>₱${peso(d.tax)}</span></div>
        <div class="sr"><span>Previous Balance</span><span>₱${peso(d.previousBalance)}</span></div>
        <div class="sr"><span>Late Payment Penalty</span><span>₱${peso(d.penaltyAmount)}</span></div>
        <div class="sr"><span>Payments Received</span><span>₱${peso(d.paymentsReceived)}</span></div>
      </div>

      <div class="tot">
        <div>
          <p style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.1em">Total Amount Due</p>
          <p style="font-size:11px;opacity:.7;margin-top:3px">Due by ${d.dueDate}</p>
        </div>
        <span style="font-size:22px;font-weight:800">₱${peso(d.grandTotal)}</span>
      </div>

      <div class="foot">
        <p>Pay at any authorized payment center or via bank transfer to Enyecontrols Management (BDO #1234-5678-90).</p>
        <p><strong>billing@enye.ph</strong> · +63 2 8888 0000</p>
      </div>
    </body></html>`)
    w.document.close()
    w.focus()

    setTimeout(() => {
      w.print()
      w.close()
    }, 600)
  }

  const handleDownloadCSV = () => {
    const rows = [
      ['Enyecontrols — Statement of Account'],
      [],
      ['Invoice No.', d.invoiceNo],
      ['Tenant', d.tenantName],
      [d.units.length > 1 ? 'Units' : 'Unit', d.unitsLabel],
      ['Bill Date', d.billDate],
      ['Due Date', d.dueDate],
      ['Period', d.billingPeriod],
      ['Status', d.status.toUpperCase()],
      [],
      ['UTILITY CHARGES'],
      ['Description', 'Prev', 'Curr', 'Consumption', 'Rate', 'Amount'],
      ...d.charges.map((c) => [
        c.particular,
        c.prev,
        c.curr,
        c.used,
        c.rate,
        `₱${peso(c.amount)}`,
      ]),
      [],
      ['Subtotal', '', '', '', '', `₱${peso(d.subtotal)}`],
      ['VAT 12%', '', '', '', '', `₱${peso(d.tax)}`],
      ['Previous Balance', '', '', '', '', `₱${peso(d.previousBalance)}`],
      ['Late Payment Penalty', '', '', '', '', `₱${peso(d.penaltyAmount)}`],
      ['Payments Received', '', '', '', '', `₱${peso(d.paymentsReceived)}`],
      ['TOTAL AMOUNT DUE', '', '', '', '', `₱${peso(d.grandTotal)}`],
    ]

    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SOA_${String(d.tenantName).replace(/\s+/g, '_')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true)
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
        orientation: 'portrait',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 40
      const contentWidth = pageWidth - margin * 2
      let y = 40

      const ensureSpace = (needed = 20) => {
        if (y + needed > pageHeight - 40) {
          doc.addPage()
          y = 40
        }
      }

      const row = (label, value, bold = false) => {
        ensureSpace(18)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(String(label), margin, y)

        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(30, 41, 59)
        const valueLines = doc.splitTextToSize(String(value ?? '-'), 180)
        doc.text(valueLines, pageWidth - margin, y, { align: 'right' })
        y += Math.max(16, valueLines.length * 12)
      }

      doc.setFillColor(37, 99, 235)
      doc.roundedRect(margin, y, contentWidth, 64, 12, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('Enyecontrols', margin + 18, y + 24)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Official Statement of Account', margin + 18, y + 40)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(String(d.invoiceNo), pageWidth - margin - 18, y + 24, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Bill Date: ${d.billDate}`, pageWidth - margin - 18, y + 40, { align: 'right' })
      y += 84

      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, y, contentWidth / 2 - 8, 88, 10, 10, 'FD')
      doc.roundedRect(margin + contentWidth / 2 + 8, y, contentWidth / 2 - 8, 88, 10, 10, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      doc.text('ACCOUNT INFORMATION', margin + 14, y + 16)
      doc.text('BILL DETAILS', margin + contentWidth / 2 + 22, y + 16)

      let leftY = y + 34
      let rightY = y + 34
      const smallRow = (x, yy, label, value) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(label, x, yy)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 41, 59)
        const lines = doc.splitTextToSize(String(value ?? '-'), 150)
        doc.text(lines, x + 145, yy, { align: 'right' })
        return yy + Math.max(16, lines.length * 11)
      }

      leftY = smallRow(margin + 14, leftY, 'Tenant', d.tenantName)
      leftY = smallRow(margin + 14, leftY, d.units.length > 1 ? 'Units' : 'Unit', d.unitsLabel)
      leftY = smallRow(margin + 14, leftY, 'Invoice No.', d.invoiceNo)

      rightY = smallRow(margin + contentWidth / 2 + 22, rightY, 'Bill Date', d.billDate)
      rightY = smallRow(margin + contentWidth / 2 + 22, rightY, 'Due Date', d.dueDate)
      rightY = smallRow(margin + contentWidth / 2 + 22, rightY, 'Period', d.billingPeriod)
      y += 108

      ensureSpace(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      doc.text('UTILITY CHARGES', margin, y)
      y += 12

      const columns = [
        { key: 'particular', label: 'Description', width: 110, align: 'left' },
        { key: 'prev', label: 'Prev', width: 65, align: 'left' },
        { key: 'curr', label: 'Current', width: 65, align: 'left' },
        { key: 'used', label: 'Consumption', width: 95, align: 'left' },
        { key: 'rate', label: 'Rate', width: 85, align: 'left' },
        { key: 'amount', label: 'Amount', width: 70, align: 'right' },
      ]

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.rect(margin, y, contentWidth, 24, 'FD')
      let x = margin + 8
      columns.forEach((col) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(col.label, col.align === 'right' ? x + col.width - 8 : x, y + 15, {
          align: col.align === 'right' ? 'right' : 'left',
        })
        x += col.width
      })

      y += 24

      const rows = d.charges.length > 0
        ? d.charges
        : [{ particular: 'No utility charges available.', prev: '', curr: '', used: '', rate: '', amount: '' }]

      rows.forEach((charge) => {
        const values = {
          particular: charge.particular,
          prev: charge.prev,
          curr: charge.curr,
          used: charge.used,
          rate: charge.rate,
          amount: charge.amount === '' ? '' : `PHP ${peso(charge.amount)}`,
        }

        const lineCounts = columns.map((col) =>
          doc.splitTextToSize(String(values[col.key] ?? ''), col.width - 10).length
        )
        const rowHeight = Math.max(24, Math.max(...lineCounts) * 12 + 8)
        ensureSpace(rowHeight + 2)

        doc.setDrawColor(241, 245, 249)
        doc.rect(margin, y, contentWidth, rowHeight)

        let cellX = margin + 8
        columns.forEach((col) => {
          doc.setFont('helvetica', col.key === 'amount' || col.key === 'particular' ? 'bold' : 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(51, 65, 85)
          const lines = doc.splitTextToSize(String(values[col.key] ?? ''), col.width - 10)
          doc.text(lines, col.align === 'right' ? cellX + col.width - 8 : cellX, y + 14, {
            align: col.align === 'right' ? 'right' : 'left',
          })
          cellX += col.width
        })

        y += rowHeight
      })

      y += 14
      ensureSpace(100)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, y, contentWidth, 82, 10, 10, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      doc.text('SUMMARY', margin + 14, y + 16)
      y += 34

      row('Subtotal', `PHP ${peso(d.subtotal)}`)
      row('VAT (12%)', `PHP ${peso(d.tax)}`)
      row('Previous Balance', `PHP ${peso(d.previousBalance)}`)
      row('Late Payment Penalty', `PHP ${peso(d.penaltyAmount)}`)
      row('Payments Received', `PHP ${peso(d.paymentsReceived)}`)
      y += 10

      ensureSpace(54)
      doc.setFillColor(37, 99, 235)
      doc.roundedRect(margin, y, contentWidth, 54, 10, 10, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('TOTAL AMOUNT DUE', margin + 16, y + 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Due by ${d.dueDate}`, margin + 16, y + 34)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text(`PHP ${peso(d.grandTotal)}`, pageWidth - margin - 16, y + 30, { align: 'right' })
      y += 72

      ensureSpace(44)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, y, contentWidth, 44, 10, 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text('Payment Instructions', margin + 14, y + 16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 116, 139)
      const foot = doc.splitTextToSize(
        'Pay at any authorized payment center or via bank transfer to Enyecontrols Management (BDO #1234-5678-90). Inquiries: billing@enye.ph | +63 2 8888 0000',
        contentWidth - 28
      )
      doc.text(foot, margin + 14, y + 30)

      doc.save(`SOA_${String(d.tenantName).replace(/\s+/g, '_')}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-white/80 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm">Enyecontrols</p>
              <p className="text-xs text-white/70">
                Official Statement of Account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${st.badge}`}
            >
              <st.Icon className="w-3 h-3" />
              {st.label}
            </span>

            <button
              onClick={handlePrint}
              title="Print"
              aria-label="Print statement of account"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              title="Export CSV"
              aria-label="Export statement of account as CSV"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              title={pdfLoading ? 'Preparing PDF' : 'Export PDF'}
              aria-label={pdfLoading ? 'Preparing PDF export' : 'Export statement of account as PDF'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{pdfLoading ? 'Preparing PDF...' : 'PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={pdfRef} className="space-y-4 bg-white dark:bg-slate-900 rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">
              Account Information
            </p>
            <div className="space-y-2">
              {[
                ['Tenant', d.tenantName],
                [d.units.length > 1 ? 'Units' : 'Unit', d.unitsLabel],
                ['Invoice No.', d.invoiceNo],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-xs text-slate-400 flex-shrink-0">{k}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-right break-all">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">
              Bill Details
            </p>
            <div className="space-y-2">
              {[
                ['Bill Date', d.billDate],
                ['Due Date', d.dueDate],
                ['Period', d.billingPeriod],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-xs text-slate-400 flex-shrink-0">{k}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-right">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">
            Utility Charges
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs" style={{ minWidth: '500px' }}>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  {['Description', 'Prev', 'Current', 'Consumption', 'Rate', 'Amount'].map((h) => (
                    <th
                      key={h}
                      className="text-left font-mono uppercase text-slate-400 px-3 py-2.5 last:text-right whitespace-nowrap"
                      style={{ fontSize: '9px', letterSpacing: '.07em' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {d.charges.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-slate-400 text-xs"
                    >
                      No utility charges available.
                    </td>
                  </tr>
                ) : (
                  d.charges.map((c) => {
                    const CIcon = ICONS[c.particular]
                    return (
                      <tr
                        key={c.id || c.particular}
                        className="border-b border-slate-100 dark:border-slate-700/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {CIcon && (
                              <CIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {c.particular}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-500 dark:text-slate-400">
                          {c.prev}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-500 dark:text-slate-400">
                          {c.curr}
                        </td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {c.used}
                        </td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {c.rate}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          ₱{peso(c.amount)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">
            Summary
          </p>
          <div className="space-y-2">
            {[
              ['Subtotal', d.subtotal],
              ['VAT (12%)', d.tax],
              ['Previous Balance', d.previousBalance],
              ['Late Payment Penalty', d.penaltyAmount],
              ['Payments Received', d.paymentsReceived],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{l}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  ₱{peso(v)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">
              Total Amount Due
            </p>
            <p className="text-xs text-white/70 mt-0.5">Due by {d.dueDate}</p>
          </div>
          <p className="text-white font-bold text-xl sm:text-2xl whitespace-nowrap">
            ₱{peso(d.grandTotal)}
          </p>
        </div>

        {d.adjustmentState?.latestAdjustment ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500">Adjustment Summary</p>
                <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-200">
                  {d.adjustmentState.isAdjusted ? 'Adjusted Bill' : 'Adjustment Pending Approval'}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {d.adjustmentState.latestAdjustment.otherReason || d.adjustmentState.latestAdjustment.reason || 'Adjustment details recorded by Finance.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500">Original Total</p>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">PHP {peso(d.adjustmentState.originalAmount)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['Adjusted Total', d.adjustmentState.adjustedAmount],
                ['Net Difference', d.adjustmentState.totalAdjustmentAmount],
                ['Remaining Balance', d.adjustmentState.remainingBalance],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/70 px-3 py-3 dark:bg-slate-900/40">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-amber-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-100">
                    PHP {peso(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {d.receipt ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">
              Payment Receipt
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                {[
                  ['Reference No.', d.receipt.referenceNumber || '—'],
                  ['Payment Date', d.receipt.paymentDate || '—'],
                  ['Submitted By', d.receipt.submittedBy || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-xs text-slate-400 flex-shrink-0">{k}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-right break-all">
                      {v}
                    </span>
                  </div>
                ))}

                {d.receipt.note ? (
                  <div className="pt-1">
                    <p className="text-xs text-slate-400 mb-1">Note</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {d.receipt.note}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                {d.receipt.receiptImage ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 p-2 dark:bg-slate-800">
                    <img
                      src={d.receipt.receiptImage}
                      alt="Payment receipt"
                      className="block h-auto max-h-72 w-full rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-400">
                    No receipt image available.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Payment Instructions
          </p>
          <p>
            Pay at any authorized payment center or via bank transfer to
            Enyecontrols Management (BDO #1234-5678-90). Inquiries:{' '}
            <span className="text-slate-500">billing@enye.ph</span> · +63 2 8888
            0000
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BillViewerModal({ bill, isOpen, onClose }) {
  const lastRef = useRef(null)

  if (bill) {
    lastRef.current = bill
  }

  const shown = bill ?? lastRef.current

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Statement of Account"
      subtitle={shown ? `Invoice ${shown.id}` : ''}
    >
      {shown && <BillContent bill={shown} />}
    </Modal>
  )
}
