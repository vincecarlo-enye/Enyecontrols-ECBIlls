import { useState } from 'react'
import { Zap, Droplets, Flame, Receipt, CalendarClock, Upload } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantDashboardSkeleton } from '@/components/skeletons'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ReceiptUploadModal from '@/components/billing/ReceiptUploadModal'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import TenantUtilityRates from '@/pages/tenant/UtilityRates'
import DashboardCard from '@/components/ui/DashboardCard'
import utilitiesData from '@/data/mock/utilities.json'
const { tenantBills: ALL_TENANT_BILLS } = utilitiesData

export default function TenantDashboard() {
  const loading = usePageLoader(700)
  const { user } = useAuth()
  const { addToast, updateBillStatus, submitPaymentReceipt, bills } = useApp()
  const { selectedUnit } = useUnitFilter()
  const [viewBill, setViewBill] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [payBill, setPayBill] = useState(null)
  const [payModalOpen, setPayModalOpen] = useState(false)

  if (loading) return <TenantDashboardSkeleton />

  // Filter bills – tenant only sees published/submitted/paid/overdue
  const VISIBLE = ['published', 'payment_submitted', 'paid', 'overdue']
  const allBillsFiltered = bills.filter(b => VISIBLE.includes(b.status))
  const unitBills = selectedUnit === 'all' ? allBillsFiltered : allBillsFiltered.filter(b => b.unit === selectedUnit)
  const recentBills = [...unitBills]
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
    .slice(0, 7)
  const currentBill = unitBills.find(b => b.status === 'published') || unitBills[0] || bills[0]

  const e = currentBill?.breakdown?.electricity || 0
  const w = currentBill?.breakdown?.water || 0
  const t = currentBill?.breakdown?.thermal || 0

  const unitLabel = selectedUnit === 'all' ? 'All Units' : `Unit ${selectedUnit}`

  const stats = [
    { label:'Current Bill',  value: currentBill ? `₱${currentBill.amount.toLocaleString()}` : '—', sub: currentBill ? 'Due '+currentBill.dueDate : '', icon:Receipt,      grad:'from-blue-500 to-blue-600',  glow:'shadow-blue-500/20' },
    { label:'Electricity',   value:`${(e/10.99).toFixed(0)} kWh`,              sub:'This billing period',       icon:Zap,          grad:'from-amber-500 to-amber-600', glow:'shadow-amber-500/20' },
    { label:'Water',         value:`${(w/30).toFixed(1)} m³`,                  sub:'This billing period',       icon:Droplets,     grad:'from-cyan-500 to-cyan-600',   glow:'shadow-cyan-500/20' },
    { label:'Thermal',       value:`${(t/11).toFixed(0)} kBTU/h`,              sub:'This billing period',       icon:Flame,        grad:'from-rose-500 to-rose-600',   glow:'shadow-rose-500/20' },
    { label:'Due Date',      value: currentBill?.dueDate?.split(',')[0] || '—', sub: currentBill?.status === 'published' ? 'Payment due' : 'Paid on time', icon:CalendarClock, grad:'from-indigo-500 to-indigo-600', glow:'shadow-indigo-500/20' },
  ]

  const openBill = (bill) => { setViewBill(bill); setModalOpen(true) }
  const openPayModal = (bill) => { setPayBill(bill); setPayModalOpen(true) }

  const handleReceiptSubmit = (billId, receiptData) => {
    submitPaymentReceipt(billId, receiptData)
    setPayModalOpen(false)
  }

  return (
    <div className="section-gap animate-in">
      {/* Welcome */}
      <div>
        <h1 className="page-title">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="muted-text mt-0.5">
          {user?.company} · Here's your billing summary · {unitLabel}
        </p>
      </div>

      <UnitFilterBar />

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <DashboardCard
            key={s.label}
            icon={s.icon}
            title={s.label}
            value={s.value}
            sub={s.sub}
            gradient={s.grad}
            glow={s.glow}
            className={`stagger-${i+1} animate-in`}
          />
        ))}
      </div>

      <TenantUtilityRates />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent Bills */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">My Recent Bills</h2>
            <p className="text-xs text-slate-400 mt-0.5">{unitLabel} billing history</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{minWidth:'480px'}}>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                  {['Unit','Month','Period','Amount','Status',''].map(col => (
                    <th key={col} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap">{col}</th>
                  ))}
                  
                </tr>
              </thead>
              <tbody>
                {recentBills.map(bill => {
                  return (
                    <tr key={bill.id} className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 table-row-hover">
                      <td className="px-4 py-3.5 text-xs font-mono text-blue-600 dark:text-blue-400">{bill.unit}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{bill.billingPeriod}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">₱{bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <BillStatusBadge status={bill.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openBill(bill)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View Bill">
                            <Receipt className="w-4 h-4"/>
                          </button>
                          {bill.status === 'published' && (
                            <button onClick={() => openPayModal(bill)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-all" title="Upload Receipt">
                              <Upload className="w-3 h-3" /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements */}
        <div className="lg:col-span-2">
          <AnnouncementPanel />
        </div>
      </div>

      <BillViewerModal bill={viewBill} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ReceiptUploadModal
        bill={payBill}
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSubmit={handleReceiptSubmit}
      />
    </div>
  )
}
