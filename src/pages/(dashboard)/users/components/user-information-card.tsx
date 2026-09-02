import { MU } from '@/lib/manage-users-copy'

import { SectionCollapseToggle } from './section-collapse-toggle'

const DEFAULT_AVATAR = `${process.env.PUBLIC_URL}/images/no-profile.png`

export type UserInformationCardUser = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  location?: string
  profilePic: string
}

export type UserInformationCardProps = {
  user: UserInformationCardUser
  open: boolean
  onToggle: () => void
}

/**
 * Figma pairs each label column with its value column at a fixed gap (30px on
 * the left group, 20px on the right) rather than using a shared grid.
 */
function DetailPair({ gap, rows }: { gap: string; rows: [string, string][] }) {
  return (
    <div className={`flex items-start ${gap}`}>
      <div className="flex flex-col gap-[10px] text-darkColor">
        {rows.map(([label]) => (
          <p key={label} className="whitespace-nowrap">
            {label}
          </p>
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-[10px] text-black">
        {rows.map(([label, value]) => (
          <p key={label} className="break-words">
            {value || MU.notAvailable}
          </p>
        ))}
      </div>
    </div>
  )
}

export function UserInformationCard({ user, open, onToggle }: UserInformationCardProps) {
  return (
    <section className="flex flex-col gap-[10px] rounded-lg bg-white p-5 shadow-[0px_4px_16px_0px_#4C67641A]">
      <div className="flex w-full items-start justify-between">
        <img
          key={user.profilePic || DEFAULT_AVATAR}
          src={user.profilePic?.trim() || DEFAULT_AVATAR}
          alt=""
          width={60}
          height={60}
          className="h-[60px] w-[60px] rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_AVATAR
          }}
        />
        <SectionCollapseToggle open={open} onToggle={onToggle} controls="user-information-body" />
      </div>

      <h2 className="text-large font-semibold leading-[33px] text-backTwo">{MU.userInformation}</h2>

      {/* The wrapper stays in the tree (so `aria-controls` always resolves) but
          carries no display utility — otherwise `flex` would beat `[hidden]`. */}
      <div id="user-information-body" hidden={!open}>
        <div className="flex flex-col gap-[10px] text-xsmall font-medium lg:flex-row lg:gap-0">
          <div className="lg:w-1/2">
            <DetailPair
              gap="gap-[30px]"
              rows={[
                [MU.fullName, `${user.firstName} ${user.lastName}`],
                [MU.phoneNumber, user.phone ?? ''],
              ]}
            />
          </div>
          <div className="lg:w-1/2">
            <DetailPair
              gap="gap-[20px]"
              rows={[
                [MU.emailAddress, user.email],
                [MU.location, user.location ?? ''],
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
