import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import { AuthRedirect, RootRedirect } from './guards'
import { adminRoutes } from './adminRoutes'
import { tenantRoutes } from './tenantRoutes'
import { facilityRoutes } from './facilityRoutes'
import { financeRoutes } from './financeRoutes'
import { DashboardSkeleton } from '@/components/skeletons'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))

export default function AppRouter() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Routes>
        <Route
          path="/login"
          element={
            <>
              <AuthRedirect />
              <LoginPage />
            </>
          }
        />

        {adminRoutes()}
        {tenantRoutes()}
        {facilityRoutes()}
        {financeRoutes()}

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  )
}
