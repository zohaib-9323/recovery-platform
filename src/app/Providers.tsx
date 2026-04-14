import type { ReactNode } from 'react'
import { Provider } from 'react-redux'

import { InitialSessionSync } from '@/app/InitialSessionSync'
import { TenantThemeBootstrap } from '@/app/TenantThemeBootstrap'
import { store } from '@/app/store'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <InitialSessionSync />
      <TenantThemeBootstrap />
      {children}
    </Provider>
  )
}
