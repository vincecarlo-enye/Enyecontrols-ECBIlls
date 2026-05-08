/**
 * useFinanceUtilityDashboard.js
 *
 * Backwards-compatible re-export of the shared useUtilityDashboard hook.
 * Finance sees the same meter consumption data as admin and super_admin.
 */

export { useUtilityDashboard as useFinanceUtilityDashboard } from '@/hooks/common/useUtilityDashboard'
