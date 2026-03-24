/**
 * permissions/index.js — Centralized role-based permissions.
 */

export const ROLES = {
  SUPER_ADMIN:      'super_admin',
  ADMIN:            'admin',
  FINANCE:          'finance',
  FACILITY_MANAGER: 'facility_manager',
  TENANT:           'tenant',
}

const PERMISSIONS = {
  'rates:view':   ['super_admin','admin','finance','facility_manager','tenant'],
  'rates:edit':   ['super_admin'],
  'rates:create': ['super_admin'],
  'rates:delete': ['super_admin'],

  'announcements:view':          ['super_admin','admin','finance','facility_manager','tenant'],
  'announcements:create':        ['super_admin','admin','facility_manager','finance'],
  'announcements:edit:own':      ['super_admin','admin','facility_manager','finance'],
  'announcements:delete:own':    ['super_admin','admin','facility_manager','finance'],
  'announcements:edit:any':      ['super_admin','admin'],
  'announcements:delete:any':    ['super_admin','admin'],
  'announcements:system-wide':   ['super_admin'],

  'users:view':             ['super_admin','admin'],
  'users:create':           ['super_admin'],
  'users:edit':             ['super_admin'],
  'users:delete':           ['super_admin'],
  'users:suspend':          ['super_admin'],
  'users:reset-password':   ['super_admin'],
  'users:assign-role':      ['super_admin'],

  'meters:view:all':  ['super_admin'],
  'meters:view:own':  ['super_admin','admin','facility_manager'],
  'meters:create':    ['super_admin'],
  'meters:edit':      ['super_admin'],
  'meters:delete':    ['super_admin'],

  'tenants:view':   ['super_admin','admin'],
  'tenants:create': ['super_admin','admin'],
  'tenants:edit':   ['super_admin','admin'],
  'tenants:delete': ['super_admin','admin'],

  'bills:view':     ['super_admin','admin','finance','tenant'],
  'bills:create':   ['super_admin','admin','finance'],
  'bills:edit':     ['super_admin','admin','finance'],
  'bills:delete':   ['super_admin','admin'],
  'bills:approve':  ['super_admin','finance'],

  'dashboard:system-wide': ['super_admin'],
  'dashboard:building':    ['super_admin','admin'],
}

export function can(role, permission) {
  if (!role || !permission) return false
  const allowed = PERMISSIONS[permission]
  if (!allowed) return false
  return allowed.includes(role)
}

export function canModifyUser(actorRole, targetRole) {
  if (!actorRole || !targetRole) return false
  if (actorRole !== ROLES.SUPER_ADMIN && targetRole === ROLES.SUPER_ADMIN) return false
  return can(actorRole, 'users:edit')
}

export function isSystemAnnouncement(ann) {
  return ann?.createdBy === ROLES.SUPER_ADMIN || ann?.isSystemWide === true
}

export function canEditAnnouncement(role, ann) {
  if (can(role, 'announcements:edit:any')) return true
  if (can(role, 'announcements:edit:own') && ann?.createdBy === role) return true
  return false
}

export function canDeleteAnnouncement(role, ann) {
  if (can(role, 'announcements:delete:any')) return true
  if (can(role, 'announcements:delete:own') && ann?.createdBy === role) return true
  return false
}

export function getAllowedTargetRoles(creatorRole) {
  const all = [
    { value: 'tenant',           label: 'Tenant' },
    { value: 'admin',            label: 'Admin' },
    { value: 'facility_manager', label: 'Facility Manager' },
    { value: 'finance',          label: 'Finance' },
  ]
  if (creatorRole === ROLES.SUPER_ADMIN) {
    return [...all, { value: 'super_admin', label: 'Super Admin' }]
  }
  const LIMITED = {
    admin:            ['tenant','admin','facility_manager','finance'],
    facility_manager: ['tenant','admin'],
    finance:          ['tenant','admin'],
  }
  const allowed = LIMITED[creatorRole] || []
  return all.filter(r => allowed.includes(r.value))
}

export default { can, canModifyUser, isSystemAnnouncement, canEditAnnouncement, canDeleteAnnouncement, getAllowedTargetRoles, ROLES }
