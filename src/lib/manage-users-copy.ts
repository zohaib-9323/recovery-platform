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
  deleteRequestsEmptyFiltered: 'No deletion requests match your filters.',
  deleteRequestReason: 'Reason',
  deleteRequestApprove: 'Approve',
  deleteRequestReject: 'Reject',
  deleteRequestApproved: 'Request approved. The account has been suspended.',
  deleteRequestRejected: 'Request rejected.',
  deleteRequestApproveTitle: 'Approve delete request',
  deleteRequestApproveDesc:
    'Are you sure you want to approve this recovery user deletion request? The account will be suspended immediately.',
  deleteRequestRejectTitle: 'Reject delete request',
  deleteRequestRejectDesc: 'Are you sure you want to reject this recovery user deletion request?',
  yesApprove: 'Yes, Approve',
  yesReject: 'Yes, Reject',
  requestedAt: 'Requested At',

  /* Microsoft connections. The list is status only; the per-user detail screen
     behind the eye icon also shows that user's import job history. */
  connectionsTitle: 'Connection Status',
  connectionsDescription:
    "Whether each teammate's mailbox is connected, and how their imports are running.",
  connectionsEmpty: 'No team members yet.',
  connectionsFailed: 'Could not load connection status. Please try again.',
  viewConnection: 'View connection',

  /* Connection detail */
  connectionDetailTitle: 'Connection',
  connectionDetailFailed: 'Could not load this connection. Please try again.',
  connectionNotFound: 'Connection not found.',
  connectedAccount: 'Connected Account',
  connectedSince: 'Connected Since',
  lastSync: 'Last Sync',
  tokenExpiry: 'Token Expiry',
  lastError: 'Last Error',
  importJobsTitle: 'Import Jobs',
  importJobsEmpty: 'No import jobs found for this user.',
  reconnectHint:
    'This mailbox is no longer connected, so new shipments are not arriving for this user. Ask them to reconnect from their own Imports page.',
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
