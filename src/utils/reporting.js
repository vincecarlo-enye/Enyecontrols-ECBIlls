import { escapeCsvValue } from '@/utils/exportCsv'

function removeNodes(root, selector) {
  root.querySelectorAll(selector).forEach((node) => node.remove())
}

function removePrintOnlyNodes(root) {
  removeNodes(
    root,
    [
      'script',
      'style',
      'button',
      'input',
      'select',
      'textarea',
      'form',
      '[role="button"]',
      '[data-print-hide="true"]',
      '.no-print',
      '.sr-only',
    ].join(', ')
  )
}

function findSectionLabel(table) {
  const section = table.closest('section, article, div')
  if (!section) return ''

  const heading = section.querySelector('h1, h2, h3, h4, h5, h6')
  if (heading?.textContent?.trim()) {
    return heading.textContent.trim()
  }

  const labels = Array.from(section.querySelectorAll('p, span'))
    .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() || '')
    .filter(Boolean)

  return labels.find((text) => text.length <= 80) || ''
}

function stripActionColumns(root) {
  root.querySelectorAll('table').forEach((table) => {
    const rows = Array.from(table.rows || [])
    if (rows.length === 0) return

    const headerRow = rows.find((row) => row.querySelector('th'))
    if (!headerRow) return

    const actionIndexes = Array.from(headerRow.cells || [])
      .map((cell, index) => ({
        index,
        label: cell.textContent?.trim().toLowerCase() || '',
      }))
      .filter(({ label }) => ['action', 'actions', 'controls', 'options'].includes(label))
      .map(({ index }) => index)
      .sort((a, b) => b - a)

    if (actionIndexes.length === 0) return

    rows.forEach((row) => {
      actionIndexes.forEach((index) => {
        if (row.cells?.[index]) {
          row.deleteCell(index)
        }
      })
    })
  })
}

function pruneEmptyBlocks(root) {
  const candidates = Array.from(root.querySelectorAll('div, section, article, aside, header, footer, label'))

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const node = candidates[index]
    if (!node.isConnected) continue

    const hasMeaningfulChild = node.querySelector('table, thead, tbody, tr, td, th, img, svg, canvas, ul, ol, li, p, h1, h2, h3, h4, h5, h6')
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || ''

    if (!hasMeaningfulChild && !text) {
      node.remove()
    }
  }
}

function extractTablesOnly(root) {
  const tables = Array.from(root.querySelectorAll('table'))
  if (tables.length === 0) return root

  const shell = document.createElement('div')

  tables.forEach((table, index) => {
    const block = document.createElement('section')
    block.className = 'print-table-block'

    const label = findSectionLabel(table)
    if (label) {
      const heading = document.createElement('h2')
      heading.className = 'print-table-title'
      heading.textContent = label
      block.appendChild(heading)
    }

    block.appendChild(table.cloneNode(true))
    shell.appendChild(block)

    if (index < tables.length - 1) {
      const spacer = document.createElement('div')
      spacer.className = 'print-table-spacer'
      shell.appendChild(spacer)
    }
  })

  return shell
}

function createPrintableClone(element, mode = 'tables') {
  const clone = element.cloneNode(true)
  removePrintOnlyNodes(clone)

  if (mode === 'full' || mode === 'visual') {
    pruneEmptyBlocks(clone)
    return clone
  }

  removeNodes(clone, ['svg', 'canvas', 'img'].join(', '))
  stripActionColumns(clone)
  pruneEmptyBlocks(clone)
  return extractTablesOnly(clone)
}

function getDocumentStyleMarkup() {
  return Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n')
}

/**
 * Export an array of plain objects as a CSV file.
 * Renamed from downloadCsv to avoid confusion with exportCsv.js:downloadCsv.
 * This version auto-detects headers from object keys.
 */
export function exportTableCsv(filename, rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return false

  const normalizedRows = rows.map((row) => (row && typeof row === 'object' && !Array.isArray(row) ? row : { value: row }))
  const headers = Array.from(
    normalizedRows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key))
      return set
    }, new Set())
  )

  if (headers.length === 0) return false

  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...normalizedRows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}

