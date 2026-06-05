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
  const candidates = Array.from(
    root.querySelectorAll('div, section, article, aside, header, footer, label')
  )

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const node = candidates[index]
    if (!node.isConnected) continue

    const hasMeaningfulChild = node.querySelector(
      'table, thead, tbody, tr, td, th, img, svg, canvas, ul, ol, li, p, h1, h2, h3, h4, h5, h6'
    )
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

export function exportTableCsv(filename, rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return false

  const normalizedRows = rows.map((row) =>
    row && typeof row === 'object' && !Array.isArray(row) ? row : { value: row }
  )
  const headers = Array.from(
    normalizedRows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key))
      return set
    }, new Set())
  )

  if (headers.length === 0) return false

  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...normalizedRows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(',')
    ),
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
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'

  const markup = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  ${styleMarkup}
  <style>
    /* ── Reset & base ──────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { color-scheme: light; }

    /* Force-kill every interactive element — no exceptions */
    button, [role="button"],
    input[type="button"], input[type="submit"],
    input[type="reset"], a[class*="btn"] {
      display: none !important;
    }

    html, body {
      width: 100%;
      background: #f0f4f8;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #0f1923;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page shell ─────────────────────────────────────────────────────── */
    .ps {
      max-width: 1080px;
      margin: 0 auto;
      padding: 28px 28px 36px;
    }

    /* ── Header ─────────────────────────────────────────────────────────── */
    .ph {
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      padding: 22px 26px;
      margin-bottom: 22px;
      border-radius: 14px;
      overflow: hidden;
      background: #0f1923;
      color: #fff;
    }

    /* Subtle dot-grid texture */
    .ph::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,.08) 1px, transparent 1px);
      background-size: 18px 18px;
      pointer-events: none;
    }

    /* Accent bar — left edge */
    .ph::after {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%);
    }

    .ph-left { position: relative; z-index: 1; }

    .ph-brand {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255,255,255,.45);
      margin-bottom: 8px;
    }

    .ph-brand-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #3b82f6;
      flex-shrink: 0;
    }

    .ph-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.4px;
      line-height: 1.15;
      color: #fff;
      margin-bottom: 5px;
    }

    .ph-subtitle {
      font-size: 12.5px;
      color: rgba(255,255,255,.5);
      font-weight: 300;
      max-width: 520px;
    }

    /* Meta pill (top-right) */
    .ph-meta {
      position: relative;
      z-index: 1;
      flex-shrink: 0;
      padding: 10px 14px;
      border-radius: 9px;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      text-align: right;
    }

    .ph-meta-label {
      font-size: 8.5px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,.38);
      margin-bottom: 4px;
    }

    .ph-meta-value {
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,.75);
      white-space: nowrap;
    }

    /* ── Content area ───────────────────────────────────────────────────── */
    .pc > * + * { margin-top: 14px; }

    /* ── Table blocks ───────────────────────────────────────────────────── */
    .print-table-block {
      background: #fff;
      border: 1px solid #dde3ec;
      border-radius: 11px;
      padding: 16px 18px 20px;
      break-inside: avoid;
    }

    .print-table-title {
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #edf0f5;
    }

    .print-table-spacer { height: 0; }

    /* ── Tables ─────────────────────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    thead tr {
      background: #f5f8ff;
    }

    th {
      padding: 9px 12px;
      text-align: left;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
      border-bottom: 1.5px solid #dde3ec;
      white-space: nowrap;
    }

    td {
      padding: 9px 12px;
      border-bottom: 1px solid #edf0f5;
      color: #1e293b;
      vertical-align: middle;
    }

    tbody tr:last-child td { border-bottom: none; }

    tbody tr:hover td { background: #fafbff; }

    /* Zebra for dense tables */
    tbody tr:nth-child(even) td { background: #fafbff; }
    tbody tr:nth-child(odd) td { background: #fff; }

    /* ── Utility overrides ──────────────────────────────────────────────── */
    .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 11px !important; }
    [class*="shadow-"] { box-shadow: none !important; }
    .overflow-x-auto { overflow: visible !important; }
    [data-print-hide="true"], .no-print { display: none !important; }
    .bg-white, .bg-slate-50, .bg-slate-100,
    .dark\\:bg-slate-900, .dark\\:bg-slate-800,
    .dark\\:bg-slate-800\\/50 { background: #ffffff !important; }
    .text-white, .dark\\:text-white { color: #0f1923 !important; }
    .text-slate-400, .text-slate-500,
    .dark\\:text-slate-400, .dark\\:text-slate-300 { color: #64748b !important; }

    /* ── Status badges / pills ──────────────────────────────────────────── */
    [class*="badge"], [class*="pill"], [class*="tag"],
    [class*="status"], [class*="chip"] {
      border-radius: 4px !important;
      padding: 2px 7px !important;
      font-size: 10px !important;
      font-weight: 600 !important;
    }

    /* ── Charts / canvas ────────────────────────────────────────────────── */
    canvas, svg { max-width: 100% !important; }
    tr, img, svg, canvas { break-inside: avoid; }

    /* ── Visual mode extras ─────────────────────────────────────────────── */
    ${mode === 'visual' ? `
    body { background: #f0f4f8; }
    .ps { max-width: 1200px; }
    .pc { color: inherit; }
    .pc .animate-in { animation: none !important; }
    .pc .glass { backdrop-filter: none !important; }
    .pc [class*="shadow-"] { box-shadow: none !important; }
    .pc .dark\\:text-white,
    .pc .dark\\:text-slate-200,
    .pc .dark\\:text-slate-300,
    .pc .dark\\:text-slate-400,
    .pc .dark\\:bg-slate-900,
    .pc .dark\\:bg-slate-800,
    .pc .dark\\:bg-slate-800\\/60,
    .pc .dark\\:border-slate-700 {
      color: inherit !important;
      background: inherit;
      border-color: inherit;
    }
    .pc .grid { break-inside: avoid; }
    .pc .print-occupancy-summary {
      display: grid !important;
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      gap: 12px !important;
    }
    .pc .print-billing-summary {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 12px !important;
    }
    .pc .print-billing-summary-card {
      min-width: 0;
      padding: 14px 16px !important;
      border: 1px solid #dde3ec !important;
      border-radius: 11px !important;
      background: #fff !important;
      box-shadow: none !important;
    }
    .pc .print-billing-summary-label {
      font-size: 10px !important;
      letter-spacing: 0.1em !important;
      color: #64748b !important;
      margin-bottom: 6px !important;
    }
    .pc .print-billing-summary-value {
      font-size: 28px !important;
      line-height: 1 !important;
    }
    .pc .print-facility-overview { gap: 10px !important; margin-bottom: 12px !important; }
    .pc .print-facility-report-main {
      grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.9fr) !important;
      gap: 12px !important;
      break-inside: avoid !important;
    }
    .pc .print-facility-chart-card,
    .pc .print-facility-summary-card {
      padding: 14px !important;
      break-inside: avoid !important;
    }
    .pc .print-facility-chart-wrap {
      height: 220px !important;
      min-height: 220px !important;
      break-inside: avoid !important;
    }
    .pc .print-facility-chart-wrap .recharts-responsive-container { height: 220px !important; }
    .pc section, .pc article,
    .pc .rounded-2xl, .pc .rounded-xl { break-inside: avoid; }
    ` : ''}

    /* ── Print media ────────────────────────────────────────────────────── */
    @media print {
      @page {
        size: A4 landscape;
        margin: 10mm 12mm;
      }

      html, body {
        background: #fff !important;
        height: auto !important;
        overflow: visible !important;
      }

      body { padding: 0; }

      .ps {
        padding: 0;
        max-width: none;
        /* Scale everything down to fit 1 page — tune between 0.70–0.88 */
        zoom: 0.80;
        transform-origin: top left;
      }

      /* Kill all page breaks */
      .pc, .pc * {
        page-break-before: avoid !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-before: avoid !important;
        break-after: avoid !important;
        break-inside: avoid !important;
      }

      .ph { break-inside: avoid; margin-bottom: 14px; }

      /* Keep buttons gone — even after app styles inject */
      button, [role="button"] { display: none !important; }

      ${mode === 'visual' ? `
      .pc .print-occupancy-summary {
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      }
      .pc .print-billing-summary {
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      }
      .pc .print-facility-overview {
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      }
      .pc .print-facility-report-main {
        grid-template-columns: minmax(0, 1.45fr) minmax(240px, 0.9fr) !important;
        gap: 10px !important;
      }
      .pc .print-facility-chart-wrap,
      .pc .print-facility-chart-wrap .recharts-responsive-container {
        height: 200px !important;
        min-height: 200px !important;
      }
      ` : ''}
    }
  </style>
</head>
<body>
  <div class="ps">
    <header class="ph">
      <div class="ph-left">
        <div class="ph-brand">
          <span class="ph-brand-dot"></span>
          Enyecontrols
        </div>
        <h1 class="ph-title">${title}</h1>
        ${subtitle ? `<p class="ph-subtitle">${subtitle}</p>` : ''}
      </div>
      <div class="ph-meta">
        <div class="ph-meta-label">Generated</div>
        <div class="ph-meta-value">${generatedAt}</div>
      </div>
    </header>
    <main class="pc">${content}</main>
  </div>
</body>
</html>
  `.trim()

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
  }

  iframe.onload = () => {
    const win = iframe.contentWindow
    if (!win) { cleanup(); return }
    const finish = () => setTimeout(cleanup, 1200)
    win.onafterprint = finish
    win.focus()
    win.requestAnimationFrame(() => { win.print(); finish() })
  }

  document.body.appendChild(iframe)
  iframe.srcdoc = markup
  return true
}