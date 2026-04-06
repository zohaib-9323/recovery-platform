import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type DashboardPlaceholderPageProps = {
  title: string
  description: string
}

export function DashboardPlaceholderPage({ title, description }: DashboardPlaceholderPageProps) {
  return (
    <Card className="max-w-2xl border-dashed border-rp-border/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-rp-muted">
          This route is a shell for navigation and layout. Swap this card for feature UI when
          designs and APIs are ready.
        </p>
      </CardContent>
    </Card>
  )
}
