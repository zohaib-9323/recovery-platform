import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

type AuthBackToLoginProps = {
  prompt: string
  linkLabel: string
}

/**
 * "Go back to login? Login ↗" row shared by the forgot-password,
 * reset-password and first-login screens — mirrors trade-harmonizer's
 * inline `icon-arrow-up-right` link used at the bottom of every auth form.
 */
export function AuthBackToLogin({ prompt, linkLabel }: AuthBackToLoginProps) {
  return (
    <div className="flex w-full flex-row items-center gap-1">
      <p className="text-xs font-normal text-greyThree sm:text-sm">{prompt}</p>
      <Link
        to="/login"
        className="flex flex-row items-center text-xs font-normal text-black sm:text-sm"
      >
        {linkLabel}
        <ArrowUpRight className="h-5 w-5 text-black" strokeWidth={2} />
      </Link>
    </div>
  )
}
