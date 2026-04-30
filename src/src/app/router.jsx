import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import { AuthRedirect, RequirePasswordChange, RootRedirect } from './guards'
import { adminRoutes } from './adminRoutes'
import { superAdminRoutes } from './superAdminRoutes'
import { tenantRoutes } from './tenantRoutes'
import { facilityRoutes } from './facilityRoutes'
import { financeRoutes } from './financeRoutes'
import AppLoadingScreen from '@/components/common/AppLoadingScreen'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const ForcePasswordChangePage = lazy(() => import('@/pages/auth/ForcePasswordChange'))
const UnauthorizedPage = lazy(() => import('@/pages/common/Unauthorized'))
const NotFoundPage = lazy(() => import('@/pages/common/NotFound'))

export default function AppRouter() {
  return (
    <Suspense fallback={<AppLoadingScreen />}>
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

        <Route
          path="/force-password-change"
          element={(
            <RequirePasswordChange>
              <ForcePasswordChangePage />
            </RequirePasswordChange>
          )}
        />

        <Route path="/" element={<RootRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {adminRoutes()}
        {superAdminRoutes()}
        {tenantRoutes()}
        {facilityRoutes()}
        {financeRoutes()}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
