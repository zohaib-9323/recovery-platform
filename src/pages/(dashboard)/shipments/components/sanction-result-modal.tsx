import { useEffect, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/preset/primary-button'
import { OutlinedButton } from '@/components/buttons/preset/outlined-button'
import { useI18n } from '@/i18n/useI18n'
import type { SanctionMatch } from '@/lib/sanction-modal-helper'

function getSeverityColor(score: number) {
  if (score >= 90) return 'text-redOne'
  if (score >= 70) return 'text-orange'
  return 'text-yellow'
}

export type SanctionResultModalProps = {
  isOpen: boolean
  onClose: () => void
  shipmentTitle?: string
  vendorName: string
  vendorAddress?: string
  riskLevel?: string
  sanctionsData?: SanctionMatch[]
  currentDecision?: 'stopped' | 'ignored' | 'none' | null
  onDecision: (decision: 'stopped' | 'ignored') => void
  isLoading?: boolean
  showDecisionActions?: boolean
}

export function SanctionResultModal({
  isOpen,
  onClose,
  shipmentTitle,
  vendorName,
  riskLevel,
  vendorAddress,
  sanctionsData = [],
  currentDecision,
  onDecision,
  isLoading = false,
  showDecisionActions = true,
}: SanctionResultModalProps) {
  const { t } = useI18n()
  const isStopped = currentDecision === 'stopped'
  const [activeTab, setActiveTab] = useState<string>('')
  const [pendingDecision, setPendingDecision] = useState<'stopped' | 'ignored' | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleDecisionPress = (decision: 'stopped' | 'ignored') => {
    setPendingDecision(decision)
    onDecision(decision)
  }

  const isDecisionInFlight = isLoading && pendingDecision !== null
  const uniqueLists = Array.from(new Set(sanctionsData.map((match) => match.listName)))
  const effectiveActiveTab =
    activeTab && uniqueLists.includes(activeTab) ? activeTab : (uniqueLists[0] ?? '')
  const activeMatches = sanctionsData.filter((match) => match.listName === effectiveActiveTab)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm">
      <div className="w-[90%] max-w-[600px] overflow-hidden rounded-xl bg-white shadow-lg md:w-[600px]">
        <div className="flex items-center justify-between border-b border-lightGrey px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="icon-alert-triangle text-xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">
                {isStopped ? 'Update DPS Decision' : 'Sanction Match Detected'}
              </h3>
              <p className="text-sm text-greySix">
                {isStopped
                  ? 'Processing is stopped — you can choose Ignore & Continue to resume'
                  : 'Action required for shipment processing'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-greySix hover:text-black">
            <span className="icon-close text-xl" />
          </button>
        </div>

        <div className="p-6">
          {isStopped ? (
            <div className="mb-4 rounded-lg border border-redOne bg-lightRedOne px-4 py-3 text-sm text-black">
              This shipment is stopped due to a DPS match. Select{' '}
              <span className="font-semibold">Ignore &amp; Continue</span>{' '}
              {t('shipments.sanction.unlockViewing')}
            </div>
          ) : null}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-greyFour p-4">
            <div>
              <p className="text-xs text-greySix">{t('shipments.sanction.vendorName')}</p>
              <p className="font-medium text-black">{vendorName}</p>
            </div>
            <div>
              <p className="text-xs text-greySix">{t('shipments.sanction.shipmentTitle')}</p>
              <p className="font-medium text-black" title={shipmentTitle}>
                {shipmentTitle || 'Unknown Shipment'}
              </p>
            </div>
            <div>
              <p className="text-xs text-greySix">{t('shipments.sanction.vendorAddress')}</p>
              <p className="text-xs font-medium text-black" title={vendorAddress}>
                {vendorAddress || 'Unknown Address'}
              </p>
            </div>
            <div>
              <p className="text-xs text-greySix">{t('shipments.sanction.riskLevel')}</p>
              <p className="font-medium text-black">{riskLevel || 'Unknown Risk Level'}</p>
            </div>
          </div>

          {uniqueLists.length > 0 ? (
            <>
              <div className="mb-4 flex border-b border-lightGrey">
                {uniqueLists.map((list) => (
                  <button
                    key={list}
                    type="button"
                    onClick={() => setActiveTab(list)}
                    className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                      effectiveActiveTab === list
                        ? 'border-primary text-primary'
                        : 'border-transparent text-greySix hover:text-black'
                    }`}
                  >
                    {list}
                  </button>
                ))}
              </div>
              <div className="max-h-[200px] overflow-y-auto pr-2">
                {activeMatches.map((match, idx) => (
                  <div
                    key={`${match.matchId}-${idx}`}
                    className="mb-3 rounded-lg border border-lightGrey p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-black">{match.entityName}</span>
                      <span className={`text-sm font-bold ${getSeverityColor(match.score)}`}>
                        {match.score}% Match
                      </span>
                    </div>
                    {match.entityDetails ? (
                      <div className="text-xs text-greySix">
                        {Object.entries(match.entityDetails)
                          .slice(0, 12)
                          .map(([key, value]) => (
                            <p key={key} className="mb-1">
                              <span className="font-medium capitalize">{key}:</span> {String(value)}
                            </p>
                          ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-greySix">
              {t('shipments.sanction.noMatchData')}
            </div>
          )}
        </div>

        <div className="bg-greyFour px-6 py-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <OutlinedButton
              type="button"
              onClick={onClose}
              disabled={isDecisionInFlight}
              className="h-10 text-sm"
            >
              {showDecisionActions ? 'Review Later' : 'Close'}
            </OutlinedButton>
            {showDecisionActions ? (
              <>
                <OutlinedButton
                  type="button"
                  onClick={() => handleDecisionPress('ignored')}
                  disabled={isDecisionInFlight && pendingDecision !== 'ignored'}
                  className="h-10 border-black text-sm text-black"
                >
                  {pendingDecision === 'ignored' && isLoading ? 'Saving…' : 'Ignore & Continue'}
                </OutlinedButton>
                {!isStopped ? (
                  <PrimaryButton
                    type="button"
                    onClick={() => handleDecisionPress('stopped')}
                    disabled={isDecisionInFlight && pendingDecision !== 'stopped'}
                    className="h-10 bg-primary text-sm"
                  >
                    {pendingDecision === 'stopped' && isLoading ? 'Saving…' : 'Stop Processing'}
                  </PrimaryButton>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
