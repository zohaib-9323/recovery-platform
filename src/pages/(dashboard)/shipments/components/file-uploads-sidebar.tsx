import { useState } from 'react'

import { useDownloadRecoveryShipmentFileBlobMutation } from '@/app/services/recoveryApi'
import { showCustomToast } from '@/lib/showCustomToast'
import type { RecoveryShipmentDownloadFileType } from '@/types/recovery-shipments-api'

export type ShipmentDocumentRow = {
  type: Exclude<RecoveryShipmentDownloadFileType, 'both'>
  label: string
  fileName?: string
}

type FileUploadsSidebarProps = {
  shipmentId: string
  documents: ShipmentDocumentRow[]
  onClose: () => void
}

export function FileUploadsSidebar({ shipmentId, documents, onClose }: FileUploadsSidebarProps) {
  const [downloadFileBlob] = useDownloadRecoveryShipmentFileBlobMutation()
  const [downloadingType, setDownloadingType] = useState<string | null>(null)

  const hasDocuments = documents.length > 0

  // The file is streamed through our own API (not a presigned S3 URL) so the
  // download works regardless of the source bucket's CORS config and keeps the
  // user on the current page.
  const handleDownload = async (doc: ShipmentDocumentRow) => {
    if (downloadingType) {
      return
    }
    setDownloadingType(doc.type)
    try {
      const blob = await downloadFileBlob({ id: shipmentId, fileType: doc.type }).unwrap()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = doc.fileName || `${doc.type}-document`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch {
      showCustomToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to download file.',
      })
    } finally {
      setTimeout(() => setDownloadingType(null), 1000)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close file uploads"
        className="fixed inset-0 z-40 bg-black bg-opacity-25 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full animate-slide-in-right flex-col bg-white shadow-lg sm:w-96">
        <div className="flex items-center justify-between border-b border-bottomBorder p-4">
          <h2 className="text-lg font-semibold text-black">File Uploads</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-greyFour"
          >
            <span className="icon-close text-base text-black" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {!hasDocuments ? (
            <div className="flex h-full flex-col items-center justify-center text-lightBlackOne">
              <span className="icon-File-text mb-2 text-4xl" />
              <p className="text-sm">No documents available</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.type}
                className="rounded-lg border border-bottomBorder p-4 transition-colors hover:border-yellow"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-lightYellowThree">
                    <span className="icon-File-text text-xl text-yellow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-black">{doc.label}</p>
                    {doc.fileName ? (
                      <p
                        className="mt-0.5 truncate text-xs text-lightBlackOne"
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDownload(doc)}
                    disabled={downloadingType === doc.type}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-bottomBorder text-black transition-colors hover:bg-greyFour disabled:cursor-not-allowed disabled:opacity-50"
                    title="Download"
                  >
                    <span className="icon-Download text-sm" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </>
  )
}
