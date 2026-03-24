/**
 * context/AnnouncementContext.jsx
 * Shared announcement state. Super Admin posts system-wide announcements.
 * Other roles post local (area/tenant) announcements.
 */
import { createContext, useContext, useState, useCallback } from 'react'
import initialAnnouncements from '@/data/mock/announcements.json'

const AnnouncementContext = createContext()

export function AnnouncementProvider({ children }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)

  const addAnnouncement = useCallback((announcement) => {
    const newAnn = {
      ...announcement,
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      isSystemWide: announcement.createdBy === 'super_admin',
    }
    setAnnouncements(prev => [newAnn, ...prev])
    return newAnn
  }, [])

  const updateAnnouncement = useCallback((id, data) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
  }, [])

  const deleteAnnouncement = useCallback((id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }, [])

  // Returns announcements visible to a role
  // System-wide (super_admin) announcements go to ALL roles
  const getAnnouncementsForRole = useCallback((role) => {
    if (!role) return []
    return announcements.filter(a => {
      if (a.isSystemWide || a.createdBy === 'super_admin') return true
      return Array.isArray(a.targetRoles) && a.targetRoles.includes(role)
    })
  }, [announcements])

  return (
    <AnnouncementContext.Provider value={{ announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, getAnnouncementsForRole }}>
      {children}
    </AnnouncementContext.Provider>
  )
}

export function useAnnouncements() { return useContext(AnnouncementContext) }
