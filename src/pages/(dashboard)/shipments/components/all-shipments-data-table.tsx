import { useNavigate } from 'react-router-dom'

import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import { Tooltip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/useI18n'
import { formatShipmentListDate, getCurrencySymbol } from '@/lib/format-shipment-list-date'
import { MS } from '@/lib/manage-shipments-copy'
import {
  getRefundStatusStyle,
  getRefundStatusText,
  getRefundStatusTooltipDesc,
  getShipmentStatusStyle,
  getShipmentStatusText,
  getShipmentStatusTooltipDesc,
  isShipmentListDisplayStatus,
  shouldShowRefundStatusBadge,
} from '@/lib/manage-shipments-table-helper'
import {
  canOpenSanctionModal,
  hasSanctionMatch,
  isSanctionIgnored,
  isSanctionStopped,
  needsSanctionDecision,
  resolveShipmentStatusForDisplay,
} from '@/lib/sanction-decision'
import type { SanctionShipmentSource } from '@/lib/sanction-modal-helper'

export type ManageShipmentsTableRow = SanctionShipmentSource & {
  _id: string
  shipmentTitle: string
  dateRaw?: string | null
  createdAtRaw?: string | null
  shipVia: string
  purchaseOrderNumber: string
  status: number
  refund_status?: number
  refunded_amount?: number
  c88DocumentUrl: string
  hasC88Document: boolean
  c88Filename?: string
  screeningStatus?: string
  sanctionsScreeningStatus?: string
  sanctionDecision?: string
  is_flagged?: boolean
  is_challenged?: boolean
}

const ActionColumnSlot = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex h-6 w-6 shrink-0 items-center justify-center">{children}</div>
)

export type AllShipmentsDataTableProps = {
  data: ManageShipmentsTableRow[]
  selectedUserIds: string[]
  onCheckChange: (id: string) => void
  onSanctionWarning?: (shipment: ManageShipmentsTableRow) => void
  uploadC88Document?: (id: string) => void
  timeZone?: string | null
  className?: string
  /** Show separate Upload Date / Shipment Date columns instead of a single Date column. */
  showDateSplit?: boolean
  /** Show the row-selection checkbox column. Defaults to true. */
  showCheckboxColumn?: boolean
}

