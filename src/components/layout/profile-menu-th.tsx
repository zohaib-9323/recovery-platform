import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { logout } from '@/app/features/auth/authSlice'
import { useAppDispatch } from '@/app/redux-hooks'

const defaultAvatar = `${process.env.PUBLIC_URL}/images/no-profile.png`

type ProfileMenuThProps = {
  avatarUrl?: string
  name: string
  email: string
}

export function ProfileMenuTh({ avatarUrl, name, email }: ProfileMenuThProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const resolvedSrc = avatarUrl || defaultAvatar

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative z-20" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center space-x-2 focus:outline-none"
        aria-expanded={open}
      >
        <img
          src={resolvedSrc}
          alt="Profile"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full border-2 border-lightYellowThree object-cover"
          onError={(e) => {
            e.currentTarget.src = defaultAvatar
          }}
        />
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 min-w-56 rounded-lg bg-white py-2 shadow-lg">
          <div className="border-b border-bottomBorder px-4 py-3">
            <p className="truncate font-semibold text-rp-heading">{name}</p>
            <p className="truncate text-sm text-rp-fg">{email}</p>
          </div>
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-rp-fg hover:bg-bgColor"
            onClick={() => {
              setOpen(false)
              dispatch(logout())
              navigate('/login')
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
