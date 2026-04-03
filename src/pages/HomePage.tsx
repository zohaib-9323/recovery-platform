import { useAppDispatch } from '@/app/hooks'
import { setCredentials } from '@/features/auth/authSlice'
import { useAuth } from '@/hooks/useAuth'
import { env } from '@/utils/env'

import styles from './Page.module.css'

export function HomePage() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAuth()

  const handleDemoLogin = () => {
    dispatch(
      setCredentials({
        user: { id: 'demo-1', email: 'demo@example.com', displayName: 'Demo User' },
        token: 'demo-token',
      }),
    )
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>Welcome</h1>
      <p className={styles.lead}>
        {env.appName} is a scalable React + Vite + Redux Toolkit starter with routing, linting, and
        security scanning hooks.
      </p>
      {isAuthenticated ? (
        <p className={styles.hint}>
          Signed in as <strong>{user?.email}</strong>. Open Dashboard to see session context.
        </p>
      ) : (
        <button type="button" className={styles.button} onClick={handleDemoLogin}>
          Demo login (Redux)
        </button>
      )}
    </section>
  )
}
