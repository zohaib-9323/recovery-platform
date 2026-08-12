import { useI18n } from '@/i18n/useI18n'

export function ImportsPage() {
  const { t } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="sticky top-0 bg-white p-3 pb-3 sm:p-6">
        <div className="text-base font-semibold text-black md:text-lg">
          {t('imports.pageTitle')}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex w-full max-w-lg flex-col items-center justify-center gap-5">
          <img src="/images/emptybox.svg" alt="" width={200} height={200} />
          <p className="text-center text-lg font-light text-black">{t('imports.empty')}</p>
        </div>
      </div>
    </div>
  )
}
