/**
 * router.jsx
 * Root router — assembles role-based route groups and wraps them in
 * React.Suspense so lazy-loaded pages show a spinner instead of crashing.
 */

import { Routes, Route } from 'react-router-dom'
import { lazy } from 'react'

import { AuthRedirect, RootRedirect } from './guards'
import { adminRoutes } from './adminRoutes'
import { tenantRoutes } from './tenantRoutes'
import { facilityRoutes } from './facilityRoutes'
import { financeRoutes } from './financeRoutes'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))

/**
 * PageLoader
 * Simple fallback loader shown while lazy pages are loading.
 */

export default function AppRouter() {
  return (
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={
            <>
              <AuthRedirect />
              <LoginPage />
            </>
          }
        />

        {/* Role-based route groups */}
        {adminRoutes()}
        {tenantRoutes()}
        {facilityRoutes()}
        {financeRoutes()}

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />

      </Routes>
  )
}