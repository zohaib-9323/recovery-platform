import { useState } from 'react'
import { Download, Folder, Loader2, Mail } from 'lucide-react'

import { useDownloadM365ImportItemMutation } from '@/app/services/recoveryM365Api'
import { cn } from '@/lib/utils'
import type { M365DocumentItem, M365EmailGroup } from '@/types/recovery-m365-api'

import { formatReceived, truncate } from './format-utils'
import { countReportedSkips, ImportSkippedAttachments } from './import-skipped-attachments'
import { documentTypeLabel } from '@/pages/(dashboard)/inbox/inbox-mappers'

// ── Constants ──────────────────────────────────────────────────────────────────

const ITEM_STATUS_STYLE: Record<M365DocumentItem['status'], { label: string; className: string }> =
  {
    fetched: { label: 'Passed', className: 'bg-[#2e7d32]/10 text-rp-green' },
    duplicate: { label: 'Duplicate', className: 'bg-[#F5F5F5] text-[#4B4B4B]' },
    failed: { label: 'Failed', className: 'bg-[#C628281A] text-[#C62828]' },
  }

/**
 * An unreadable scan that was imported anyway rather than discarded — losing a
 * scanned C88 costs a real refund, so it is kept and flagged for a human look.
 */
const UNVERIFIED_STYLE = { label: 'Needs review', className: 'bg-[#E3A6021A] text-[#8A6100]' }

const EMAILS_PER_PAGE = 10

const importedHeaderCell = 'px-4 py-3 text-left text-[15px] font-normal text-blackFive'

// ── Download action button (Action column) ─────────────────────────────────────

function DownloadActionButton({ jobId, item }: { jobId: string; item: M365DocumentItem }) {
  const [downloadItem, { isLoading }] = useDownloadM365ImportItemMutation()
  const [failed, setFailed] = useState(false)
  const canDownload = Boolean(item.graphAttachmentId || item.s3Key)

  async function handleDownload() {
    setFailed(false)
    try {
      const blob = await downloadItem({ jobId, itemId: item.id }).unwrap()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.attachmentName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setFailed(true)
    }
  }

  if (!canDownload) return null

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isLoading}
      title={failed ? 'Download failed — try again' : `Download ${item.attachmentName}`}
      className={cn(
        'flex items-center gap-2 rounded-md border border-bottomBorder px-3 py-2 text-[15px] text-black transition-colors hover:bg-gray-50 disabled:opacity-50',
        failed && 'border-red-300 text-red-600',
      )}
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      {failed ? 'Failed' : 'Download'}
    </button>
  )
}

// ── Email list item (sidebar) ──────────────────────────────────────────────────

function ImportEmailListItem({
  group,
  active,
  onSelect,
}: {
  group: M365EmailGroup
  active: boolean
  onSelect: () => void
}) {
  const skippedCount = countReportedSkips(group.skipped)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-colors',
        active
          ? 'border-yellow bg-lightYellowThree shadow-[0_0_0_1px_rgba(227,166,2,0.25)]'
          : 'border-bottomBorder bg-white hover:bg-gray-50',
      )}
    >
      <p className="truncate text-sm font-medium text-black" title={senderTitle(group)}>
        {group.fromName || group.fromEmail}
      </p>
      <p
        className="mt-1 line-clamp-2 text-sm font-light leading-[140%] text-blackFive"
        title={group.subject}
      >
        {group.subject}
      </p>
      {/* Two stacked rows: the sidebar is only ~300px wide, so the received date and the
          attachment counts overlap when they share a single row. */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="shrink-0 text-xs font-light text-blackFive">
          {formatReceived(group.receivedDateTime)}
        </span>
        <FolderChips folderNames={group.folderNames} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-bottomBorder px-2 py-0.5 text-xs font-normal text-blackFive">
          <Mail className="size-3 shrink-0" aria-hidden />
          {group.documents.length} {group.documents.length === 1 ? 'File' : 'Files'}
        </span>
        {skippedCount > 0 && (
          <span
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-[#F5F5F5] px-2 py-0.5 text-xs font-normal text-[#4B4B4B]"
            title={`${skippedCount} attachment${skippedCount === 1 ? ' was' : 's were'} already imported`}
          >
            {skippedCount} already imported
          </span>
        )}
      </div>
    </button>
  )
}

