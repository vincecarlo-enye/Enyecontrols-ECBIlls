import { useCallback, useEffect, useState } from 'react'
import {
  applyFinanceBillPenalties,
  fetchBillingPenaltyRule,
  previewFinanceBillPenalties,
  updateBillingPenaltyRule,
} from '@/services/billingPenaltyService'

function normalizeRule(payload = {}) {
  return {
    isEnabled: Boolean(payload?.is_enabled),
    penaltyType: payload?.penalty_type || 'percentage',
    penaltyValue: Number(payload?.penalty_value ?? 0),
    graceDays: Number(payload?.grace_days ?? 0),
    notes: payload?.notes || '',
    updatedAt: payload?.updated_at || null,
    updatedBy: payload?.updated_by || null,
  }
}

export function useBillingPenaltyRule() {
  const [rule, setRule] = useState(normalizeRule())
  const [penaltyPreview, setPenaltyPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRule = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetchBillingPenaltyRule()
      setRule(normalizeRule(response?.data || {}))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load penalty rule.')
      setRule(normalizeRule())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRule()
  }, [loadRule])

  const saveRule = useCallback(async (payload) => {
    try {
      setSaving(true)
      setError('')
      const response = await updateBillingPenaltyRule({
        is_enabled: Boolean(payload?.isEnabled),
        penalty_type: payload?.penaltyType || 'percentage',
        penalty_value: Number(payload?.penaltyValue ?? 0),
        grace_days: Number(payload?.graceDays ?? 0),
        notes: payload?.notes || '',
      })
      setRule(normalizeRule(response?.data || {}))
      return { success: true, data: normalizeRule(response?.data || {}), message: response?.message }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update penalty rule.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [])

  const previewPenalties = useCallback(async ({ asOfDate }) => {
    try {
      setPreviewLoading(true)
      setError('')
      const response = await previewFinanceBillPenalties({ as_of_date: asOfDate })
      setPenaltyPreview(response?.data || null)
      return { success: true, data: response?.data || null }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to preview penalties.'
      setError(message)
      setPenaltyPreview(null)
      return { success: false, message }
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const applyPenalties = useCallback(async ({ asOfDate }) => {
    try {
      setPreviewLoading(true)
      setError('')
      const response = await applyFinanceBillPenalties({ as_of_date: asOfDate })
      setPenaltyPreview(response?.data?.preview || response?.data || null)
      return { success: true, data: response?.data || null, message: response?.message }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to apply penalties.'
      setError(message)
      if (err?.response?.data?.data?.preview) {
        setPenaltyPreview(err.response.data.data.preview)
      }
      return { success: false, message, data: err?.response?.data?.data || null }
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  return {
    rule,
    penaltyPreview,
    loading,
    saving,
    previewLoading,
    error,
    loadRule,
    saveRule,
    previewPenalties,
    applyPenalties,
  }
}
