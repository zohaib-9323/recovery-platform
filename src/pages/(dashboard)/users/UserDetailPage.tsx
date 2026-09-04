import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useGetCompanyUserDetailQuery } from '@/app/services/recoveryCompanyUsersApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { MU } from '@/lib/manage-users-copy'
import { getUserStatusStyle } from '@/lib/manage-users-table-helper'

import { StatusTag } from './components/status-tag'
import { UserInformationCard } from './components/user-information-card'
import { UserRecentShipmentsCard } from './components/user-recent-shipments-card'

export function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isFetching } = useGetCompanyUserDetailQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  })
  const user = data?.content?.user

  const [openSections, setOpenSections] = useState({ userInfo: true, recentShipments: true })

  const toggle = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 bg-white p-3 sm:p-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex items-start gap-[10px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={MU.back}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-bottomBorder bg-white"
          >
            <span aria-hidden className="icon-arrow-left text-h5 text-black" />
          </button>
          <p className="text-large font-semibold leading-[33px] text-backTwo">
            {MU.userIdPrefix}
            {id}
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-[10px]">
            <StatusTag className={getUserStatusStyle(user.status)} label={user.status} />
          </div>
        ) : null}
      </div>

      {isFetching ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <CustomLoader />
        </div>
      ) : user ? (
        <>
          <UserInformationCard
            user={user}
            open={openSections.userInfo}
            onToggle={() => toggle('userInfo')}
          />
          <UserRecentShipmentsCard
            userName={`${user.firstName} ${user.lastName}`}
            shipments={[]}
            open={openSections.recentShipments}
            onToggle={() => toggle('recentShipments')}
          />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4">
          <img src="/images/emptybox.svg" alt="" width={200} height={200} />
          <p className="text-center text-lg font-light text-black">{MU.userNotFound}</p>
        </div>
      )}
    </div>
  )
}
