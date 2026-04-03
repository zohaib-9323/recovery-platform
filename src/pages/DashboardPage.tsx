import { useAppDispatch } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { useAuth } from '@/hooks/useAuth'

import styles from './Page.module.css'

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const { user, token, isAuthenticated } = useAuth()

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>Dashboard</h1>
      {isAuthenticated ? (
        <>
          <dl className={styles.dl}>
            <div>
              <dt>User ID</dt>
              <dd>{user?.id}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Token (preview)</dt>
              <dd className={styles.mono}>{token?.slice(0, 12)}…</dd>
            </div>
          </dl>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => dispatch(logout())}
          >
            Log out
          </button>
        </>
      ) : (
        <p className={styles.hint}>You are not signed in. Use Home to run the demo login.</p>
      )}
    </section>
  )
}
