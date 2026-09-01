/**
 * Recovery signup form fields.
 *
 * Deliberately the same set trade-harmonizer's registration collects
 * (`(auth)/(signup)/registration/personal-information.tsx`) — first/last name,
 * email, phone, company name, password, confirm password, terms — because the
 * Recovery journey is that journey minus the subscription/payment step.
 *
 * Every field here is sent to `POST /recovery/auth/register`. Do not add a
 * field without a matching property on `RegisterRecoveryUserDto`: this form
 * previously collected a full company address block that the endpoint had no
 * way to accept, so the values blocked submission and were then discarded.
 */
export type SignupFormValues = {
  firstName: string
  lastName: string
  email: string
  phoneCode: string
  phone: string
  password: string
  confirmPassword: string
  companyName: string
  termsAccepted: boolean
}

export const EMPTY_SIGNUP_FORM: SignupFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCode: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  termsAccepted: false,
}

export type SignupFieldName = keyof SignupFormValues

export type SetSignupField = <K extends SignupFieldName>(
  field: K,
  value: SignupFormValues[K],
) => void