export function printElement({ title, subtitle = '', element, mode = 'tables' }) {
  if (!element) return false

  const generatedAt = new Date().toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const content = createPrintableClone(element, mode).innerHTML
  const styleMarkup = mode === 'visual' ? getDocumentStyleMarkup() : ''
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'

  const markup = `
  <html>
    <head>
      <title>${title}</title>
      ${styleMarkup}
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 28px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.5;
          color: #0f172a;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 180px);
        }
        .print-shell { max-width: 1120px; margin: 0 auto; }
        .print-header {
          margin-bottom: 24px;
          padding: 20px 22px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: #fff;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        .print-brand {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.78;
          margin: 0 0 6px;
        }
        .print-title { font-size: 24px; font-weight: 800; margin: 0 0 4px; line-height: 1.2; }
        .print-subtitle { font-size: 13px; color: rgba(255,255,255,.82); margin: 0; max-width: 640px; }
        .print-meta-panel {
          min-width: 220px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.18);
        }
        .print-meta-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.72;
          margin: 0 0 6px;
        }
        .print-meta-value { font-size: 13px; font-weight: 700; margin: 0; }
        .print-content > * + * { margin-top: 18px; }
        .print-table-block {
          break-inside: avoid;
          padding: 16px 18px 18px;
          border: 1px solid #dbe7f3;
          border-radius: 14px;
          background: #fff;
        }
        .print-table-title {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 12px;
          color: #0f172a;
        }
        .print-table-spacer { height: 0; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 14px !important; }
        .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, [class*="shadow-"] { box-shadow: none !important; }
        .border, [class*="border-"] { border-color: #cbd5e1 !important; }
        .bg-white, .bg-slate-50, .bg-slate-100, .dark\\:bg-slate-900, .dark\\:bg-slate-800, .dark\\:bg-slate-800\\/50 { background: #ffffff !important; }
        .text-white, .dark\\:text-white { color: #0f172a !important; }
        .text-slate-400, .text-slate-500, .dark\\:text-slate-400, .dark\\:text-slate-300 { color: #475569 !important; }
        .grid { display: grid; gap: 16px; }
        .flex { display: flex; }
        .overflow-x-auto { overflow: visible !important; }
        [data-print-hide="true"], .no-print { display: none !important; }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 8px;
          overflow: hidden;
          border: 1px solid #dbe7f3;
          border-radius: 12px;
        }
        th, td {
          border: 0;
          border-bottom: 1px solid #e8eef5;
          padding: 10px 12px;
          text-align: left;
          font-size: 12px;
          vertical-align: top;
        }
        tbody tr:last-child td { border-bottom: 0; }
        tbody tr:nth-child(even) td { background: #f8fbff; }
        th {
          background: #eff6ff !important;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 9px;
          font-weight: 800;
        }
        thead { display: table-header-group; }
        tr, img, svg, canvas { break-inside: avoid; }
        canvas, svg { max-width: 100% !important; }
        button { display: none !important; }
        input, select { border: 1px solid #cbd5e1 !important; background: #fff !important; color: #0f172a !important; }
        @media print {
          body { padding: 18px; background: #fff; }
          .print-shell { max-width: none; }
          .print-header { break-inside: avoid; }
        }
        ${mode === 'visual' ? `
        body {
          padding: 20px;
          background: #f8fafc;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-shell { max-width: 1240px; }
        .print-content {
          color: inherit;
        }
        .print-content .animate-in {
          animation: none !important;
        }
        .print-content .glass {
          backdrop-filter: none !important;
        }
        .print-content [class*="shadow-"] {
          box-shadow: none !important;
        }
        .print-content .dark\\:text-white,
        .print-content .dark\\:text-slate-200,
        .print-content .dark\\:text-slate-300,
        .print-content .dark\\:text-slate-400,
        .print-content .dark\\:bg-slate-900,
        .print-content .dark\\:bg-slate-800,
        .print-content .dark\\:bg-slate-800\\/60,
        .print-content .dark\\:border-slate-700 {
          color: inherit !important;
          background: inherit;
          border-color: inherit;
        }
        .print-content .grid {
          break-inside: avoid;
        }
        .print-content .print-occupancy-summary {
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          gap: 12px !important;
          align-items: stretch;
        }
        .print-content .print-occupancy-summary > * {
          min-width: 0;
        }
        .print-content .print-billing-summary {
          display: grid !important;
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 12px !important;
          align-items: stretch;
        }
        .print-content .print-billing-summary-card {
          min-width: 0;
          padding: 14px 16px !important;
          border: 1px solid #dbe7f3 !important;
          border-radius: 16px !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
          box-shadow: none !important;
        }
        .print-content .print-billing-summary-label {
          margin: 0 0 8px !important;
          font-size: 10px !important;
          letter-spacing: 0.1em !important;
          color: #64748b !important;
        }
        .print-content .print-billing-summary-value {
          margin: 0 !important;
          font-size: 30px !important;
          line-height: 1 !important;
        }
        .print-content .print-facility-overview {
          gap: 10px !important;
          margin-bottom: 12px !important;
        }
        .print-content .print-facility-report-main {
          grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.9fr) !important;
          gap: 12px !important;
          align-items: start !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .print-content .print-facility-chart-card,
        .print-content .print-facility-summary-card {
          padding: 14px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .print-content .print-facility-chart-card .mb-5 {
          margin-bottom: 10px !important;
        }
        .print-content .print-facility-chart-card .flex.flex-wrap.gap-2 {
          gap: 6px !important;
          margin-bottom: 10px !important;
        }
        .print-content .print-facility-chart-card button {
          display: inline-flex !important;
          padding: 6px 10px !important;
          font-size: 11px !important;
          box-shadow: none !important;
        }
        .print-content .print-facility-chart-wrap {
          height: 220px !important;
          min-height: 220px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .print-content .print-facility-chart-wrap .recharts-responsive-container {
          height: 220px !important;
        }
        .print-content .print-facility-summary-card h2 {
          margin-bottom: 10px !important;
        }
        .print-content .print-facility-summary-card .space-y-3 > * + * {
          margin-top: 8px !important;
        }
        .print-content .print-facility-summary-card .space-y-3 > div {
          padding: 10px 12px !important;
        }
        .print-content section,
        .print-content article,
        .print-content .rounded-2xl,
        .print-content .rounded-xl {
          break-inside: avoid;
        }
        @media print {
          body {
            padding: 12px;
            background: #fff;
          }
          .print-header {
            margin-bottom: 18px;
          }
          .print-content .print-occupancy-summary {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }
          .print-content .print-billing-summary {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .print-content .print-facility-overview {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .print-content .print-facility-report-main {
            grid-template-columns: minmax(0, 1.45fr) minmax(240px, 0.9fr) !important;
            gap: 10px !important;
          }
          .print-content .print-facility-chart-wrap,
          .print-content .print-facility-chart-wrap .recharts-responsive-container {
            height: 200px !important;
            min-height: 200px !important;
          }
        }
        ` : ''}
      </style>
    </head>
    <body>
      <div class="print-shell">
        <div class="print-header">
          <div>
            <p class="print-brand">Enyecontrols</p>
            <h1 class="print-title">${title}</h1>
            ${subtitle ? `<p class="print-subtitle">${subtitle}</p>` : ''}
          </div>
          <div class="print-meta-panel">
            <p class="print-meta-label">Generated</p>
            <p class="print-meta-value">${generatedAt}</p>
          </div>
        </div>
        <div class="print-content">${content}</div>
      </div>
    </body>
  </html>
  `

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }

  iframe.onload = () => {
    const targetWindow = iframe.contentWindow
    if (!targetWindow) {
      cleanup()
      return
    }

    const finish = () => setTimeout(cleanup, 1200)

    targetWindow.onafterprint = finish
    targetWindow.focus()
    targetWindow.requestAnimationFrame(() => {
      targetWindow.print()
      finish()
    })
  }

  document.body.appendChild(iframe)
  iframe.srcdoc = markup
  return true
}
