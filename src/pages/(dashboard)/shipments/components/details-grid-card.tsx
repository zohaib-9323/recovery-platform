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
}: {
  title: string
  party?: RecoveryShipmentParty
  labels: DetailLabels
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
    <div className="rounded-lg border border-bottomBorder bg-white p-5 shadow-[4px_2px_8px_0px_#00000024]">
      <p className="mb-4 text-[32px] font-semibold text-black sm:text-xl">{title}</p>
      <div className="grid grid-cols-1 gap-x-12 gap-y-3 md:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-start gap-2 text-sm">
            <span className="min-w-[112px] font-semibold text-[#7F7F7F]">{label}</span>
            <span className="font-semibold text-black">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
