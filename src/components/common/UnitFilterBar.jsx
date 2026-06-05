import { Building2 } from 'lucide-react'
import {
  TENANT_TIME_RANGE_OPTIONS,
  useUnitFilter,
} from '@/context/UnitFilterContext'
import { useAuth } from '@/context/AuthContext'

export default function UnitFilterBar({ showTimeRange = false }) {
  const { user } = useAuth()
  const {
    selectedUnit,
    setSelectedUnit,
    selectedTimeRange,
    setSelectedTimeRange,
  } = useUnitFilter()

  const tenantUnits = Array.from(
    new Set(
      (Array.isArray(user?.tenants) ? user.tenants : [user?.tenant])
        .filter(Boolean)
        .map((tenant) => tenant?.unit?.unit_number || tenant?.unit?.name || '')
        .filter(Boolean)
    )
  )

  const showUnitFilter = tenantUnits.length > 1

  if (!showUnitFilter && !showTimeRange) return null

  return (
    <div
      data-print-hide="true"
      className="
        mb-1 flex flex-col gap-3
        rounded-2xl border border-blue-200 bg-blue-50 p-3.5
        dark:border-blue-700/50 dark:bg-blue-900/20
        lg:flex-row lg:items-center
      "
    >

      {/* LEFT - UNIT FILTER */}
      {showUnitFilter && (
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <Building2 className="h-4 w-4 flex-shrink-0 text-blue-500" />

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedUnit('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedUnit === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40'
              }`}
            >
              All Units
            </button>

            {tenantUnits.map((u) => (
              <button
                key={u}
                onClick={() => setSelectedUnit(u)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedUnit === u
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RIGHT - TIME RANGE FILTER */}
      {showTimeRange && (
        <div
          className="
            flex items-center gap-1.5
            flex-wrap
            ml-auto
          "
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {TENANT_TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedTimeRange === option.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}