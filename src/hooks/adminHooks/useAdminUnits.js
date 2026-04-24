import { useCallback, useEffect, useState } from 'react'
import { createAdminUnit, deleteAdminUnit, fetchAdminUnits, updateAdminUnit } from '../../services/adminService/adminUnitService'
import { getSharedAdminUnits } from '@/services/adminService/adminDirectoryStore'


export function useAdminUnits() {
    const [units, setUnits] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const loadUnits = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            const rows = await getSharedAdminUnits()
            setUnits(rows)
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load units.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadUnits()
    }, [loadUnits])

    const addUnit = async (payload) => {
        try {
            setSubmitting(true)
            setError('')
            const res = await createAdminUnit(payload)
            const created = res?.data
            if (created) {
                setUnits((prev) => [created, ...prev])
            } else {
                await loadUnits()
            }
            return res
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to create unit.'
            setError(message)
            throw err
        } finally {
            setSubmitting(false)
        }
    }

    const editUnit = async (id, payload) => {
        try {
            setSubmitting(true)
            setError('')
            const res = await updateAdminUnit(id, payload)
            const updated = res?.data
            if (updated) {
                setUnits((prev) =>
                    prev.map((unit) => (String(unit.id) === String(id) ? updated : unit))
                )
            }
            await loadUnits()
            return res
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to update unit.'
            setError(message)
            throw err
        } finally {
            setSubmitting(false)
        }
    }

    const removeUnit = async (id) => {
        try {
            setSubmitting(true)
            setError('')
            const res = await deleteAdminUnit(id)
            setUnits((prev) => prev.filter((unit) => String(unit.id) !== String(id)))
            await loadUnits()
            return res
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to delete unit.'
            setError(message)
            throw err
        } finally {
            setSubmitting(false)
        }
    }

    return {
        units,
        loading,
        submitting,
        error,
        loadUnits,
        addUnit,
        editUnit,
        removeUnit,
    }
}
