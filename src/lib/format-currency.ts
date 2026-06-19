/** Same behavior as trade-harmonizer `formatCurrency` (amount only, no symbol). */
export function formatCurrency(value: unknown): string {
  const n = Number(value)
  const safe = Number.isFinite(n) ? n : 0
  return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
