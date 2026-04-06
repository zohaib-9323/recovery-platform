import { Outlet } from 'react-router-dom'

import { AppLogo } from '@/components/brand/app-logo'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-rp-border bg-white px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <AppLogo size="sm" />
          <span className="text-lg font-bold tracking-tight text-rp-accent">Trade Harmonizer</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[584px] justify-center">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
