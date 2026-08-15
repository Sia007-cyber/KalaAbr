/* =============================================================
   App — root. Router + Query providers.
   ============================================================= */

import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './lib/providers'
import { router } from './routes'

export default function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}