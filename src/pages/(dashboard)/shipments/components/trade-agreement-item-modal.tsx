import { useEffect } from 'react'

import { useGetRecoveryPreferentialDutyQuery } from '@/app/services/recoveryApi'
import { useI18n } from '@/i18n/useI18n'
import type {
  RecoveryTradeLookupAgreement,
  RecoveryTradeLookupResponse,
} from '@/types/recovery-shipments-api'

/** Minimal item shape needed to look up and render trade-agreement info for one
 *  shipment item. `poItemIndex` is the position in the shipment's `poItems[]` array —
 *  required by the backend's `preferential-duty` endpoint. */
export type TradeAgreementModalItem = {
  poItemIndex: number
  itemNumber?: string
  description?: string
  hsCode?: string
  /** Optional pre-fetched snapshot (e.g. from an already-approved challenge) shown
   *  instantly while the live lookup below is still in flight. */
  tradeAgreement?: RecoveryTradeLookupResponse | null
}

/** Picks the most relevant preferential agreement — the one matching the lowest
 *  duty when it is preferential, otherwise the first agreement. */
const selectPreferentialAgreement = (
  tradeAgreement: RecoveryTradeLookupResponse,
): RecoveryTradeLookupAgreement | null => {
  const agreements = tradeAgreement.agreements ?? []
  if (agreements.length === 0) return null

  const lowest = tradeAgreement.lowest_duty
  if (lowest) {
    const matched = agreements.find((a) => a.measure_id === lowest.measure_id)
    if (matched) return matched
  }
  return agreements[0]
}

