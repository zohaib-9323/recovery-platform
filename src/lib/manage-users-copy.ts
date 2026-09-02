/**
 * English copy for the Manage Users list + User Detail screens.
 * Mirrors the `MS` (Manage Shipments) copy-object convention.
 */
export const MU = {
  /* Toolbar */
  manageUsers: 'Manage Users',
  search: 'Search',
  selectStatus: 'Select status',
  createUser: 'Create User',

  /* Delete requests — a Company User's request is reviewed by their owner. */
  deleteRequestsTitle: 'Account Deletion Requests',
  deleteRequestsDescription:
    'Requests from your team. Your own deletion request is reviewed by the platform admin.',
  deleteRequestsEmpty: 'No pending deletion requests.',
  deleteRequestReason: 'Reason',
  deleteRequestApprove: 'Approve',
  deleteRequestReject: 'Reject',
  deleteRequestApproved: 'Request approved. The account has been suspended.',
  deleteRequestRejected: 'Request rejected.',

  /* Microsoft connections — status only; import data stays private per user. */
  connectionsTitle: 'Microsoft Connections',
  connectionsDescription:
    "Whether each teammate's mailbox is connected. Import jobs stay private to each user.",
  connectionsEmpty: 'No team members yet.',
  connectionsFailed: 'Could not load connection status. Please try again.',
  deleteRequestsFailed: 'Could not load deletion requests. Please try again.',
  retry: 'Retry',
  connectionConnected: 'Connected',
  connectionNotConnected: 'Not connected',
  inviteUser: 'Invite User',

  /* Bulk actions */
  selectAll: 'Select All',
  exportCSV: 'Export CSV',

  /* List table */
  name: 'Name',
  joiningDate: 'Joining Date',
  email: 'Email',
  status: 'Status',
  actions: 'Actions',
  noUsersAvailable: 'No users available',
  notAuthorizedTitle: 'Not authorized',
  notAuthorizedMessage: 'Only the company owner can manage users.',
  domainMismatchHint: 'This must match your own company email domain to send an invite.',

  /* Row action menu */
  suspendUser: 'Suspend User',
  reactivateUser: 'Reactivate User',
  viewUserDetails: 'View User Details',

  /* Status confirmation */
  suspendUserDesc: 'Are you sure you want to suspend this user? They will lose access immediately.',
  reactivateUserDesc: 'Are you sure you want to reactivate this user? Access will be restored.',
  yesSuspend: 'Yes, Suspend',
  yesActivate: 'Yes, Activate',
  cancel: 'Cancel',

  /* Create / Invite modals */
  createUserDesc: 'Create new user directly through administrative authority.',
  inviteUserDesc: 'Send an invitation to join your organization.',
  createPassword: 'Create Password',
  createPasswordDesc: 'Choose a secure password to protect your account.',
  firstName: 'First Name',
  lastName: 'Last Name',
  enterFirstName: 'Enter First Name',
  enterLastName: 'Enter Last Name',
  enterPhoneNumber: 'Enter Phone Number',
  password: 'Password',
  enterPassword: 'Enter Password',
  confirmPassword: 'Confirm Password',
  phoneCode: 'Phone country code',
  phoneCodePlaceholder: '+ XX',
  createAndNotify: 'Create & Notify',
  sendInvitation: 'Send Invitation',
  emailPlaceholder: 'john@2company.com',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  invalidEmail: 'Enter a valid email address',
  required: 'This field is required',
  passwordsDoNotMatch: 'Passwords do not match',

  /* Detail header */
  back: 'Back',
  userIdPrefix: 'User ID #',
  viewUserLogs: 'View User Logs',

  /* User information card */
  userInformation: 'User Information',
  fullName: 'Full Name',
  emailAddress: 'Email Address',
  phoneNumber: 'Phone Number',
  location: 'Location',
  collapseSection: 'Collapse section',
  expandSection: 'Expand section',

  /* Recent shipments card */
  recentShipments: 'Recent Shipments',
  viewAll: 'View All',
  username: 'Username',
  shipmentTitle: 'Shipment Title',
  date: 'Date',
  reportStatus: 'Report Status',
  refundStatus: 'Refund Status',
  noRecentShipments: 'No shipments found for this user',
  viewShipment: 'View shipment',

  /* Misc */
  userNotFound: 'User not found',
  rowActions: 'Row actions',
  notAvailable: 'N/A',
} as const
