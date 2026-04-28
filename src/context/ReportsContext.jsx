/**
 * ReportsContext — API-backed replacement for the previous mock version.
 *
 * The previous version seeded local state from reports.json and performed
 * all CRUD in-memory only (changes were lost on page refresh).
 *
 * The TenantRequest model + table already exists in the database. Any page
 * that needs reports/requests should call the API directly via a dedicated
 * service file (e.g. services/tenantService/tenantRequestService.js).
 *
 * This context is retained as a structural stub so no existing import breaks,
 * but it no longer loads mock data.
 */
import { createContext, useContext } from 'react'

const ReportsContext = createContext({
  reports: [],
  addReport: () => null,
  updateReportStatus: () => null,
})

/**
 * Provider is a no-op wrapper retained for structural compatibility.
 * Pages that need report data should call the backend API directly.
 */
export function ReportsProvider({ children }) {
  return (
    <ReportsContext.Provider value={{ reports: [], addReport: () => null, updateReportStatus: () => null }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  return useContext(ReportsContext)
}
