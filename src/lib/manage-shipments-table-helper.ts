import { MS } from '@/lib/manage-shipments-copy'

export const getShipmentStatusStyle = (status: number) => {
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
    default:
      return 'bg-lightYellowThree text-yellow text-xs sm:text-sm'
  }
}

export const getShipmentStatusText = (status: number) => {
  switch (status) {
    case 1:
      return MS.HSCodeProcessing
    case 2:
      return MS.c88UploadPending
    case 3:
      return MS.shipmentProcessing
    case 4:
      return MS.shipmentPending
    case 5:
      return MS.shipmentSuccessful
    case 6:
      return MS.shipmentRejected
    case 7:
      return MS.hsCodeChallenged
    case 8:
      return MS.itemMappingFailed
    case 9:
      return MS.costDiscrepancy
    default:
      return ''
  }
}

export const getShipmentStatusTooltipDesc = (status: number) => {
  switch (status) {
    case 1:
      return MS.hsCodeProcessingDesc
    case 2:
      return MS.c88UploadPendingDesc
    case 3:
      return MS.shipmentProcessingDesc
    case 4:
      return MS.shipmentIsPending
    case 5:
      return MS.shipmentSuccessfulDesc
    case 6:
      return MS.shipmentRejectedDesc
    case 7:
      return MS.hsCodeChallengedDesc
    case 8:
      return MS.itemMappingFailedDesc
    case 9:
      return MS.costDiscrepancyDesc
    default:
      return ''
  }
}

export const getRefundStatusStyle = (status: number) => {
  switch (status) {
    case 1:
      return 'bg-brown/10 text-brown text-xs sm:text-sm'
    case 2:
      return 'bg-lightYellowThree text-yellow text-xs sm:text-sm'
    case 3:
      return 'bg-lightBlueOne text-blue text-xs sm:text-sm'
    case 4:
      return 'bg-lightGreenOne text-green text-xs sm:text-sm'
    default:
      return 'bg-lightYellowThree text-yellow text-xs sm:text-sm'
  }
}

export const getRefundStatusText = (status: number, isAdmin?: boolean) => {
  switch (status) {
    case 1:
      return isAdmin ? MS.refundUnderReview : MS.underReview
    case 2:
      return isAdmin ? MS.refundPending : MS.pendingCapital
    case 3:
      return MS.notEligible
    case 4:
      return MS.refundedOne
    default:
      return ''
  }
}

export const getRefundStatusTooltipDesc = (status: number) => {
  switch (status) {
    case 1:
      return MS.refundUnderReviewDesc
    case 2:
      return MS.refundPendingDesc
    case 3:
      return MS.refundNotEligibleDesc
    case 4:
      return MS.refundedDesc
    default:
      return ''
  }
}
