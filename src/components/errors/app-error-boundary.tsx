import { Component, type ErrorInfo, type ReactNode } from 'react'

import { t } from '@/i18n/useI18n'
import { reportRuntimeError } from '@/lib/error-reporting'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    reportRuntimeError('app-error-boundary', { error, info })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded-lg border border-rp-border bg-rp-surface p-4">
          <p className="text-sm text-rp-fg" role="alert">
            {t('errors.boundary.generic')}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
