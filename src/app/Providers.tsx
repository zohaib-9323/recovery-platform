import type { ReactNode } from 'react'
import { Provider } from 'react-redux'

import { InitialSessionSync } from '@/app/InitialSessionSync'
import { store } from '@/app/store'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <InitialSessionSync />
      {children}
    </Provider>
  )
}
