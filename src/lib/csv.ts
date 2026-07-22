/** Neutralize spreadsheet formula injection: prefix cells starting with = + - @ tab or CR. */
export function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

/** Escape a CSV cell (RFC-style: quotes if needed) after neutralizing formula triggers. */
function escapeCell(value: string): string {
  const safe = neutralizeFormula(value)
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

export function buildShipmentsCsv(
  rows: { title: string; date: string; shipVia: string; po: string }[],
): string {
  const header = ['Shipment Title', 'Date', 'Ship Via', 'PO #']
  const lines = [
    header.map(escapeCell).join(','),
    ...rows.map((r) => [r.title, r.date, r.shipVia, r.po].map(escapeCell).join(',')),
  ]
  return lines.join('\r\n')
}

export function downloadTextFile(
  content: string,
  filename: string,
  mime = 'text/csv;charset=utf-8;',
): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}
