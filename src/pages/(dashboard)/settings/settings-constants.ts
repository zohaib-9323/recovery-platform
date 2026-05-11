export const SETTINGS_TABS = [
  { id: 'profile', label: 'Edit Profile', icon: 'icon-Edit' },
  { id: 'preferences', label: 'Preferences', icon: 'icon-sliders' },
  { id: 'security', label: 'Security', icon: 'icon-lock' },
  { id: 'delete', label: 'Delete Account', icon: 'icon-Delete' },
] as const

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id']

export const CURRENCY_OPTIONS = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'CHF'] as const

export const LEAVING_REASONS = [
  'No Longer Need the Account',
  'Found an Alternative Service',
  'Issues with Features or Functionality',
  'Concerns About Privacy or Data Security',
  'Dissatisfied with Customer Support',
  'Other (Please Specify)',
] as const
