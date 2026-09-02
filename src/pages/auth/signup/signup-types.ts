export type SignupCompanyStatus = 'active' | 'inactive'

export type SignupFormValues = {
  firstName: string
  lastName: string
  email: string
  phoneCode: string
  phone: string
  companyEmail: string
  password: string
  confirmPassword: string
  companyName: string
  companyWebsite: string
  address1: string
  address2: string
  country: string
  city: string
  postalCode: string
  companyPhoneCode: string
  companyPhone: string
  status: SignupCompanyStatus
  termsAccepted: boolean
}

export const EMPTY_SIGNUP_FORM: SignupFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCode: '',
  phone: '',
  companyEmail: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  companyWebsite: '',
  address1: '',
  address2: '',
  country: '',
  city: '',
  postalCode: '',
  companyPhoneCode: '',
  companyPhone: '',
  status: 'active',
  termsAccepted: false,
}

export type SignupFieldName = keyof SignupFormValues

export type SetSignupField = <K extends SignupFieldName>(
  field: K,
  value: SignupFormValues[K],
) => void
