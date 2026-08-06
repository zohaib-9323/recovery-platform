import { useEffect, useState } from 'react'

import { OutlinedButton, PrimaryButton } from '@/components/buttons'
import { DropdownField, InputField } from '@/components/fields'
import type { RecoveryShipmentItem } from '@/types/recovery-shipments-api'

const REASON_OPTIONS = [
  'Incorrect classification',
  'Product category mismatch',
  'Tariff miscalculation',
  'Other',
]

export type ChallengeHsCodeModalProps = {
  item: RecoveryShipmentItem
  onClose: () => void
  onSubmit: (values: { proposedHsCode: string; reason: string; description?: string }) => void
  isLoading?: boolean
}

export function ChallengeHsCodeModal({
  item,
  onClose,
  onSubmit,
  isLoading = false,
}: ChallengeHsCodeModalProps) {
  const [proposedHsCode, setProposedHsCode] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = () => {
    if (!/^\d{10}$/.test(proposedHsCode)) {
      setError('Enter a valid 10-digit HS code')
      return
    }
    if (proposedHsCode === item.hsCode) {
      setError('HS Code must be different from the original')
      return
    }
    if (!reason) {
      setError('Select a reason')
      return
    }
    if (reason === 'Other' && !description.trim()) {
      setError('Please specify the reason')
      return
    }
    setError('')
    onSubmit({ proposedHsCode, reason, description: description.trim() || undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm p-3">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-lightGrey px-6 py-4">
          <h3 className="text-lg font-semibold text-black">Challenge HS Code</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-greySix hover:text-black"
          >
            <span className="icon-close text-xl" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-greySix">Current HS Code</p>
            <div className="rounded-md bg-greyFour px-3 py-2 text-sm text-black">
              {item.hsCode || 'N/A'}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-greySix">Description</p>
            <div className="rounded-md bg-greyFour px-3 py-2 text-sm text-black">
              {item.description || 'N/A'}
            </div>
          </div>

          <InputField
            fieldType="text"
            label="Expected HS Code *"
            placeholder="Enter the correct HS Code you believe is appropriate"
            value={proposedHsCode}
            maxLength={10}
            onChange={(e) => setProposedHsCode(e.target.value.replace(/\D/g, ''))}
          />

          <DropdownField
            label="Reason for Challenge *"
            placeholder="Select a reason"
            options={REASON_OPTIONS.map((r) => ({ value: r, label: r }))}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <InputField
            fieldType="richtext"
            label={
              reason === 'Other' ? 'Please specify the reason *' : 'Additional details (optional)'
            }
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-3 bg-greyFour px-6 py-4">
          <OutlinedButton
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 text-sm"
          >
            Cancel
          </OutlinedButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !proposedHsCode || !reason}
            className="h-10 text-sm"
          >
            {isLoading ? 'Submitting…' : 'Submit'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
