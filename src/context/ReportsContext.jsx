import { createContext, useContext, useState } from 'react'
import initialReports from '@/data/reports.json'

const ReportsContext = createContext()

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState(initialReports)

  const addReport = (report) => {
    const newReport = {
      ...report,
      id: `RPT-${String(Date.now()).slice(-3).padStart(3, '0')}`,
      dateSubmitted: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'pending',
    }
    setReports(prev => [newReport, ...prev])
    return newReport
  }

  const updateReportStatus = (id, status) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  return (
    <ReportsContext.Provider value={{ reports, addReport, updateReportStatus }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  return useContext(ReportsContext)
}
