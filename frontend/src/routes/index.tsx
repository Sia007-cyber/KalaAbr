/* =============================================================
   Router — public surface (/) + auth (/login, /register) sit OUTSIDE
   the dashboard shell. The pathless layout route wraps the guard
   + AppLayout so every existing dashboard path stays identical.
   ============================================================= */

import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { RequireAuth } from '../lib/RequireAuth'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { PermitsPage } from './pages/PermitsPage'
import { ItemsPage } from './pages/ItemsPage'
import { WarehousesPage } from './pages/WarehousesPage'
import { CashPage } from './pages/CashPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { PermitNewPage } from './pages/PermitNewPage'
import { PermitDetailPage } from './pages/PermitDetailPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { WarehouseDetailPage } from './pages/WarehouseDetailPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/inventory', element: <InventoryPage /> },
      { path: '/permits', element: <PermitsPage /> },
      { path: '/permits/new', element: <PermitNewPage /> },
      { path: '/permits/:id', element: <PermitDetailPage /> },
      { path: '/items', element: <ItemsPage /> },
      { path: '/items/new', element: <ComingSoonPage title="کالای جدید" /> },
      { path: '/items/:id', element: <ItemDetailPage /> },
      { path: '/warehouses', element: <WarehousesPage /> },
      { path: '/warehouses/new', element: <ComingSoonPage title="انبار جدید" /> },
      { path: '/warehouses/:id', element: <WarehouseDetailPage /> },
      { path: '/cash', element: <CashPage /> },
      { path: '/categories', element: <ComingSoonPage title="دستهبندیها" /> },
      { path: '/reports', element: <ComingSoonPage title="گزارشها" /> },
      { path: '/users', element: <ComingSoonPage title="کاربران" /> },
      { path: '/settings', element: <ComingSoonPage title="تنظیمات" /> },
      { path: '*', element: <ComingSoonPage title="صفحه یافت نشد" /> },
    ],
  },
])