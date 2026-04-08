function escapeCsvValue(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export function downloadCsv(filename, rows = []) {
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

export function printElement({ title, subtitle = '', element }) {
  if (!element) return false

  const generatedAt = new Date().toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const content = element.innerHTML
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
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
          background: #ffffff;
        }
        .print-shell { max-width: 1200px; margin: 0 auto; }
        .print-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
        .print-title { font-size: 24px; font-weight: 700; margin: 0 0 6px; }
        .print-subtitle { font-size: 13px; color: #475569; margin: 0 0 10px; }
        .print-meta { font-size: 12px; color: #64748b; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 14px !important; }
        .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, [class*="shadow-"] { box-shadow: none !important; }
        .border, [class*="border-"] { border-color: #cbd5e1 !important; }
        .bg-white, .bg-slate-50, .bg-slate-100, .dark\\:bg-slate-900, .dark\\:bg-slate-800, .dark\\:bg-slate-800\\/50 { background: #ffffff !important; }
        .text-white, .dark\\:text-white { color: #0f172a !important; }
        .text-slate-400, .text-slate-500, .dark\\:text-slate-400, .dark\\:text-slate-300 { color: #475569 !important; }
        .grid { display: grid; gap: 16px; }
        .flex { display: flex; }
        .overflow-x-auto { overflow: visible !important; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
        th { background: #f8fafc !important; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
        canvas, svg { max-width: 100% !important; }
        button { display: none !important; }
        input, select { border: 1px solid #cbd5e1 !important; background: #fff !important; color: #0f172a !important; }
        @media print {
          body { padding: 18px; }
          .print-shell { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-shell">
        <div class="print-header">
          <h1 class="print-title">${title}</h1>
          ${subtitle ? `<p class="print-subtitle">${subtitle}</p>` : ''}
          <div class="print-meta">Generated ${generatedAt}</div>
        </div>
        <div>${content}</div>
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
