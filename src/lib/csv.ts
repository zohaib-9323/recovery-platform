/** Escape a CSV cell (RFC-style: quotes if needed). */
function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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
