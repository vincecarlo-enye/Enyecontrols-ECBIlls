import { useAuth } from '@/context/AuthContext'
import { can, canModifyUser, canEditAnnouncement, canDeleteAnnouncement, getAllowedTargetRoles, isSystemAnnouncement, ROLES } from '@/permissions'

export function usePermissions() {
  const { user } = useAuth()
  const role = user?.role || null
  return {
    role,
    isSuperAdmin:      role === ROLES.SUPER_ADMIN,
    isAdmin:           role === ROLES.ADMIN,
    isTenant:          role === ROLES.TENANT,
    isFinance:         role === ROLES.FINANCE,
    isFacilityManager: role === ROLES.FACILITY_MANAGER,
    can: (permission) => can(role, permission),
    canModifyUser:         (targetRole) => canModifyUser(role, targetRole),
    canEditAnnouncement:   (ann) => canEditAnnouncement(role, ann),
    canDeleteAnnouncement: (ann) => canDeleteAnnouncement(role, ann),
    isSystemAnnouncement,
    getAllowedTargetRoles:  () => getAllowedTargetRoles(role),
  }
}

export default usePermissions
