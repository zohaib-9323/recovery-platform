import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const REPORT_CONTENT_ID = 'report-content'
const PDF_EXCLUDE_SELECTOR = '[data-pdf-exclude]'

function getBrandName(): string {
  if (typeof document === 'undefined') return 'Trade Harmonizer'
  return document.documentElement.dataset.tenantName?.trim() || 'Trade Harmonizer'
}

function getLogoUrl(): string {
  const tenantLogo =
    typeof document !== 'undefined' ? document.documentElement.dataset.tenantLogo?.trim() : ''
  if (tenantLogo) return tenantLogo
  return `${process.env.PUBLIC_URL}/images/app-logo.svg`
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function createPdfCaptureClone(source: HTMLElement): {
  captureTarget: HTMLElement
  cleanup: () => void
} {
  const wrapper = document.createElement('div')
  wrapper.className = 'pdf-capture-root force-desktop-layout'
  wrapper.setAttribute('aria-hidden', 'true')

  const clone = source.cloneNode(true) as HTMLElement
  clone.removeAttribute('id')
  clone.querySelectorAll(PDF_EXCLUDE_SELECTOR).forEach((node) => node.remove())

  const title = clone.querySelector('[data-pdf-title]')
  title?.classList.add('pl-3')

  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  return {
    captureTarget: clone,
    cleanup: () => wrapper.remove(),
  }
}

export async function downloadShipmentDetailPdf(shipmentId: string): Promise<void> {
  const element = document.getElementById(REPORT_CONTENT_ID)
  if (!element) {
    throw new Error('Shipment detail content not found')
  }

  const { captureTarget, cleanup } = createPdfCaptureClone(element)

  try {
    await document.fonts.ready
    await new Promise((resolve) => window.setTimeout(resolve, 300))

    const canvas = await html2canvas(captureTarget, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      scrollY: 0,
      windowWidth: 1200,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png', 0.7)
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const imgWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    const logoImg = await loadImage(getLogoUrl())
    if (logoImg) {
      const imageFormat = getLogoUrl().toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG'
      try {
        pdf.addImage(logoImg, imageFormat, 5, 5, 15, 15)
      } catch {
        // Skip logo when format is unsupported (e.g. SVG in some browsers).
      }
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text(getBrandName(), imgWidth / 2, 15, { align: 'center' })

    const contentY = 20
    pdf.addImage(imgData, 'PNG', 0, contentY, imgWidth, imgHeight)
    heightLeft -= pageHeight - contentY

    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position + contentY, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const pdfBlob = pdf.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `shipment-${shipmentId}.pdf`
    link.click()
    URL.revokeObjectURL(pdfUrl)
  } finally {
    cleanup()
  }
}