function DocumentsTable({ agreement }: { agreement: RecoveryTradeLookupAgreement }) {
  const { t } = useI18n()
  const documents = agreement.documents_required ?? []

  if (agreement.documents_loading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded bg-yellow/10 px-3 py-2 text-sm text-yellow">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-yellow border-t-transparent" />
        {t('shipments.detail.loadingRequiredDocuments')}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <p className="mt-3 text-sm text-lightBlackOne">
        {t('shipments.detail.noAdditionalDocuments')}
      </p>
    )
  }

  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-lightBlackOne">
        {t('shipments.detail.requiredDocuments')}
      </p>
      <div className="overflow-x-auto rounded-lg border border-bottomBorder md:overflow-x-visible">
        <table className="w-full min-w-[560px] text-left md:min-w-0">
          <thead className="bg-greyFour">
            <tr className="text-[11px] font-medium uppercase tracking-wider text-lightBlackOne">
              <th className="w-8 p-2">#</th>
              <th className="w-20 p-2">{t('shipments.detail.col.documentCode')}</th>
              <th className="p-2">{t('shipments.detail.col.description')}</th>
              <th className="p-2">{t('shipments.detail.col.guidance')}</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, idx) => (
              <tr key={`${doc.document_code}-${idx}`} className="border-t border-bottomBorder">
                <td className="p-2 align-top text-sm text-lightBlackOne">{idx + 1}</td>
                <td className="p-2 align-top text-sm font-medium">
                  <span className="inline-flex items-center rounded bg-greyFour px-2 py-0.5 text-xs font-semibold text-black">
                    {doc.document_code}
                  </span>
                </td>
                <td className="p-2 align-top text-sm text-black">
                  <p className="break-words">{doc.certificate_description}</p>
                </td>
                <td className="p-2 align-top text-sm text-lightBlackOne">
                  <p className="break-words">{doc.guidance_cds || '—'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AgreementDetails({ tradeAgreement }: { tradeAgreement: RecoveryTradeLookupResponse }) {
  const { t } = useI18n()
  const preferential = selectPreferentialAgreement(tradeAgreement)
  const standardDuty = tradeAgreement.standard_duty ?? null

  if (!standardDuty && !preferential) {
    return <p className="text-sm text-lightBlackOne">{t('shipments.detail.noDutyData')}</p>
  }

  const origin = tradeAgreement.origin
  const hasPreferential = (tradeAgreement.agreements?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-4">
      {standardDuty ? (
        <div className="rounded-lg border border-bottomBorder bg-greyFour px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-lightBlackOne">
                {t('shipments.detail.standardDuty')}
              </p>
              <p
                className="mt-1 truncate text-sm font-semibold text-black"
                title={standardDuty.agreement_name || t('shipments.detail.allCountries')}
              >
                {standardDuty.agreement_name || t('shipments.detail.allCountries')}
              </p>
              {standardDuty.measure_type ? (
                <p className="mt-0.5 text-xs text-lightBlackOne">{standardDuty.measure_type}</p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-black">{standardDuty.duty}</p>
              {standardDuty.duty_is_compound ? (
                <p className="text-[10px] text-yellow">{t('shipments.detail.compoundRate')}</p>
              ) : null}
              <p className="text-[10px] text-lightBlackOne">
                {t('shipments.detail.dutyRateLabel')}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-bottomBorder bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-lightBlackOne">
              {t('shipments.detail.applicablePreferentialAgreement')}
            </p>

            {preferential ? (
              <>
                <p className="mt-1 text-sm font-semibold text-black">
                  {preferential.agreement_name || t('shipments.detail.unknownAgreement')}
                </p>
                {preferential.measure_type ? (
                  <p className="mt-0.5 text-xs text-lightBlackOne">{preferential.measure_type}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-lightBlackOne">
                {t('shipments.detail.noPreferentialAgreement', { origin: origin ?? '' })}
              </p>
            )}
          </div>

          {preferential ? (
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-black">{preferential.duty}</p>
              {preferential.duty_is_compound ? (
                <p className="text-[10px] text-yellow">{t('shipments.detail.compoundRate')}</p>
              ) : null}
              <p className="text-[10px] text-lightBlackOne">
                {t('shipments.detail.dutyRateLabel')}
              </p>
            </div>
          ) : null}
        </div>

        {preferential ? <DocumentsTable agreement={preferential} /> : null}
      </div>

      {hasPreferential && preferential ? (
        <div className="flex flex-wrap gap-2">
          {standardDuty ? (
            <span className="rounded-full bg-greyFour px-2 py-0.5 text-[11px] font-semibold text-black">
              {t('shipments.detail.mfnBadge', { duty: standardDuty.duty ?? '' })}
            </span>
          ) : null}
          <span className="rounded-full bg-yellow/20 px-2 py-0.5 text-[11px] font-semibold text-yellow">
            {t('shipments.detail.preferentialBadge', { duty: preferential.duty ?? '' })}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function renderBody({
  isFetching,
  isError,
  tradeAgreement,
  t,
}: {
  isFetching: boolean
  isError: boolean
  tradeAgreement: RecoveryTradeLookupResponse | null
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  if (isFetching && !tradeAgreement) {
    return (
      <div className="flex items-center gap-2 text-sm text-lightBlackOne">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-yellow border-t-transparent" />
        {t('shipments.detail.loadingPreferentialDuty')}
      </div>
    )
  }
  if (isError && !tradeAgreement) {
    return <p className="text-sm text-red-600">{t('shipments.detail.preferentialDutyFailed')}</p>
  }
  if (tradeAgreement) {
    return <AgreementDetails tradeAgreement={tradeAgreement} />
  }
  return <p className="text-sm text-lightBlackOne">{t('shipments.detail.noDutyData')}</p>
}

export type TradeAgreementItemModalProps = {
  shipmentId: string
  item: TradeAgreementModalItem | null
  onClose: () => void
}

export function TradeAgreementItemModal({
  shipmentId,
  item,
  onClose,
}: TradeAgreementItemModalProps) {
  const { t } = useI18n()

  useEffect(() => {
    if (!item) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [item])

  const { data, isFetching, isError } = useGetRecoveryPreferentialDutyQuery(
    { shipmentId, itemIndex: item?.poItemIndex },
    { skip: !item },
  )

  if (!item) return null

  const content = data?.content
  // Prefer the live lookup; fall back to a previously-persisted snapshot (e.g. from an
  // approved challenge) while the live call is in flight or if it comes back empty.
  const tradeAgreement =
    content?.tradeLookup ?? content?.existingTradeAgreement ?? item.tradeAgreement ?? null
  const hasPreferential = (tradeAgreement?.agreements?.length ?? 0) > 0
  const title = hasPreferential
    ? t('shipments.detail.preferentialDutyTradeAgreement')
    : t('shipments.detail.dutyTradeAgreements')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center p-3">
        <div className="flex max-h-[90vh] w-[90%] flex-col overflow-hidden rounded-lg bg-white shadow-md sm:w-4/5 md:w-4/5 lg:w-3/5 xl:w-1/2 2xl:w-[45%]">
          <div className="flex shrink-0 items-center justify-between border-b border-bottomBorder px-6 py-4">
            <div className="min-w-0 pr-4">
              <h2 className="text-lg font-bold text-black md:text-xl">{title}</h2>
              <p className="mt-1 truncate text-sm font-semibold text-black">
                Item #{item.itemNumber}
                {item.description ? (
                  <>
                    : <span className="uppercase">{item.description}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-lightBlackOne">
                {t('shipments.detail.hsCodePrefixShort', { hsCode: item.hsCode || 'N/A' })}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label={t('common.closeModal')}>
              <span className="icon-close text-large text-black" />
            </button>
          </div>
          <div className="no-scrollbar overflow-y-auto px-6 py-4">
            <p className="mb-4 text-sm font-light text-lightBlackOne">
              {t('shipments.detail.dutyTradeAgreementsSubtitle')}
            </p>

            {renderBody({ isFetching, isError, tradeAgreement, t })}
          </div>
        </div>
      </div>
    </div>
  )
}
