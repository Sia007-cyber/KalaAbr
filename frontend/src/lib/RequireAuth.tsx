/* =============================================================
   RequireAuth — guards the dashboard shell. No token → /login.
   Uses the reactive auth flag so login/logout re-renders the tree.
   ============================================================= */

import { Navigate, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from './hooks'
import type { ReactNode } from 'react'

export function RequireAuth({ children }: { children: ReactNode }) {
  const authed = useIsAuthenticated()
  const location = useLocation()

  if (!authed) {
    // state.url به داخل کامپوننت‌ها می‌گوید بعد از ورود به کجا برگردد
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}