import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { DashboardSkeleton } from "@/components/skeletons"

function getHomeByRole(user) {
  if (!user) return "/login"

  switch (user.role) {
    case "super_admin":
      return "/super-admin"
    case "admin":
      return "/admin"
    case "facility_manager":
      return "/facility/dashboard"
    case "finance":
      return "/finance/dashboard"
    default:
      return "/tenant/dashboard"
  }
}

function GuardLoading() {
  return <DashboardSkeleton />
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "admin") {
    return <Navigate to={getHomeByRole(user)} replace />
  }

  return children
}

export function RequireSuperAdmin({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "super_admin") return <Navigate to={getHomeByRole(user)} replace />

  return children
}

export function RequireTenant({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "tenant") return <Navigate to={getHomeByRole(user)} replace />

  return children
}

export function RequireFacility({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "facility_manager") return <Navigate to={getHomeByRole(user)} replace />

  return children
}

export function RequireFinance({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "finance") return <Navigate to={getHomeByRole(user)} replace />

  return children
}

export function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <GuardLoading />
  if (!user) return <Navigate to="/login" replace />

  return <Navigate to={getHomeByRole(user)} replace />
}

export function AuthRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <GuardLoading />
  if (!user) return null

  return <Navigate to={getHomeByRole(user)} replace />
}
