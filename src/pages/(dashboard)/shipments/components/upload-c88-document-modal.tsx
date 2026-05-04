import { useEffect, useId, useState } from 'react'

import { useUploadRecoveryShipmentC88DocumentMutation } from '@/app/services/recoveryApi'
import { Tooltip } from '@/components/ui/tooltip'
import { MS } from '@/lib/manage-shipments-copy'
import { showCustomToast } from '@/lib/showCustomToast'

export type UploadC88DocumentModalProps = {
  shipmentId: string
  /** Existing document URL when editing (manage-shipments passes this from the row). */
  uploadedDocument?: string
  onClose: () => void
}

export function UploadC88DocumentModal({
  shipmentId,
  uploadedDocument,
  onClose,
}: UploadC88DocumentModalProps) {
  const inputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadC88, { isLoading }] = useUploadRecoveryShipmentC88DocumentMutation()

  const hasExistingDoc = Boolean(uploadedDocument && String(uploadedDocument).trim() !== '')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleSubmit = async () => {
    if (!file) return
    setUploadError(null)
    try {
      const res = await uploadC88({ shipmentId, file }).unwrap()
      if (res.status === false) {
        setUploadError(res.message ?? MS.uploadC88Failed)
        showCustomToast({
          type: 'error',
          title: MS.error,
          message: res.message ?? MS.uploadC88Failed,
        })
        return
      }
      showCustomToast({
        type: 'success',
        title: MS.uploadC88SuccessTitle,
        message: MS.uploadC88SuccessMessage,
      })
      onClose()
    } catch {
      setUploadError(MS.uploadC88Failed)
      showCustomToast({
        type: 'error',
        title: MS.error,
        message: MS.uploadC88Failed,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm">
      <div className="flex w-full items-center justify-center p-3">
        <div className="h-full w-[90%] sm:w-4/5 md:w-3/5 lg:w-2/4 xl:w-2/5 2xl:w-[30%]">
          <div className="no-scrollbar mx-auto h-full max-w-2xl rounded-lg bg-bgColor p-2 shadow-md sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-md text-nowrap font-bold text-black md:text-xl">
                {hasExistingDoc ? MS.editC88Document : MS.uploadC88Document}
              </h1>
              <button type="button" disabled={isLoading} onClick={onClose} aria-label={MS.close}>
                <span className="icon-close text-large text-black" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-xs font-normal text-black sm:text-sm">
                {hasExistingDoc ? MS.editC88DocumentDesc : MS.uploadC88DocumentDesc}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="mb-6">
                <label
                  className="mb-2 flex flex-row items-center gap-1 text-xs font-semibold text-black sm:text-sm"
                  htmlFor={inputId}
                >
                  {MS.uploadC88Document}
                  <span className="text-sm font-semibold text-yellow">*</span>
                  <Tooltip
                    content={MS.c88DocTooltipContent}
                    heading={MS.c88DocTooltipHeading}
                    position="bottom"
                    width="w-80"
                  >
                    <div className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow p-1 shadow-[inset_0_0_3px_1px_rgba(0,0,0,0.15)] sm:ml-4">
                      <span className="icon-confirmation text-xxxtiny text-white" />
                    </div>
                  </Tooltip>
                </label>
                <div id="upload-purchase-order" className="max-w-fit">
                  <input
                    id={inputId}
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={isLoading}
                    className="block w-full max-w-md cursor-pointer text-sm text-black file:mr-3 file:rounded-md file:border-0 file:bg-yellow file:px-3 file:py-2 file:text-sm file:font-light file:text-white"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      setFile(f ?? null)
                      setUploadError(null)
                    }}
                  />
                </div>
                {file ? <p className="mt-2 text-xs font-light text-black">{file.name}</p> : null}
                {uploadError ? <p className="mt-1 text-sm text-redOne">{uploadError}</p> : null}
              </div>
            </div>
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-lg bg-yellow px-4 py-2 !font-light text-white disabled:bg-disableColor disabled:opacity-70"
                disabled={!file || isLoading}
              >
                {!hasExistingDoc &&
                  (isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="flex h-6 w-6 animate-spin items-center justify-center rounded-full border-4 border-white border-t-black" />
                    </div>
                  ) : (
                    MS.uploadFile
                  ))}
                {hasExistingDoc &&
                  (isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="flex h-6 w-6 animate-spin items-center justify-center rounded-full border-4 border-white border-t-black" />
                    </div>
                  ) : (
                    MS.updateFile
                  ))}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
