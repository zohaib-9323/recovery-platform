import { useNavigate } from 'react-router-dom'

import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import { Tooltip } from '@/components/ui/tooltip'
import { formatShipmentListDate } from '@/lib/format-shipment-list-date'
import { MS } from '@/lib/manage-shipments-copy'
import {
  getShipmentStatusStyle,
  getShipmentStatusText,
  getShipmentStatusTooltipDesc,
} from '@/lib/manage-shipments-table-helper'

export type ManageShipmentsTableRow = {
  _id: string
  shipmentTitle: string
  dateRaw?: string | null
  shipVia: string
  purchaseOrderNumber: string
  status: number
  refund_status?: number
  refunded_amount?: number
  c88DocumentUrl: string
  /** True when list API indicates a C88 exists (URL, S3 key, filename, or items). */
  hasC88Document: boolean
  c88Filename?: string
  screeningStatus?: string
  sanctionsScreeningStatus?: string
  sanctionDecision?: string
  is_flagged?: boolean
  is_challenged?: boolean
}

export type AllShipmentsDataTableProps = {
  data: ManageShipmentsTableRow[]
  selectedUserIds: string[]
  onCheckChange: (id: string) => void
  onSanctionWarning?: (shipment: ManageShipmentsTableRow) => void
  timeZone?: string | null
  className?: string
}

export function AllShipmentsDataTable({
  data,
  selectedUserIds,
  onCheckChange,
  onSanctionWarning,
  timeZone,
}: AllShipmentsDataTableProps) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full overflow-hidden rounded-lg border border-bottomBorder">
      <div className="no-scrollbar w-full overflow-x-auto">
        <table className="w-[350%] rounded-lg bg-white sm:w-[250%] md:w-[200%] lg:w-[150%] ipadLarge:w-full">
          <thead className="bg-greyFour text-black">
            <tr className="text-left text-sm font-medium">
              <th className="p-3" />
              <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">
                {MS.shipmentTitle}
              </th>
              <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">{MS.date}</th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">{MS.shipVia}</th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">{MS.PO}</th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">{MS.status}</th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">{MS.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((shipment, index) => (
                <tr
                  key={shipment._id || String(index)}
                  className={`border-b border-bottomBorder transition hover:bg-[var(--hover-color)] ${
                    shipment?.is_flagged ? 'bg-lightRedOne' : ''
                  }`}
                >
                  <td className="p-3">
                    <CustomCheckboxShipment
                      onChange={() => onCheckChange(shipment._id)}
                      isChecked={selectedUserIds.includes(shipment._id)}
                    />
                  </td>
                  <td className="max-w-24 truncate break-all p-3 text-xs font-medium capitalize text-black sm:max-w-36 sm:text-sm md:max-w-80 2xl:max-w-full">
                    <span title={shipment.shipmentTitle}>{shipment.shipmentTitle}</span>
                    {(shipment.screeningStatus === 'match_found' ||
                      shipment.sanctionsScreeningStatus === 'match_found') &&
                      shipment.sanctionDecision === 'ignored' && (
                        <Tooltip
                          content={MS.sanctionIgnoredContent}
                          heading={MS.sanctionIgnoredHeading}
                          position="bottom"
                        >
                          <button
                            type="button"
                            className=""
                            onClick={() => onSanctionWarning?.(shipment)}
                          >
                            <span className="icon-exclamation text-sm text-gray-600" />
                          </button>
                        </Tooltip>
                      )}
                  </td>
                  <td className="break-all p-3 text-xs font-medium text-black sm:text-sm">
                    {formatShipmentListDate(shipment.dateRaw, timeZone)}
                  </td>
                  <td className="p-3 text-xs font-medium text-black sm:text-sm">
                    {shipment.shipVia}
                  </td>
                  <td className="p-3 text-xs font-medium text-black sm:text-sm">
                    <div className="flex flex-row items-center gap-2">
                      <p>
                        <span title={shipment.purchaseOrderNumber}>
                          {shipment.purchaseOrderNumber}
                        </span>
                      </p>
                      {shipment.is_flagged ? (
                        <Tooltip
                          content={MS.flaggedContent}
                          heading={MS.flaggedHeading}
                          position="bottom"
                        >
                          <span id="flagged-shipment-indicator" className="icon-flag text-redOne" />
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
                        [1, 2, 3, 5, 6, 7, 9].includes(shipment.status)
                          ? getShipmentStatusStyle(shipment.status)
                          : getShipmentStatusStyle(3)
                      }`}
                    >
                      <span className="h-1.5 min-w-1.5 rounded-full bg-current" />
                      {[1, 2, 3, 5, 6, 7, 9].includes(shipment.status)
                        ? getShipmentStatusText(shipment.status)
                        : getShipmentStatusText(3)}
                      <Tooltip
                        heading={MS.statusInfo}
                        position="left"
                        width="w-80"
                        customContent={
                          <div className="text-xs font-normal text-black">
                            {[1, 2, 3, 5, 6, 7, 9].includes(shipment.status)
                              ? getShipmentStatusTooltipDesc(shipment.status)
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
                  <td className="flex gap-2 p-3 text-sm font-medium text-black">
                    {(shipment.screeningStatus === 'match_found' ||
                      shipment.sanctionsScreeningStatus === 'match_found') &&
                      (!shipment.sanctionDecision || shipment.sanctionDecision === 'none') && (
                        <button
                          type="button"
                          id="view-shipment-details"
                          onClick={() => onSanctionWarning?.(shipment)}
                          className="h-7 min-w-7 rounded-full border border-redOne bg-lightRed transition hover:bg-redOne hover:text-white"
                        >
                          <span className="icon-alert-triangle text-xsmall text-redOne hover:text-white" />
                        </button>
                      )}

                    <button
                      type="button"
                      id="view-shipment-details"
                      onClick={() => {
                        navigate(`/shipments/${shipment._id}`)
                      }}
                      disabled={
                        (shipment.screeningStatus === 'match_found' ||
                          shipment.sanctionsScreeningStatus === 'match_found') &&
                        (!shipment.sanctionDecision || shipment.sanctionDecision === 'none')
                      }
                      className="h-7 min-w-7 rounded-full border border-bottomBorder bg-white transition disabled:opacity-50"
                    >
                      <span className="icon-open-eye text-xsmall text-black" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="h-[40svh]">
                <td colSpan={7} className="p-4 text-center text-black">
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
