import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-sm font-bold text-black sm:text-base">{title}</h3>
      <div className="text-lightBlackOne">{children}</div>
    </div>
  )
}

export function TermDef({ term, def }: { term: string; def: ReactNode }) {
  return (
    <p className="mt-1">
      <span className="font-semibold">{term}</span> {def}
    </p>
  )
}
