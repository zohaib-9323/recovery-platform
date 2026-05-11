import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/i18n/useI18n'

type DashboardPlaceholderPageProps = {
  title: string
  description: string
}

export function DashboardPlaceholderPage({ title, description }: DashboardPlaceholderPageProps) {
  const { t } = useI18n()
  return (
    <Card className="max-w-2xl border-dashed border-rp-border/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-rp-muted">{t('dashboard.placeholder.note')}</p>
      </CardContent>
    </Card>
  )
}