/** Name and address together, so hovering always reveals the real address. */
function senderTitle(group: M365EmailGroup): string {
  return group.fromName ? `${group.fromName} <${group.fromEmail}>` : group.fromEmail
}

/**
 * Which mailbox folder the email came from. Renders nothing for emails
 * imported before folder attribution existed, so old jobs stay clean.
 */
function FolderChips({ folderNames }: { folderNames: string[] }) {
  if (folderNames.length === 0) return null
  return (
    <>
      {folderNames.map((name) => (
        <span
          key={name}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-[#F0F4F8] px-1.5 py-0.5 text-[11px] font-normal text-[#4B5F72]"
          title={`Found in ${name}`}
        >
          <Folder className="size-2.5 shrink-0" aria-hidden />
          {name}
        </span>
      ))}
    </>
  )
}

// ── Documents detail panel (right) ────────────────────────────────────────────

function ImportDocumentsPanel({ jobId, group }: { jobId: string; group: M365EmailGroup }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6">
      {/* Email header */}
      <header className="shrink-0 rounded-lg border border-bottomBorder px-3 py-3">
        <h1
          className="truncate text-[18px] font-semibold leading-tight text-black"
          title={group.subject}
        >
          {group.subject}
        </h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-light text-blackFive">
          <span>
            <span className="font-medium text-black">From</span>{' '}
            {group.fromName ? `${group.fromName} (${group.fromEmail})` : group.fromEmail}
          </span>
          <span>
            <span className="font-medium text-black">Received</span>{' '}
            {formatReceived(group.receivedDateTime)}
          </span>
          {group.folderNames.length > 0 && (
            <span>
              <span className="font-medium text-black">
                {group.folderNames.length === 1 ? 'Folder' : 'Folders'}
              </span>{' '}
              {group.folderNames.join(', ')}
            </span>
          )}
        </div>
      </header>

      {/* Imported attachments — the whole card is hidden when this email imported nothing */}
      {group.documents.length > 0 && (
        <div className="rounded-lg border border-bottomBorder p-4 shadow-[0px_4px_16px_0px_#4C67641A]">
          <h3 className="mb-3 text-[18px] font-semibold leading-tight text-black">
            Imported ({group.documents.length})
          </h3>
          <div className="overflow-hidden rounded-lg border border-bottomBorder">
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-[#F8F8F8]">
                  <tr>
                    <th className={importedHeaderCell}>Attachment</th>
                    <th className={importedHeaderCell}>Size</th>
                    <th className={importedHeaderCell}>Status</th>
                    <th className={cn(importedHeaderCell, 'text-right')}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.documents.map((item) => {
                    const s = item.unverified ? UNVERIFIED_STYLE : ITEM_STATUS_STYLE[item.status]
                    const isFailed = item.status === 'failed'
                    return (
                      <tr
                        key={item.id}
                        className={cn('border-t border-bottomBorder', isFailed && 'bg-red-50/40')}
                      >
                        <td className="px-4 py-4">
                          <p
                            className="max-w-[240px] truncate text-[15px] font-normal text-black"
                            title={item.attachmentName}
                          >
                            {item.attachmentName}
                          </p>
                          {isFailed && item.failureDetail && (
                            <p className="mt-0.5 text-xs text-red-600" title={item.failureDetail}>
                              {truncate(item.failureDetail, 60)}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-[15px] font-normal text-black">
                          {item.attachmentSizeFormatted}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm',
                              s.className,
                            )}
                          >
                            <span aria-hidden>&bull;</span>
                            {item.unverified
                              ? 'Needs review'
                              : documentTypeLabel(item.classifiedType) || s.label}
                          </span>
                          {item.unverified && (
                            <p className="mt-1 max-w-[200px] text-xs font-light leading-[150%] text-blackFive">
                              Imported without checking its contents — the file could not be read.
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            {isFailed ? (
                              <span className="text-xs text-red-500">—</span>
                            ) : (
                              <DownloadActionButton jobId={jobId} item={item} />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attachments the funnel discarded, with reasons (metadata only). Renders
          nothing when there is nothing to skip. */}
      <ImportSkippedAttachments skipped={group.skipped ?? []} />

      {/* Neither card applies: say so rather than leaving the panel blank. */}
      {group.documents.length === 0 && countReportedSkips(group.skipped) === 0 && (
        <p className="rounded-lg border border-bottomBorder px-3 py-4 text-sm font-light text-blackFive">
          No shipment-related attachments were found in this email.
        </p>
      )}
    </section>
  )
}

// ── 2-panel email + documents browser ─────────────────────────────────────────

export function ImportDocumentsBrowser({
  jobId,
  groups,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: {
  jobId: string
  groups: M365EmailGroup[]
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}) {
  const totalEmailPages = Math.max(1, Math.ceil(groups.length / EMAILS_PER_PAGE))

  const [emailPage, setEmailPage] = useState(0)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    () => groups[0]?.messageId ?? null,
  )

  const currentPage = Math.min(emailPage, totalEmailPages - 1)
  const visibleGroups = groups.slice(
    currentPage * EMAILS_PER_PAGE,
    (currentPage + 1) * EMAILS_PER_PAGE,
  )

  const selectedGroup = groups.find((g) => g.messageId === selectedMessageId) ?? null
  const isLastPage = currentPage >= totalEmailPages - 1

  // When a page is advanced into (either navigating or after load-more brings new
  // groups), auto-select the first email on that page if the current selection
  // is no longer visible. Adjusting state during render (guarded by comparing
  // against the previous page/group-length) avoids the extra render + cascading
  // updates a useEffect would cause here.
  const [prevPage, setPrevPage] = useState(currentPage)
  const [prevGroupLen, setPrevGroupLen] = useState(groups.length)
  if (currentPage !== prevPage || groups.length !== prevGroupLen) {
    setPrevPage(currentPage)
    setPrevGroupLen(groups.length)
    if (visibleGroups.length > 0 && !visibleGroups.some((g) => g.messageId === selectedMessageId)) {
      setSelectedMessageId(visibleGroups[0].messageId)
    }
  }

  function goToPage(page: number) {
    setEmailPage(Math.max(0, Math.min(page, totalEmailPages - 1)))
  }

  function handleNext() {
    if (!isLastPage) {
      // Navigate within already-loaded pages
      goToPage(currentPage + 1)
    } else if (hasMore) {
      // Advance the page index immediately so the sidebar shows a spinner slot;
      // the new emails will fill in once the API response arrives.
      setEmailPage(currentPage + 1)
      onLoadMore?.()
    }
  }

  return (
    <div className="flex min-h-[420px] overflow-hidden rounded-lg border border-bottomBorder bg-white lg:flex-row">
      {/* Left sidebar — email list */}
      <aside className="flex max-h-[50vh] w-full flex-col border-b border-bottomBorder lg:max-h-none lg:w-[min(100%,300px)] lg:shrink-0 lg:border-b-0 lg:border-r lg:border-r-bottomBorder">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-bottomBorder px-4 py-3">
          <h2 className="text-sm font-semibold text-black">Emails</h2>
          <span className="text-sm font-light text-blackFive">
            {groups.length}
            {hasMore ? '+' : ''} {groups.length === 1 ? 'email' : 'emails'}
          </span>
        </div>

        {/* Email list */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          {visibleGroups.length > 0 ? (
            visibleGroups.map((group) => (
              <ImportEmailListItem
                key={group.messageId}
                group={group}
                active={selectedMessageId === group.messageId}
                onSelect={() => setSelectedMessageId(group.messageId)}
              />
            ))
          ) : isLoadingMore ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-blackFive" aria-hidden />
            </div>
          ) : null}
        </div>

        {/* Sidebar pagination footer */}
        {(totalEmailPages > 1 || hasMore) && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-bottomBorder px-4 py-2.5">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => goToPage(currentPage - 1)}
              className="rounded px-2 py-1 text-sm text-black transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
            >
              ← Prev
            </button>

            <span className="text-xs font-light text-blackFive">
              {currentPage + 1} / {totalEmailPages}
              {hasMore ? '+' : ''}
            </span>

            <button
              type="button"
              disabled={isLastPage && !hasMore}
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm text-black transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
            >
              {isLoadingMore && isLastPage ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              Next →
            </button>
          </div>
        )}
      </aside>

      {/* Right panel — document detail */}
      {selectedGroup ? (
        <ImportDocumentsPanel jobId={jobId} group={selectedGroup} />
      ) : !isLoadingMore ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm font-light text-blackFive">
            Select an email to view its documents.
          </p>
        </div>
      ) : null}
    </div>
  )
}
