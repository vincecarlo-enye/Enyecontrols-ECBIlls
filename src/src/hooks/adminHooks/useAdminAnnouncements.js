import { useCallback, useEffect, useMemo, useState } from 'react'
import { createAdminAnnouncement, deleteAdminAnnouncement, fetchAdminAnnouncements, getAdminAnnouncementsSnapshot, updateAdminAnnouncement } from '../../services/adminService/adminAnnouncementService'


function mapBackendToUI(item) {
  const roleNames = Array.isArray(item?.roles)
    ? item.roles.map((r) => r.role_name).filter(Boolean)
    : []

  const isSystemWide = item?.audience_type === 'all'
  const targetRoles = isSystemWide
    ? ['super_admin', 'admin', 'finance', 'facility_manager', 'tenant']
    : roleNames

  return {
    id: item.id,
    title: item.title || '',
    body: item.message || '',
    type: 'notice',
    priority: 'medium',
    targetRoles,
    isSystemWide,
    date: item.created_at
      ? new Date(item.created_at).toLocaleDateString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    author:
      item?.creator?.name ||
      item?.creator?.role ||
      'Management',
    createdBy: item?.creator?.role || item?.creator?.name || 'admin',
    status: item?.status || 'published',
    starts_at: item?.starts_at || '',
    ends_at: item?.ends_at || '',
    _raw: item,
  }
}

function isActiveAnnouncement(announcement) {
  const status = String(announcement?.status || '').toLowerCase()
  if (status && status !== 'published') return false

  const now = Date.now()
  const startsAt = announcement?.starts_at ? new Date(announcement.starts_at).getTime() : null
  const endsAt = announcement?.ends_at ? new Date(announcement.ends_at).getTime() : null

  if (startsAt && !Number.isNaN(startsAt) && now < startsAt) return false
  if (endsAt && !Number.isNaN(endsAt) && now > endsAt) return false

  return true
}

function mapUIToBackend(formData) {
  const audience_type = formData.isSystemWide
    ? 'all'
    : formData.targetRoles?.length > 0
      ? 'role'
      : 'all'

  return {
    title: formData.title?.trim() || '',
    message: formData.body?.trim() || '',
    audience_type,
    status: 'published',
    starts_at: null,
    ends_at: null,
    roles: audience_type === 'role' ? formData.targetRoles : [],
  }
}

function sortAnnouncementsNewestFirst(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left?._raw?.created_at || left?.starts_at || left?.date || 0).getTime()
    const rightTime = new Date(right?._raw?.created_at || right?.starts_at || right?.date || 0).getTime()
    return rightTime - leftTime
  })
}

export function useAdminAnnouncements() {
  const initialSnapshot = getAdminAnnouncementsSnapshot()
  const initialRows = Array.isArray(initialSnapshot?.data) ? initialSnapshot.data : []
  const hasInitialAnnouncements = initialRows.length > 0
  const [announcements, setAnnouncements] = useState(() => sortAnnouncementsNewestFirst(initialRows.map(mapBackendToUI)))
  const [loading, setLoading] = useState(!hasInitialAnnouncements)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading((current) => current || !hasInitialAnnouncements)
      setError('')
      const res = await fetchAdminAnnouncements()
      const rows = Array.isArray(res?.data) ? res.data : []
      setAnnouncements(sortAnnouncementsNewestFirst(rows.map(mapBackendToUI)))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  const addAnnouncement = async (formData) => {
    try {
      setSubmitting(true)
      setError('')
      const payload = mapUIToBackend(formData)
      const res = await createAdminAnnouncement(payload)
      const created = res?.data

      if (created) {
        setAnnouncements((prev) => sortAnnouncementsNewestFirst([mapBackendToUI(created), ...prev]))
      } else {
        await loadAnnouncements()
      }

      return res
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create announcement.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const editAnnouncement = async (id, formData) => {
    try {
      setSubmitting(true)
      setError('')
      const payload = mapUIToBackend(formData)
      const res = await updateAdminAnnouncement(id, payload)
      const updated = res?.data

      if (updated) {
        setAnnouncements((prev) =>
          sortAnnouncementsNewestFirst(
            prev.map((item) => (String(item.id) === String(id) ? mapBackendToUI(updated) : item))
          )
        )
      } else {
        await loadAnnouncements()
      }

      return res
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update announcement.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const removeAnnouncement = async (id) => {
    try {
      setSubmitting(true)
      setError('')
      await deleteAdminAnnouncement(id)
      setAnnouncements((prev) => prev.filter((item) => String(item.id) !== String(id)))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete announcement.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const getAnnouncementsForRole = useCallback(
    (role) => {
      return announcements.filter((ann) => {
        if (!isActiveAnnouncement(ann)) return false
        if (ann.isSystemWide) return true
        return ann.targetRoles.includes(role)
      })
    },
    [announcements]
  )

  return {
    announcements,
    loading,
    submitting,
    error,
    loadAnnouncements,
    getAnnouncementsForRole,
    addAnnouncement,
    updateAnnouncement: editAnnouncement,
    deleteAnnouncement: removeAnnouncement,
  }
}
