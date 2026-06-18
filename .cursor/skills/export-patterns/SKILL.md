---
name: export-patterns
description: >
  Canonical patterns for data export in recovery-platform (CSV, Excel, PDF). Use this
  skill whenever you need to add a download button, export a table or report, generate
  a PDF of a shipment detail or document, or implement any file-download feature. Triggers
  on: "export to Excel", "download PDF", "add CSV export", "export this table", "generate
  report", "download button", "print this page", "export shipments", any time a page
  needs a data download capability.
---

# export-patterns — Recovery Platform

Recovery Platform does not yet have a shared export component library (unlike
trade-harmonizer's `CsvExportButton`). This skill establishes the patterns to follow
so that export logic doesn't get duplicated and stays consistent as pages are added.

---

## Guiding principle

Build export helpers as **colocated utility functions** next to the page that first
needs them. When a second page needs the same export type, extract to
`src/utils/export.ts`. This avoids premature abstraction while preventing duplication.

---

## CSV Export

The lightest option. Use for any flat tabular data (shipment lists, inbox documents,
settings exports).

### Install (if not already present)

```bash
npm install react-csv
npm install --save-dev @types/react-csv
```

### Pattern

```tsx
import { CSVLink } from 'react-csv'
import { Button } from '@/components/ui/button'

interface ExportCsvButtonProps {
  data: Record<string, unknown>[]
  filename?: string
  disabled?: boolean
}

export function ExportCsvButton({ data, filename = 'export.csv', disabled }: ExportCsvButtonProps) {
  return (
    <CSVLink data={data} filename={filename}>
      <Button variant="secondary" size="sm" disabled={disabled || data.length === 0}>
        Export CSV
      </Button>
    </CSVLink>
  )
}
```

Once this is used in 2+ pages, move it to `src/components/shared/export-csv-button.tsx`.

---

## Excel Export (exceljs)

Use when structured formatting is needed — bold headers, column widths, multiple sheets.

### Install (if not already present)

```bash
npm install exceljs
```

### Pattern — create `src/utils/export.ts`

```typescript
import ExcelJS from 'exceljs'

export interface ExcelColumn {
  header: string
  key: string
  width?: number
}

export async function downloadExcel(
  rows: Record<string, unknown>[],
  columns: ExcelColumn[],
  filename = 'export.xlsx',
  sheetName = 'Data',
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)

  sheet.columns = columns.map((c) => ({ ...c, width: c.width ?? 18 }))

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' },
  }

  rows.forEach((row) => sheet.addRow(row))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

### Usage in a component

```tsx
import { Button } from '@/components/ui/button'
import { downloadExcel } from '@/utils/export'

function ShipmentsToolbar({ shipments }: { shipments: RecoveryShipment[] }) {
  const handleExport = async () => {
    await downloadExcel(
      shipments.map((s) => ({
        id: s.id,
        origin: s.origin,
        destination: s.destination,
        status: s.status,
        createdAt: s.createdAt,
      })),
      [
        { header: 'Shipment ID', key: 'id', width: 22 },
        { header: 'Origin', key: 'origin', width: 16 },
        { header: 'Destination', key: 'destination', width: 16 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Created', key: 'createdAt', width: 22 },
      ],
      'shipments.xlsx',
    )
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={!shipments.length}>
      Export Excel
    </Button>
  )
}
```

---

## PDF Export (html2canvas + jspdf)

Use when you need a pixel-accurate snapshot of rendered UI — shipment detail cards,
inbox document previews, or styled reports.

### Install (if not already present)

```bash
npm install html2canvas jspdf
```

### Pattern — add to `src/utils/export.ts`

```typescript
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function downloadElementAsPdf(
  elementRef: React.RefObject<HTMLElement>,
  filename = 'export.pdf',
): Promise<void> {
  const element = elementRef.current
  if (!element) return

  const canvas = await html2canvas(element, {
    scale: 2, // retina quality
    useCORS: true, // needed for cross-origin images/fonts
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  let yOffset = 0
  while (yOffset < imgHeight) {
    if (yOffset > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, -yOffset, pageWidth, imgHeight)
    yOffset += pageHeight
  }

  pdf.save(filename)
}
```

### Usage in a component

```tsx
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { downloadElementAsPdf } from '@/utils/export'

function ShipmentDetailCard({ shipment }: { shipment: RecoveryShipment }) {
  const printRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={printRef} className="bg-rp-surface p-6 rounded-lg">
        {/* card content */}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => downloadElementAsPdf(printRef, `shipment-${shipment.id}.pdf`)}
      >
        Download PDF
      </Button>
    </>
  )
}
```

**Gotchas:**

- The element must be visible (not hidden or zero-size) during capture
- `rp-*` CSS variables resolve correctly because they're on `:root` — canvas will use the right tenant colours
- SVG icons inside the capture area need `useCORS: true` if they're loaded from a CDN

---

## Choosing the right format

| Scenario                                 | Format                                  |
| ---------------------------------------- | --------------------------------------- |
| Shipment list / inbox list               | CSV (fastest, user can filter in Excel) |
| Formatted report with styled columns     | Excel                                   |
| Shipment detail card or document preview | PDF                                     |
| Multi-sheet data dump                    | Excel                                   |

---

## Error reporting on export failures

Don't swallow export errors silently. Wrap in try/catch and report:

```typescript
import { reportRuntimeError } from '@/lib/error-reporting'

try {
  await downloadExcel(rows, columns, filename)
} catch (err) {
  reportRuntimeError('export:excel:shipments', err)
  // optionally show a toast
}
```
