export function escapeCsvValue(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text
}

function normalizeRows(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  if (Array.isArray(rows[0])) {
    return rows
  }

  if (rows[0] && typeof rows[0] === 'object') {
    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row || {}).forEach((key) => set.add(key))
        return set
      }, new Set())
    )

    return [
      headers,
      ...rows.map((row) => headers.map((header) => row?.[header] ?? '')),
    ]
  }

  return rows.map((value) => [value])
}

export function toCsv(rows) {
  const normalizedRows = normalizeRows(rows)

  return '\uFEFF' + normalizedRows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\r\n')
}

export function downloadCsv(filename, rows) {
  const csv = toCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
