/**
 * Mock data for the Manage Users screens.
 *
 * The Recovery API does not expose company-user management endpoints yet, so the
 * UI is wired to this fixture (same approach as `all-shipments.ts` / `dashboard.ts`).
 * Rows mirror the Figma "Manage Users" frames 1:1 so the screens can be compared
 * against the design. Dates are stored pre-formatted (DD/MM/YYYY) like the other
 * mock fixtures in this folder.
 */

export type ManageUserStatus = 'active' | 'suspended'

export type ManageUserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  joiningDate: string
  status: ManageUserStatus
}

export type UserReportStatus = 'approved' | 'pending' | 'rejected'
export type UserRefundStatus = 'refunded' | 'refund_pending'

export type UserRecentShipment = {
  id: string
  shipmentTitle: string
  date: string
  reportStatus: UserReportStatus
  refundStatus: UserRefundStatus
}

export type ManageUserDetail = ManageUserRow & {
  phone: string
  location: string
  profilePic: string
  recentShipments: UserRecentShipment[]
}

export const manageUsersRows: ManageUserRow[] = [
  {
    id: '234561',
    firstName: 'Jon',
    lastName: 'Haley',
    email: 'Mike17@gmail.com',
    joiningDate: '13/03/2025',
    status: 'active',
  },
  {
    id: '234562',
    firstName: 'Molly',
    lastName: 'Wiegand',
    email: 'Annabell.Larkin@hotmail.com',
    joiningDate: '12/03/2025',
    status: 'active',
  },
  {
    id: '234563',
    firstName: 'Philip',
    lastName: 'Koelpin',
    email: 'Carlo48@yahoo.com',
    joiningDate: '07/03/2025',
    status: 'active',
  },
  {
    id: '234564',
    firstName: 'Desiree',
    lastName: 'Huel',
    email: 'Polly83@yahoo.com',
    joiningDate: '02/03/2025',
    status: 'active',
  },
  {
    id: '234565',
    firstName: 'Doug',
    lastName: 'Langosh',
    email: 'Enos.Lynch@gmail.com',
    joiningDate: '28/02/2025',
    status: 'active',
  },
  {
    id: '234567',
    firstName: 'Judith',
    lastName: 'Morar',
    email: 'Yasmin.Beer@hotmail.com',
    joiningDate: '25/02/2025',
    status: 'active',
  },
  {
    id: '234568',
    firstName: 'Raul',
    lastName: 'Gusikowski',
    email: 'Georgianna77@yahoo.com',
    joiningDate: '25/02/2025',
    status: 'active',
  },
  {
    id: '234569',
    firstName: 'Ruth',
    lastName: 'Convey',
    email: 'Ruthie58@yahoo.com',
    joiningDate: '25/02/2025',
    status: 'suspended',
  },
  {
    id: '234570',
    firstName: 'Dr. Ivan',
    lastName: "O'Kon",
    email: 'Brendan.Farrell@gmail.com',
    joiningDate: '18/02/2025',
    status: 'active',
  },
  {
    id: '234571',
    firstName: 'Melba',
    lastName: 'Heller',
    email: 'Rebekah.Moyer@gmail.com',
    joiningDate: '17/02/2025',
    status: 'suspended',
  },
  {
    id: '234572',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@outlook.com',
    joiningDate: '14/02/2025',
    status: 'active',
  },
  {
    id: '234573',
    firstName: 'Tom',
    lastName: 'Bradley',
    email: 'tom.bradley@gmail.com',
    joiningDate: '10/02/2025',
    status: 'suspended',
  },
  {
    id: '234574',
    firstName: 'Lisa',
    lastName: 'Hernandez',
    email: 'lisa.hernandez@yahoo.com',
    joiningDate: '05/02/2025',
    status: 'active',
  },
  {
    id: '234575',
    firstName: 'Mark',
    lastName: 'Nguyen',
    email: 'mark.nguyen@hotmail.com',
    joiningDate: '30/01/2025',
    status: 'active',
  },
  {
    id: '234576',
    firstName: 'Emily',
    lastName: 'Patterson',
    email: 'emily.patterson@gmail.com',
    joiningDate: '25/01/2025',
    status: 'suspended',
  },
]

/** Recent shipments shown on the user detail screen (Figma frame 2338:537). */
const recentShipments: UserRecentShipment[] = [
  {
    id: '98',
    shipmentTitle: 'Dummy shipment title 98',
    date: '03/02/2025',
    reportStatus: 'approved',
    refundStatus: 'refunded',
  },
  {
    id: '99',
    shipmentTitle: 'Dummy shipment title 99',
    date: '31/01/2025',
    reportStatus: 'approved',
    refundStatus: 'refunded',
  },
  {
    id: '7',
    shipmentTitle: 'Dummy shipment title 7',
    date: '30/01/2025',
    reportStatus: 'approved',
    refundStatus: 'refunded',
  },
  {
    id: '30',
    shipmentTitle: 'Dummy shipment title 30',
    date: '18/01/2025',
    reportStatus: 'pending',
    refundStatus: 'refund_pending',
  },
  {
    id: '79',
    shipmentTitle: 'Dummy shipment title 79',
    date: '18/01/2025',
    reportStatus: 'approved',
    refundStatus: 'refunded',
  },
  {
    id: '22',
    shipmentTitle: 'Dummy shipment title 22',
    date: '18/01/2025',
    reportStatus: 'approved',
    refundStatus: 'refund_pending',
  },
  {
    id: '91',
    shipmentTitle: 'Dummy shipment title 91',
    date: '15/01/2025',
    reportStatus: 'pending',
    refundStatus: 'refund_pending',
  },
  {
    id: '6',
    shipmentTitle: 'Dummy shipment title 6',
    date: '13/01/2025',
    reportStatus: 'approved',
    refundStatus: 'refunded',
  },
  {
    id: '35',
    shipmentTitle: 'Dummy shipment title 35',
    date: '09/01/2025',
    reportStatus: 'pending',
    refundStatus: 'refund_pending',
  },
  {
    id: '16',
    shipmentTitle: 'Dummy shipment title 16',
    date: '07/01/2025',
    reportStatus: 'rejected',
    refundStatus: 'refund_pending',
  },
]

const userProfiles: Record<string, Pick<ManageUserDetail, 'phone' | 'location' | 'profilePic'>> = {
  '234567': {
    phone: '+0782131243249',
    location: 'Birmingham, UK',
    profilePic: '/images/no-profile.png',
  },
}

export function getManageUserDetail(userId: string): ManageUserDetail | undefined {
  const row = manageUsersRows.find((user) => user.id === userId)
  if (!row) {
    return undefined
  }
  const profile = userProfiles[userId] ?? {
    phone: '+0782131243249',
    location: 'Birmingham, UK',
    profilePic: '/images/no-profile.png',
  }
  return { ...row, ...profile, recentShipments }
}
