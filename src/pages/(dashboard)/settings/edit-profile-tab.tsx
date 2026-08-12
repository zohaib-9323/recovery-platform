import { useEffect, useMemo, useRef, useState } from 'react'

import { updateUserFields } from '@/app/features/auth/authSlice'
import {
  useGetRecoveryProfileQuery,
  usePatchRecoveryProfileMutation,
} from '@/app/services/recoveryApi'
import { useAppDispatch } from '@/app/redux-hooks'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CityDropdown, CountryDropdown, InputField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
import type { RecoveryApiEnvelope, RecoveryUserProfile } from '@/types/recovery-user-api'

import { buildProfilePatch, type ProfileFormValues } from './build-profile-patch'

const PLACEHOLDER_AVATAR = `${process.env.PUBLIC_URL}/images/no-profile.png`
const MAX_IMAGE_BYTES = 1_500_000
const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/
const NAME_MAX_LENGTH = 30

function fileToDataUrl(file: File, t: (key: string) => string): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error(t('settings.edit.fileReadError')))
    r.readAsDataURL(file)
  })
}

function toDateInputValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = iso.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isPhoneValid(value: string): boolean {
  const normalized = value.replace(/[()\s-]/g, '')
  return PHONE_PATTERN.test(normalized)
}

type EditProfileFormProps = {
  profile: RecoveryUserProfile
  formInstance: number
  refetch: () => Promise<{
    data?: RecoveryApiEnvelope<RecoveryUserProfile>
  }>
  onBanner: (b: { type: 'ok' | 'err'; text: string } | null) => void
}

