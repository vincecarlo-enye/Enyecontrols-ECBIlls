import { unwrapCollection } from '@/utils/apiUtils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createFacilityMaintenanceTicket,
  fetchFacilityMaintenanceTickets,
  updateFacilityMaintenanceTicketStatus,
} from '@/services/facilityService/facilityMaintenanceService'


function unwrapRecord(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload
}

export function useFacilityMaintenance() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchFacilityMaintenanceTickets()
      const data = unwrapCollection(response)
      setTickets(data)
    } catch (err) {
      setTickets([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load maintenance tickets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const createTicket = useCallback(async (payload) => {
    try {
      setSaving(true)
      const response = await createFacilityMaintenanceTicket(payload)
      const nextTicket = unwrapRecord(response)
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
      const updated = unwrapRecord(response)
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
