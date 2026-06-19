import type { RecoveryShipmentParty } from '@/types/recovery-shipments-api'

type DetailLabels = {
  companyName: string
  address1: string
  address2: string
  country: string
  city: string
  phoneNumber: string
  fax: string
  website: string
  industryType: string
  postalCode: string
}

export function DetailsGridCard({
  title,
  party,
  labels,
  gridColsLimit = true,
  padding,
  className = '',
}: {
  title: string
  party?: RecoveryShipmentParty
  labels: DetailLabels
  gridColsLimit?: boolean
  padding?: string
  className?: string
}) {
  const website = party?.companyWebsite || party?.website || 'N/A'
  const entries = [
    [labels.companyName, party?.companyName || 'N/A'],
    [labels.address1, party?.address1 || 'N/A'],
    [labels.address2, party?.address2 || 'N/A'],
    [labels.country, party?.country || 'N/A'],
    [labels.city, party?.city || 'N/A'],
    [labels.phoneNumber, party?.phoneNumber || 'N/A'],
    [labels.fax, party?.fax || 'N/A'],
    [labels.website, website],
    [labels.industryType, party?.industryType || 'N/A'],
    [labels.postalCode, party?.postalCode || 'N/A'],
  ]

  return (
    <div
      className={`${padding || 'p-4 sm:p-5'} ${
        gridColsLimit ? 'border border-bottomBorder shadow-[4px_2px_8px_0px_#00000024]' : ''
      } w-full overflow-hidden rounded-lg bg-white ${className}`}
    >
      <p className="mb-4 truncate break-all text-base font-semibold text-black sm:text-lg">
        {title}
      </p>
      <div
        className={`grid grid-cols-1 gap-x-8 gap-y-3 ${gridColsLimit ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}
      >
        {entries.map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-start gap-2 text-xs sm:text-sm">
            <span className="w-24 shrink-0 font-semibold text-[#7F7F7F] sm:w-28">{label}</span>
            <span
              className="min-w-0 flex-1 truncate font-semibold text-black"
              title={String(value)}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
