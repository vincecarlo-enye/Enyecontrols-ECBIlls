/**
 * guards.jsx
 * Role-based route guard components + redirect helpers.
 */

import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function RequireAdmin({ children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  // Both admin and super_admin can access admin routes
  if (user.role !== "admin" && user.role !== "super_admin")
    return <Navigate to="/tenant/dashboard" replace />

  return children
}

export function RequireSuperAdmin({ children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "super_admin") return <Navigate to="/admin" replace />

  return children
}

export function RequireTenant({ children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "tenant") return <Navigate to="/tenant/dashboard" replace />

  return children
}

export function RequireFacility({ children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "facility_manager")
    return <Navigate to="/facility/dashboard" replace />

  return children
}

export function RequireFinance({ children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "finance")
    return <Navigate to="/finance/dashboard" replace />

  return children
}

/**
 * Root redirect ( / )
 */
export function RootRedirect() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case "super_admin":
      return <Navigate to="/admin" replace />
    case "admin":
      return <Navigate to="/admin" replace />
    case "facility_manager":
      return <Navigate to="/facility/dashboard" replace />
    case "finance":
      return <Navigate to="/finance/dashboard" replace />
    default:
      return <Navigate to="/tenant/dashboard" replace />
  }
}

/**
 * Prevent logged-in users from seeing login page
 */
export function AuthRedirect() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case "super_admin":
      return <Navigate to="/admin" replace />
    case "admin":
      return <Navigate to="/admin" replace />
    case "facility_manager":
      return <Navigate to="/facility/dashboard" replace />
    case "finance":
      return <Navigate to="/finance/dashboard" replace />
    default:
      return <Navigate to="/tenant/dashboard" replace />
  }
}
