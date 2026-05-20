import { z } from 'zod'

export const apiMessageEnvelopeSchema = <T extends z.ZodTypeAny>(content: T) =>
  z.object({
    statusCode: z.number().optional(),
    message: z.string().optional(),
    status: z.boolean().optional(),
    content,
  })

export const recoveryAuthSchema = apiMessageEnvelopeSchema(
  z.object({
    status: z.boolean().optional(),
    access_token: z.string().min(1),
    refresh_token: z.string().min(1),
  }),
)

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