function EditProfileForm({ profile, formInstance, refetch, onBanner }: EditProfileFormProps) {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const fileRef = useRef<HTMLInputElement>(null)
  const [patchProfile, { isLoading: saving }] = usePatchRecoveryProfileMutation()
  const today = useMemo(() => toLocalDateInputValue(new Date()), [])
  const [baselineProfile, setBaselineProfile] = useState(profile)

  const [form, setForm] = useState<ProfileFormValues>(() => ({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    dob: toDateInputValue(profile.dob),
    country: profile.country ?? '',
    city: profile.city ?? '',
    phone: profile.phone ?? '',
  }))
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(() =>
    profile.profilePic?.trim() ? profile.profilePic : PLACEHOLDER_AVATAR,
  )

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const hasUnsavedChanges = useMemo(() => {
    if (pendingFile !== null) return true
    return Object.keys(buildProfilePatch(baselineProfile, form, null)).length > 0
  }, [baselineProfile, form, pendingFile])

  const hasEmptyRequiredField = useMemo(
    () => [form.firstName, form.lastName, profile.email ?? ''].some((value) => value.trim() === ''),
    [form.firstName, form.lastName, profile.email],
  )

  const dobInFuture = useMemo(() => form.dob !== '' && form.dob > today, [form.dob, today])
  const phoneInvalid = useMemo(
    () => form.phone.trim() !== '' && !isPhoneValid(form.phone),
    [form.phone],
  )
  const firstNameTooLong = useMemo(
    () => form.firstName.trim().length > NAME_MAX_LENGTH,
    [form.firstName],
  )
  const lastNameTooLong = useMemo(
    () => form.lastName.trim().length > NAME_MAX_LENGTH,
    [form.lastName],
  )

  const formInvalid =
    hasEmptyRequiredField || dobInFuture || phoneInvalid || firstNameTooLong || lastNameTooLong

  const updateField = (key: keyof ProfileFormValues, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    onBanner(null)
  }

  const updateDob = (value: string) => {
    if (value !== '' && value > today) {
      onBanner({ type: 'err', text: t('settings.edit.dateOfBirthInvalid') })
      return
    }
    updateField('dob', value)
  }

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileRef.current) fileRef.current.value = ''
    if (!file) return
    const okTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!okTypes.includes(file.type)) {
      onBanner({ type: 'err', text: t('settings.edit.uploadTypeError') })
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onBanner({ type: 'err', text: t('settings.edit.uploadSizeError') })
      return
    }
    setPendingFile(file)
    setPreviewUrl((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    onBanner(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onBanner(null)

    let profilePicPayload: string | null = null
    if (pendingFile) {
      try {
        profilePicPayload = await fileToDataUrl(pendingFile, t)
      } catch {
        onBanner({ type: 'err', text: t('settings.edit.uploadReadError') })
        return
      }
    }

    const patch = buildProfilePatch(baselineProfile, form, pendingFile ? profilePicPayload : null)
    if (Object.keys(patch).length === 0) {
      onBanner({ type: 'err', text: t('settings.edit.noChanges') })
      return
    }

    try {
      const res = await patchProfile(patch).unwrap()
      if (res.status === false) {
        const failureMessage = res.message ?? t('settings.edit.updateFailed')
        onBanner({ type: 'err', text: failureMessage })
        showCustomToast({
          type: 'error',
          title: t('settings.edit.updateFailed'),
          message: failureMessage,
        })
        return
      }
      const next = res.content ?? profile
      setPendingFile(null)

      const refetchResult = await refetch()
      const fresh = refetchResult?.data?.content

      const identity = fresh ?? next
      const displayName = [identity.firstName, identity.lastName]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(' ')

      const headerPic =
        fresh?.profilePic?.trim() ||
        profilePicPayload?.trim() ||
        next.profilePic?.trim() ||
        profile.profilePic?.trim() ||
        ''

      setPreviewUrl(headerPic ? headerPic : PLACEHOLDER_AVATAR)
      setBaselineProfile(identity)
      setForm({
        firstName: identity.firstName ?? '',
        lastName: identity.lastName ?? '',
        dob: toDateInputValue(identity.dob),
        country: identity.country ?? '',
        city: identity.city ?? '',
        phone: identity.phone ?? '',
      })

      dispatch(
        updateUserFields({
          displayName: displayName || undefined,
          ...(headerPic ? { profilePic: headerPic } : {}),
        }),
      )
      await refetch()
      const successMessage = res.message ?? t('settings.edit.updated')
      onBanner({ type: 'ok', text: successMessage })
      showCustomToast({
        type: 'success',
        title: t('settings.edit.updated'),
        message: successMessage,
      })
    } catch (err) {
      const errorMessage = getRtkErrorMessage(err)
      onBanner({ type: 'err', text: errorMessage })
      showCustomToast({
        type: 'error',
        title: t('settings.edit.updateFailed'),
        message: errorMessage,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="flex flex-col items-start gap-3">
          <div className="relative">
            <img
              src={previewUrl}
              alt=""
              width={128}
              height={128}
              className="h-28 w-28 rounded-full border-2 border-lightYellowThree object-cover md:h-32 md:w-32"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_AVATAR
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id={`rp-profile-pic-${formInstance}`}
              onChange={onPickImage}
            />
            <label
              htmlFor={`rp-profile-pic-${formInstance}`}
              className="absolute bottom-1 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-rp-surface shadow"
              aria-label={t('settings.edit.changePhoto')}
            >
              <span className="icon-edit-pencil text-rp-fg" />
            </label>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          <InputField
            fieldType="text"
            id="rp-first"
            name="firstName"
            label={t('settings.edit.firstName')}
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            maxLength={NAME_MAX_LENGTH}
            error={firstNameTooLong ? t('settings.edit.firstNameMaxLength') : undefined}
          />
          <InputField
            fieldType="text"
            id="rp-last"
            name="lastName"
            label={t('settings.edit.lastName')}
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            maxLength={NAME_MAX_LENGTH}
            error={lastNameTooLong ? t('settings.edit.lastNameMaxLength') : undefined}
          />
          <InputField
            fieldType="text"
            id="rp-email"
            name="email"
            label={t('settings.edit.email')}
            value={profile.email ?? ''}
            onChange={() => {}}
            disabled
          />
          <div className="flex flex-col gap-2">
            <label
              htmlFor="rp-dob"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:text-rp-disabled font-semibold text-rp-fg"
            >
              {t('settings.edit.dateOfBirth')}
            </label>
            <input
              id="rp-dob"
              type="date"
              className="h-11 w-full rounded-[10px] border border-rp-border bg-rp-input px-3 text-sm text-rp-fg focus:outline-none focus:ring-2 focus:ring-rp-accent"
              value={form.dob}
              max={today}
              aria-invalid={dobInFuture}
              onChange={(e) => updateDob(e.target.value)}
            />
            {dobInFuture ? (
              <p role="alert" className="text-sm text-red-600">
                {t('settings.edit.dateOfBirthInvalid')}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="rp-country" className="font-semibold text-rp-fg">
              {t('settings.edit.country')}
            </label>
            <CountryDropdown
              id="rp-country"
              value={form.country}
              placeholder={t('settings.edit.countryPlaceholder')}
              onChange={(countryName) => {
                if (countryName !== form.country) {
                  updateField('city', '')
                }
                updateField('country', countryName)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="rp-city" className="font-semibold text-rp-fg">
              {t('settings.edit.city')}
            </label>
            <CityDropdown
              id="rp-city"
              value={form.city}
              countryName={form.country}
              placeholder={t('settings.edit.cityPlaceholder')}
              formatCreateLabel={(inputValue) =>
                `${t('settings.edit.cityPlaceholder')}: "${inputValue}"`
              }
              onChange={(city) => updateField('city', city)}
            />
          </div>
          <div className="md:col-span-2">
            <InputField
              fieldType="text"
              id="rp-phone"
              name="phone"
              label={t('settings.edit.phone')}
              placeholder="+447700900123"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              type="tel"
              maxLength={32}
              error={phoneInvalid ? t('settings.edit.phoneInvalid') : undefined}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !hasUnsavedChanges || formInvalid}>
          {saving ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </div>
    </form>
  )
}

export function EditProfileTab() {
  const { t } = useI18n()
  const { data, isLoading, isFetching, error, refetch, fulfilledTimeStamp } =
    useGetRecoveryProfileQuery(undefined, {
      refetchOnMountOrArgChange: true,
    })
  const instanceKey = fulfilledTimeStamp ?? 0

  const profile = data?.content
  const loading = isLoading || isFetching

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {t('settings.edit.loadError')}
      </p>
    )
  }

  if (loading || !profile) {
    return <CustomLoader />
  }

  return (
    <>
      <EditProfileForm
        key={instanceKey}
        profile={profile}
        formInstance={instanceKey}
        refetch={refetch}
        onBanner={() => {}}
      />
    </>
  )
}
