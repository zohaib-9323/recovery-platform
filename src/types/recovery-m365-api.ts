import type { RecoveryApiEnvelope } from './recovery-user-api'

export type M365ConnectionStatus = {
  connected: boolean
  email: string | null
  connectedAt: string | null
  status: string | null
}

export type M365AuthUrlContent = {
  url: string
}

export type M365StatusEnvelope = RecoveryApiEnvelope<M365ConnectionStatus>
export type M365AuthUrlEnvelope = RecoveryApiEnvelope<M365AuthUrlContent>
