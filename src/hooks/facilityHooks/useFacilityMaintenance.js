import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createFacilityMaintenanceTicket,
  fetchFacilityMaintenanceTickets,
  updateFacilityMaintenanceTicketStatus,
} from '@/services/facilityService/facilityMaintenanceService'

export function useFacilityMaintenance() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadTickets = useCallback(async (options = {}) => {
    const { silent = false } = options

    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const response = await fetchFacilityMaintenanceTickets()
      const data = Array.isArray(response?.data) ? response.data : []
      setTickets(data)
    } catch (err) {
      setTickets([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load maintenance tickets.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const createTicket = useCallback(async (payload) => {
    try {
      setSaving(true)
      const response = await createFacilityMaintenanceTicket(payload)
      const nextTicket = response?.data
      if (nextTicket) {
        setTickets((prev) => [nextTicket, ...prev])
      }
      return {
        success: true,
        message: response?.message || 'Maintenance ticket created successfully.',
      }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to create maintenance ticket.',
        errors: err?.response?.data?.errors || {},
      }
    } finally {
      setSaving(false)
    }
  }, [])

  const updateStatus = useCallback(async (ticketId, status) => {
    try {
      setSaving(true)
      const response = await updateFacilityMaintenanceTicketStatus(ticketId, { status })
      const updated = response?.data
      if (updated) {
        setTickets((prev) => prev.map((ticket) => (ticket.ticket_id === updated.ticket_id ? updated : ticket)))
      }
      return {
        success: true,
        message: response?.message || 'Maintenance ticket updated successfully.',
      }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to update maintenance ticket.',
      }
    } finally {
      setSaving(false)
    }
  }, [])

  const stats = useMemo(() => ({
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'in-progress').length,
    resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
  }), [tickets])

  return {
    tickets,
    loading,
    saving,
    error,
    stats,
    reload: loadTickets,
    createTicket,
    updateStatus,
  }
}
