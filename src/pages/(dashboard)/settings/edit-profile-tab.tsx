import { useEffect, useMemo, useRef, useState } from 'react'

import { updateUserFields } from '@/app/features/auth/authSlice'
import {
  useGetRecoveryProfileQuery,
  usePatchRecoveryProfileMutation,
} from '@/app/services/recoveryApi'
import { useAppDispatch } from '@/app/redux-hooks'
import { InputField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { reportRuntimeError } from '@/lib/error-reporting'
import type { RecoveryApiEnvelope, RecoveryUserProfile } from '@/types/recovery-user-api'

import { buildProfilePatch, type ProfileFormValues } from './build-profile-patch'

const PLACEHOLDER_AVATAR = `${process.env.PUBLIC_URL}/images/no-profile.png`
const MAX_IMAGE_BYTES = 1_500_000

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Could not read file'))
    r.readAsDataURL(file)
  })
}

function toDateInputValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = iso.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
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
  const dispatch = useAppDispatch()
  const fileRef = useRef<HTMLInputElement>(null)
  const [patchProfile, { isLoading: saving }] = usePatchRecoveryProfileMutation()

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
    return Object.keys(buildProfilePatch(profile, form, null)).length > 0
  }, [profile, form, pendingFile])

  const updateField = (key: keyof ProfileFormValues, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    onBanner(null)
  }

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileRef.current) fileRef.current.value = ''
    if (!file) return
    const okTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!okTypes.includes(file.type)) {
      onBanner({ type: 'err', text: 'Please upload a JPEG, PNG, or WebP image.' })
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onBanner({ type: 'err', text: 'Image is too large (max ~1.5MB).' })
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
        profilePicPayload = await fileToDataUrl(pendingFile)
      } catch (error) {
        reportRuntimeError('edit-profile:file-read', error)
        onBanner({ type: 'err', text: 'Could not read the image. Try another file.' })
        return
      }
    }

    const patch = buildProfilePatch(profile, form, pendingFile ? profilePicPayload : null)
    if (Object.keys(patch).length === 0) {
      onBanner({ type: 'err', text: 'No changes to save.' })
      return
    }

    try {
      const res = await patchProfile(patch).unwrap()
      if (res.status === false) {
        onBanner({ type: 'err', text: res.message ?? 'Update failed.' })
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

      dispatch(
        updateUserFields({
          displayName: displayName || undefined,
          ...(headerPic ? { profilePic: headerPic } : {}),
        }),
      )
      onBanner({ type: 'ok', text: res.message ?? 'Profile updated.' })
    } catch (err) {
      onBanner({ type: 'err', text: getRtkErrorMessage(err) })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        <div className="flex flex-col items-center gap-3">
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
              aria-label="Change profile photo"
            >
              <span className="icon-edit-pencil text-rp-fg" />
            </label>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            fieldType="text"
            id="rp-first"
            name="firstName"
            label="First name"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            maxLength={80}
          />
          <InputField
            fieldType="text"
            id="rp-last"
            name="lastName"
            label="Last name"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            maxLength={80}
          />
          <InputField
            fieldType="text"
            id="rp-email"
            name="email"
            label="Email"
            value={profile.email ?? ''}
            onChange={() => {}}
            disabled
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="rp-dob" className="font-semibold text-rp-fg">
              Date of birth
            </label>
            <input
              id="rp-dob"
              type="date"
              className="h-11 w-full rounded-[10px] border border-rp-border bg-rp-input px-3 text-sm text-rp-fg focus:outline-none focus:ring-2 focus:ring-rp-accent"
              value={form.dob}
              onChange={(e) => updateField('dob', e.target.value)}
            />
          </div>
          <InputField
            fieldType="text"
            id="rp-country"
            name="country"
            label="Country"
            value={form.country}
            onChange={(e) => updateField('country', e.target.value)}
            maxLength={120}
          />
          <InputField
            fieldType="text"
            id="rp-city"
            name="city"
            label="City"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            maxLength={120}
          />
          <div className="md:col-span-2">
            <InputField
              fieldType="text"
              id="rp-phone"
              name="phone"
              label="Phone"
              placeholder="+447700900123"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              maxLength={32}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !hasUnsavedChanges}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

export function EditProfileTab() {
  const { data, isLoading, isFetching, error, refetch, fulfilledTimeStamp } =
    useGetRecoveryProfileQuery()
  const instanceKey = fulfilledTimeStamp ?? 0
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const profile = data?.content
  const loading = (isLoading || isFetching) && !profile

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        Could not load your profile. Please refresh the page.
      </p>
    )
  }

  if (loading || !profile) {
    return <p className="text-sm text-rp-muted">Loading profile…</p>
  }

  return (
    <>
      {banner ? (
        <p
          role={banner.type === 'err' ? 'alert' : 'status'}
          className={
            banner.type === 'err' ? 'mb-4 text-sm text-red-600' : 'mb-4 text-sm text-rp-success'
          }
        >
          {banner.text}
        </p>
      ) : null}
      <EditProfileForm
        key={instanceKey}
        profile={profile}
        formInstance={instanceKey}
        refetch={refetch}
        onBanner={setBanner}
      />
    </>
  )
}
