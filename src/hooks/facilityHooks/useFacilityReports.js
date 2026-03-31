import { useCallback, useEffect, useState } from 'react'
import { fetchFacilityReports } from '@/services/facilityService/facilityReportsService'

export function useFacilityReports() {
  const [reportTypes, setReportTypes] = useState([])
  const [dailyEnergy, setDailyEnergy] = useState([])
  const [monthlyWater, setMonthlyWater] = useState([])
  const [thermalDistribution, setThermalDistribution] = useState([])
  const [peakUsage, setPeakUsage] = useState([])
  const [summary, setSummary] = useState([])
  const [latestMeterReadings, setLatestMeterReadings] = useState([])
  const [overview, setOverview] = useState({
    totalMeters: 0,
    withRecentReading: 0,
    pendingApproval: 0,
    latestRecordedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchFacilityReports()
      const data = response?.data || {}
      setReportTypes(Array.isArray(data.report_types) ? data.report_types : [])
      setDailyEnergy(Array.isArray(data.daily_energy) ? data.daily_energy : [])
      setMonthlyWater(Array.isArray(data.monthly_water) ? data.monthly_water : [])
      setThermalDistribution(Array.isArray(data.thermal_distribution) ? data.thermal_distribution : [])
      setPeakUsage(Array.isArray(data.peak_usage) ? data.peak_usage : [])
      setSummary(Array.isArray(data.summary) ? data.summary : [])
      setLatestMeterReadings(Array.isArray(data.latest_meter_readings) ? data.latest_meter_readings : [])
      setOverview({
        totalMeters: Number(data?.overview?.total_meters || 0),
        withRecentReading: Number(data?.overview?.with_recent_reading || 0),
        pendingApproval: Number(data?.overview?.pending_approval || 0),
        latestRecordedAt: data?.overview?.latest_recorded_at || null,
      })
    } catch (err) {
      setReportTypes([])
      setDailyEnergy([])
      setMonthlyWater([])
      setThermalDistribution([])
      setPeakUsage([])
      setSummary([])
      setLatestMeterReadings([])
      setOverview({
        totalMeters: 0,
        withRecentReading: 0,
        pendingApproval: 0,
        latestRecordedAt: null,
      })
      setError(err?.response?.data?.message || err?.message || 'Failed to load facility reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  return {
    reportTypes,
    dailyEnergy,
    monthlyWater,
    thermalDistribution,
    peakUsage,
    summary,
    latestMeterReadings,
    overview,
    loading,
    error,
    reload: loadReports,
  }
}
