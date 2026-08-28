import { SignupTermsContentPartOne } from '@/pages/auth/signup/SignupTermsContentPartOne'
import { SignupTermsContentPartTwo } from '@/pages/auth/signup/SignupTermsContentPartTwo'

/**
 * Body of `SignupTermsModal` — same content as trade-harmonizer's
 * `TermsModal` (`src/app/_components/terms-modal/index.tsx`), since Recovery
 * Platform is powered by/operated under Trade Harmonizer (see the
 * `AuthLayout` "Powered by Trade Harmonizer" footer). Split across
 * `SignupTermsContentPartOne`/`Two` so no single file crosses the repo's
 * 500-line cap.
 */
export function SignupTermsContent() {
  return (
    <>
      <SignupTermsContentPartOne />
      <SignupTermsContentPartTwo />
    </>
  )
}