export function AllShipmentsDataTable({
  data,
  selectedUserIds,
  onCheckChange,
  onSanctionWarning,
  uploadC88Document,
  timeZone,
  showDateSplit = true,
  showCheckboxColumn = true,
}: AllShipmentsDataTableProps) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const columnCount = (showCheckboxColumn ? 1 : 0) + (showDateSplit ? 2 : 1) + 5

  return (
    <div className="mx-auto w-full overflow-hidden rounded-lg border border-bottomBorder">
      <div className="no-scrollbar w-full overflow-x-auto">
        {/*
          A fixed min-width instead of viewport-breakpoint percentages: the old
          `w-[X%] ... ipadLarge:w-full` chain snapped to 100% width once the *viewport*
          crossed 1100px, but the sidebar + padding mean the actual table container is
          narrower than that — so between ~1024-1300px viewport width the table was
          forced into a container too small for its columns and squeezed instead of
          scrolling. A min-width lets the overflow-x-auto wrapper above scroll whenever
          the container (not the viewport) is too narrow, at any screen size.
        */}
        <table className="w-full min-w-[1100px] rounded-lg bg-white">
          <thead className="bg-greyFour text-black">
            <tr className="text-left text-sm font-medium">
              {showCheckboxColumn && <th className="p-3" />}
              <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">
                {MS.shipmentTitle}
              </th>
              {showDateSplit ? (
                <>
                  <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">
                    {MS.uploadDate}
                  </th>
                  <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">
                    {MS.shipmentDate}
                  </th>
                </>
              ) : (
                <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">
                  {MS.date}
                </th>
              )}
              <th className="p-3 text-left text-xs font-normal sm:text-sm">{MS.shipVia}</th>
              <th className="max-w-[150px] p-3 text-left text-xs font-normal sm:text-sm">
                {MS.PO}
              </th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">{MS.status}</th>
              <th className="p-3 text-right text-xs font-normal sm:text-sm">{MS.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((shipment, index) => {
                const displayStatus = resolveShipmentStatusForDisplay(
                  Number(shipment.status),
                  shipment.sanctionDecision as 'stopped' | 'ignored' | 'none' | undefined,
                )
                const showRefundBadge = shouldShowRefundStatusBadge(
                  shipment.refund_status,
                  displayStatus,
                )

                return (
                  <tr
                    key={shipment._id || String(index)}
                    className={`border-b border-bottomBorder transition hover:bg-[var(--hover-color)] ${
                      shipment?.is_flagged ? 'bg-lightRedOne' : ''
                    }`}
                  >
                    {showCheckboxColumn && (
                      <td className="p-3">
                        <CustomCheckboxShipment
                          onChange={() => onCheckChange(shipment._id)}
                          isChecked={selectedUserIds.includes(shipment._id)}
                        />
                      </td>
                    )}
                    <td className="max-w-24 truncate break-all p-3 text-xs font-medium capitalize text-black sm:max-w-36 sm:text-sm md:max-w-80 2xl:max-w-full">
                      <span title={shipment.shipmentTitle}>{shipment.shipmentTitle}</span>
                      {hasSanctionMatch(shipment) &&
                      isSanctionIgnored(shipment.sanctionDecision) ? (
                        <Tooltip
                          content={MS.sanctionIgnoredContent}
                          heading={MS.sanctionIgnoredHeading}
                          position="bottom"
                        >
                          <button type="button" onClick={() => onSanctionWarning?.(shipment)}>
                            <span className="icon-exclamation text-sm text-gray-600" />
                          </button>
                        </Tooltip>
                      ) : null}
                      {hasSanctionMatch(shipment) &&
                      isSanctionStopped(shipment.sanctionDecision) ? (
                        <Tooltip
                          content={MS.sanctionStoppedContent}
                          heading={MS.sanctionStoppedHeading}
                          position="bottom"
                        >
                          <button type="button" onClick={() => onSanctionWarning?.(shipment)}>
                            <span className="icon-alert-triangle text-sm text-redOne" />
                          </button>
                        </Tooltip>
                      ) : null}
                    </td>
                    {showDateSplit && (
                      <td className="break-all p-3 text-xs font-medium text-black sm:text-sm">
                        {formatShipmentListDate(shipment.createdAtRaw, timeZone)}
                      </td>
                    )}
                    <td className="break-all p-3 text-xs font-medium text-black sm:text-sm">
                      {formatShipmentListDate(shipment.dateRaw, timeZone)}
                    </td>
                    <td className="p-3 text-xs font-medium text-black sm:text-sm">
                      {shipment.shipVia || 'N/A'}
                    </td>
                    <td className="max-w-[150px] p-3 text-xs font-medium text-black sm:text-sm">
                      <div className="flex flex-row items-center gap-2">
                        <p className="min-w-0 max-w-[150px] truncate">
                          <span title={shipment.purchaseOrderNumber || undefined}>
                            {shipment.purchaseOrderNumber || 'N/A'}
                          </span>
                        </p>
                        {shipment.is_flagged ? (
                          <Tooltip
                            content={MS.flaggedContent}
                            heading={MS.flaggedHeading}
                            position="bottom"
                          >
                            <span
                              id="flagged-shipment-indicator"
                              className="icon-flag text-redOne"
                            />
                          </Tooltip>
                        ) : null}
                        {shipment.is_challenged ? (
                          <Tooltip
                            content={MS.challengedContent}
                            heading={MS.challengedHeading}
                            position="bottom"
                          >
                            <span
                              id="flagged-shipment-indicator"
                              className="icon-alert-triangle-2 text-yellow"
                            />
                          </Tooltip>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 text-xs font-medium text-black sm:text-sm">
                      <span
                        id="shipment-status"
                        className={`flex w-fit items-center gap-2 rounded-md px-3 py-1 text-xs font-medium capitalize sm:text-sm ${
                          showRefundBadge && shipment.refund_status !== undefined
                            ? getRefundStatusStyle(shipment.refund_status)
                            : isShipmentListDisplayStatus(displayStatus)
                              ? getShipmentStatusStyle(displayStatus)
                              : getShipmentStatusStyle(3)
                        }`}
                      >
                        <span className="h-1.5 min-w-1.5 rounded-full bg-current" />
                        {showRefundBadge && shipment.refund_status !== undefined
                          ? getRefundStatusText(shipment.refund_status, true)
                          : isShipmentListDisplayStatus(displayStatus)
                            ? getShipmentStatusText(displayStatus)
                            : getShipmentStatusText(3)}
                        <Tooltip
                          heading={MS.statusInfo}
                          position="left"
                          width="w-80"
                          customContent={
                            <div className="text-xs font-normal text-black">
                              {showRefundBadge && shipment.refund_status !== undefined
                                ? getRefundStatusTooltipDesc(shipment.refund_status)
                                : shipment.refund_status === 4
                                  ? `Refund processed and completed. Refunded amount is ${getCurrencySymbol(MS.GBP)}${shipment.refunded_amount ?? 0}`
                                  : isShipmentListDisplayStatus(displayStatus)
                                    ? getShipmentStatusTooltipDesc(displayStatus)
                                    : getShipmentStatusTooltipDesc(3)}
                            </div>
                          }
                        >
                          <div className="flex h-4 min-w-4 items-center justify-center rounded-full bg-current p-1 shadow-[inset_0_0_3px_1px_rgba(0,0,0,0.15)]">
                            <span className="icon-confirmation text-xxxtiny text-white" />
                          </div>
                        </Tooltip>
                      </span>
                    </td>
                    <td className="flex flex-nowrap items-center justify-end gap-[5px] p-3 text-sm font-medium text-black">
                      <ActionColumnSlot>
                        <button
                          type="button"
                          id="view-shipment-details"
                          onClick={() => navigate(`/shipments/${shipment._id}`)}
                          disabled={needsSanctionDecision(shipment)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-bottomBorder bg-white transition disabled:opacity-50"
                        >
                          <span className="icon-open-eye text-[12px] text-black transition group-hover:text-yellow" />
                        </button>
                      </ActionColumnSlot>

                      <ActionColumnSlot>
                        <button
                          type="button"
                          onClick={() => uploadC88Document?.(shipment._id)}
                          disabled={
                            shipment.hasC88Document ||
                            [1, 6, 7].includes(shipment.status) ||
                            needsSanctionDecision(shipment)
                          }
                          id={shipment.hasC88Document ? 'edit-c88-document' : 'upload-c88-document'}
                          className={`group flex h-6 w-6 items-center justify-center rounded-full border border-bottomBorder transition disabled:bg-disableColor ${
                            shipment.hasC88Document
                              ? 'bg-green hover:bg-green'
                              : 'bg-yellow hover:bg-yellow'
                          }`}
                        >
                          <span className="icon-upload-cloud text-[12px] text-white" />
                        </button>
                      </ActionColumnSlot>

                      {onSanctionWarning ? (
                        <ActionColumnSlot>
                          {canOpenSanctionModal(shipment) ? (
                            <button
                              type="button"
                              id={
                                isSanctionStopped(shipment.sanctionDecision)
                                  ? 'sanction-stopped-warning'
                                  : 'sanction-match-warning'
                              }
                              aria-label={t('shipments.table.viewSanctionAlert')}
                              onClick={() => onSanctionWarning(shipment)}
                              className="group flex h-6 w-6 items-center justify-center rounded-full border border-redOne bg-lightRed transition hover:border-redOne hover:bg-redOne"
                            >
                              <span className="icon-alert-triangle text-[12px] text-redOne transition group-hover:text-white" />
                            </button>
                          ) : null}
                        </ActionColumnSlot>
                      ) : null}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr className="h-[40svh]">
                <td colSpan={columnCount} className="p-4 text-center text-black">
                  {MS.noshipmentsAvailable}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
