import { useNavigate } from 'react-router-dom'

import type { UserRecentShipment } from '@/data/mock/manage-users'
import { MU } from '@/lib/manage-users-copy'
import {
  getRefundStatusStyle,
  getRefundStatusText,
  getReportStatusStyle,
  getReportStatusText,
} from '@/lib/manage-users-table-helper'

import { SectionCollapseToggle } from './section-collapse-toggle'
import { StatusTag } from './status-tag'

export type UserRecentShipmentsCardProps = {
  userName: string
  shipments: UserRecentShipment[]
  open: boolean
  onToggle: () => void
}

/**
 * Figma column widths across the 1088px table: Username 199, Shipment Title 277,
 * Date 166, Report Status 169, Refund Status 199, Actions 78.
 */
const HEAD_CELL_CLASS = 'py-0 text-left text-xxsmall font-normal text-black'
const BODY_CELL_CLASS = 'py-0 text-xsmall font-normal text-black'

export function UserRecentShipmentsCard({
  userName,
  shipments,
  open,
  onToggle,
}: UserRecentShipmentsCardProps) {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col gap-5 rounded-lg bg-white p-5 shadow-[0px_4px_16px_0px_#4C67641A]">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-large font-semibold leading-[33px] text-backTwo">
          {MU.recentShipments}
        </h2>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => navigate('/shipments')}
            className="text-xsmall font-normal leading-5 text-blue underline underline-offset-2"
          >
            {MU.viewAll}
          </button>
          <SectionCollapseToggle open={open} onToggle={onToggle} controls="recent-shipments-body" />
        </div>
      </div>

      <div id="recent-shipments-body" hidden={!open}>
        {shipments.length > 0 ? (
          <div className="w-full overflow-hidden rounded-lg border border-bottomBorder">
            <div className="no-scrollbar w-full overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed rounded-lg bg-white">
                <thead className="bg-greyFour">
                  <tr className="h-[50px]">
                    <th className={`${HEAD_CELL_CLASS} w-[18.5%] pl-5 pr-3`}>{MU.username}</th>
                    <th className={`${HEAD_CELL_CLASS} w-[25.5%] pr-3`}>{MU.shipmentTitle}</th>
                    <th className={`${HEAD_CELL_CLASS} w-[15%] pr-3`}>{MU.date}</th>
                    <th className={`${HEAD_CELL_CLASS} w-[15.5%] pr-3`}>{MU.reportStatus}</th>
                    <th className={`${HEAD_CELL_CLASS} w-[18.5%] pr-3`}>{MU.refundStatus}</th>
                    <th className={`${HEAD_CELL_CLASS} w-[7%] pr-5 text-right`}>{MU.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="h-[63px] border-b border-bottomBorder transition hover:bg-[var(--hover-color)]"
                    >
                      <td className={`${BODY_CELL_CLASS} pl-5 pr-3 font-medium capitalize`}>
                        <span className="block truncate" title={userName}>
                          {userName}
                        </span>
                      </td>
                      <td className={`${BODY_CELL_CLASS} pr-3`}>
                        <span className="block truncate" title={shipment.shipmentTitle}>
                          {shipment.shipmentTitle}
                        </span>
                      </td>
                      <td className={`${BODY_CELL_CLASS} pr-3 font-medium`}>{shipment.date}</td>
                      <td className={`${BODY_CELL_CLASS} pr-3`}>
                        <StatusTag
                          className={getReportStatusStyle(shipment.reportStatus)}
                          label={getReportStatusText(shipment.reportStatus)}
                        />
                      </td>
                      <td className={`${BODY_CELL_CLASS} pr-3`}>
                        <StatusTag
                          className={getRefundStatusStyle(shipment.refundStatus)}
                          label={getRefundStatusText(shipment.refundStatus)}
                        />
                      </td>
                      <td className={`${BODY_CELL_CLASS} pr-5`}>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            aria-label={MU.viewShipment}
                            onClick={() => navigate(`/shipments/${shipment.id}`)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-greyNine bg-white transition hover:bg-greyFour"
                          >
                            <span aria-hidden className="icon-open-eye text-[12px] text-black" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-bottomBorder py-12">
            <p className="text-xsmall font-normal text-lightGreyThree">{MU.noRecentShipments}</p>
          </div>
        )}
      </div>
    </section>
  )
}
