/**
 * Tailwind classes aligned with trade-harmonizer `getShipmentStatusStyle`
 * (`src/app/_components/generic-table/helper.tsx`) for admin/user visual parity.
 */
export function getShipmentStatusBadgeClassName(status: number | undefined): string {
  switch (status) {
    case 1:
      return 'bg-skyBlue/10 text-skyBlue text-xs sm:text-sm'
    case 2:
      return 'bg-lightRed text-redOne text-xs sm:text-sm'
    case 3:
      return 'bg-lightGrey text-black text-xs sm:text-sm'
    case 4:
      return 'bg-lightYellowThree text-yellow text-xs sm:text-sm'
    case 5:
      return 'bg-lightGreenOne text-green text-xs sm:text-sm'
    case 6:
      return 'bg-lightRed text-redOne text-xs sm:text-sm'
    case 7:
      return 'bg-pink/10 text-pink text-xs sm:text-sm'
    case 8:
      return 'bg-lightRed text-redOne text-xs sm:text-sm'
    case 9:
      return 'bg-purpleTwo/10 text-purpleTwo text-xs sm:text-sm'
    case 10:
      return 'bg-redOne text-whiteOne text-xs sm:text-sm'
    default:
      return 'bg-lightYellowThree text-yellow text-xs sm:text-sm'
  }
}
