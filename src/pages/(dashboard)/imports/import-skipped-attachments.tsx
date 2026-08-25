import { FileX2, Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { M365SkipReason, M365SkippedItem } from '@/types/recovery-m365-api'

import { truncate } from './format-utils'

/**
 * Two visually distinct kinds of skip:
 *  - `filtered`: a deliberate decision by the import funnel. Expected, not a problem.
 *  - `problem`:  something went wrong and the file may be recoverable on a re-run.
 * Keeping these apart stops a wall of grey rows hiding the ones worth acting on.
 */
const PROBLEM_REASONS: ReadonlySet<M365SkipReason> = new Set([
  'download_failed',
  'classification_error',
  'zero_byte',
])

/** Plain-English "what do I do about it", shown under the reason. */
const REASON_HINT: Readonly<Record<M365SkipReason, string>> = {
  unsupported_format: 'Only PDF, Excel and CSV files can be imported.',
  zero_byte: 'The file was empty, so there was nothing to read.',
  signature_asset: 'Looked like an email signature or logo rather than a document.',
  too_large: 'Files must be 25 MB or smaller.',
  download_failed: 'Microsoft 365 did not return the file. Re-running the import may fix this.',
  duplicate: 'An identical file has already been imported.',
  type_mismatch: 'The file contents did not match its extension.',
  not_shipment_document: 'No customs declaration or purchase order content was found.',
  classification_error: 'The file could not be opened or read.',
}

function ReasonBadge({ item }: { item: M365SkippedItem }) {
  const isProblem = PROBLEM_REASONS.has(item.reason)
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-md px-2 py-1 text-sm',
        isProblem ? 'bg-[#C628281A] text-[#C62828]' : 'bg-[#F5F5F5] text-[#4B4B4B]',
      )}
    >
      {item.reasonLabel}
    </span>
  )
}

/**
 * Lists the attachments an import discarded, and why.
 *
 * Metadata only by design — the files themselves were never stored, so there is
 * nothing to download or preview here.
 */
export function ImportSkippedAttachments({ skipped }: { skipped: M365SkippedItem[] }) {
  if (skipped.length === 0) {
    return null
  }

  const problemCount = skipped.filter((item) => PROBLEM_REASONS.has(item.reason)).length

  return (
    <div className="rounded-lg border border-bottomBorder p-4 shadow-[0px_4px_16px_0px_#4C67641A]">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <FileX2 className="size-4 shrink-0 text-blackFive" aria-hidden />
        <h3 className="text-[18px] font-semibold leading-tight text-black">
          Not imported ({skipped.length})
        </h3>
        {problemCount > 0 && (
          <span className="rounded-md bg-[#C628281A] px-2 py-0.5 text-xs text-[#C62828]">
            {problemCount} need{problemCount === 1 ? 's' : ''} attention
          </span>
        )}
      </div>

      <p className="mb-3 flex items-start gap-1.5 text-xs font-light leading-[150%] text-blackFive">
        <Info className="mt-[2px] size-3.5 shrink-0" aria-hidden />
        <span>
          These attachments were not saved — only their details are kept, so there is nothing to
          download.
        </span>
      </p>

      <div className="max-h-[320px] overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-bottomBorder">
              <th className="px-3 py-3 text-left text-base font-normal text-blackFive">
                Attachment
              </th>
              <th className="px-3 py-3 text-left text-base font-normal text-blackFive">Size</th>
              <th className="px-3 py-3 text-left text-base font-normal text-blackFive">Reason</th>
            </tr>
          </thead>
          <tbody>
            {skipped.map((item) => (
              <tr key={item.id} className="border-b border-bottomBorder align-top">
                <td className="px-3 py-3">
                  <p
                    className="max-w-[260px] truncate text-sm font-light text-black"
                    title={item.attachmentName}
                  >
                    {item.attachmentName}
                  </p>
                  {item.detail && (
                    <p className="mt-0.5 text-xs font-light text-blackFive" title={item.detail}>
                      {truncate(item.detail, 70)}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm font-light text-black">
                  {item.attachmentSizeFormatted}
                </td>
                <td className="px-3 py-3">
                  <ReasonBadge item={item} />
                  <p className="mt-1 max-w-[260px] text-xs font-light leading-[150%] text-blackFive">
                    {REASON_HINT[item.reason]}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
