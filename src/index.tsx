import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Providers } from '@/app/Providers'
import { AppRouter } from '@/app/router'
import { AppErrorBoundary } from '@/components/errors/app-error-boundary'

import './index.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

createRoot(root).render(
  <StrictMode>
    <Providers>
      <AppErrorBoundary>
        <AppRouter />
      </AppErrorBoundary>
    </Providers>
  </StrictMode>,
)
