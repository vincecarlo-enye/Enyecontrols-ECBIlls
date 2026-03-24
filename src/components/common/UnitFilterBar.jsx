import { Building2 } from 'lucide-react'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { useAuth } from '@/context/AuthContext'

// Map tenant IDs to their units
const TENANT_UNITS_MAP = {
  'T-001': ['12F-A', '12F-B'],
}

export default function UnitFilterBar() {
  const { user } = useAuth()
  const { selectedUnit, setSelectedUnit } = useUnitFilter()

  const tenantUnits = user?.tenantId ? TENANT_UNITS_MAP[user.tenantId] || [] : []
  if (tenantUnits.length <= 1) return null

  return (
    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 mb-1">
      <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Viewing Unit:</span>
      <div className="flex items-center gap-1.5 ml-1">
        <button
          onClick={() => setSelectedUnit('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${selectedUnit === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40'}`}
        >
          All Units
        </button>
        {tenantUnits.map(u => (
          <button
            key={u}
            onClick={() => setSelectedUnit(u)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${selectedUnit === u ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40'}`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  )
}
