import type { M365SkipReason, M365SkippedItem } from '@/types/recovery-m365-api'

import { truncate } from './format-utils'

/**
 * The only skip reason this section reports.
 *
 * An import discards attachments for many reasons — unsupported format, empty
 * file, a failed download — but a duplicate is the only one that is *about the
 * document*: the file is fine and is already in the system, so seeing it here
 * answers "where did my document go?". The rest are noise on this screen, and
 * mixing them in buried the answer in a wall of grey rows.
 *
 * Consequence worth knowing: attachments skipped for any other reason are no
 * longer surfaced anywhere in the UI. They are still recorded server-side
 * (`ImportSkippedItem`), so restoring them is a rendering change, not a data one.
 */
const REPORTED_REASON: M365SkipReason = 'duplicate'

const headerCell = 'px-4 py-3 text-left text-[15px] font-normal text-blackFive'

/**
 * How many of an email's skipped attachments this section will actually show.
 *
 * Exported so callers count the same thing the panel renders: a sidebar badge
 * reading "3 skipped" that opens onto one row — or onto nothing at all — is
 * worse than no badge.
 */
export function countReportedSkips(skipped: M365SkippedItem[] | undefined): number {
  return (skipped ?? []).filter((item) => item.reason === REPORTED_REASON).length
}

/**
 * Lists the attachments an import already had, and says so.
 *
 * Metadata only by design — these files were never stored a second time, so
 * there is nothing to download or preview here.
 */
export function ImportSkippedAttachments({ skipped }: { skipped: M365SkippedItem[] }) {
  const alreadyImported = skipped.filter((item) => item.reason === REPORTED_REASON)
  if (alreadyImported.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-bottomBorder p-4 shadow-[0px_4px_16px_0px_#4C67641A]">
      <h3 className="text-[18px] font-semibold leading-tight text-black">
        Not imported ({alreadyImported.length})
      </h3>
      <p className="mb-3 mt-1 text-sm font-light leading-[150%] text-blackFive">
        These attachments were not saved — only their details are kept, so there is nothing to
        download.
      </p>

      <div className="overflow-hidden rounded-lg border border-bottomBorder">
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-[#F8F8F8]">
              <tr>
                <th className={headerCell}>Attachment</th>
                <th className={headerCell}>Size</th>
                <th className={headerCell}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {alreadyImported.map((item) => (
                <tr key={item.id} className="border-t border-bottomBorder align-top">
                  <td className="px-4 py-4">
                    <p
                      className="max-w-[260px] truncate text-[15px] font-normal text-black"
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
                  <td className="whitespace-nowrap px-4 py-4 text-[15px] font-normal text-black">
                    {item.attachmentSizeFormatted}
                  </td>
                  <td className="px-4 py-4">
                    {/* Green, not grey: this is a benign, expected outcome — the
                        document is already in the system, nothing was lost. */}
                    <span className="inline-block whitespace-nowrap rounded-md bg-[#2e7d32]/10 px-2 py-1 text-xs text-rp-green">
                      {item.reasonLabel}
                    </span>
                    <p className="mt-1.5 max-w-[280px] text-sm font-light leading-[150%] text-blackFive">
                      An identical file has already been imported.
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
