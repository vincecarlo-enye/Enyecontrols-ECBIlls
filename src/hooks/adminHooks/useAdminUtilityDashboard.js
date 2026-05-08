/**
 * useAdminUtilityDashboard.js
 *
 * Backwards-compatible re-export of the shared useUtilityDashboard hook.
 * All roles (admin, super_admin, finance) hit the same /api/dashboard/utilities-*
 * endpoint and see identical meter consumption data.
 */

export { useUtilityDashboard as useAdminUtilityDashboard } from '@/hooks/common/useUtilityDashboard'
