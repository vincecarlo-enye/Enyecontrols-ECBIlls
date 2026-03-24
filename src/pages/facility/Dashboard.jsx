/**
 * pages/facility/Dashboard.jsx
 * Refactored: useModalState replaces 4 separate useState modal booleans.
 * Grid cards standardised to rounded-2xl shadow-md.
 * React.memo applied to the heavy chart section.
 */

import { useState, memo } from 'react'
import { createPortal } from 'react-dom'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  Building2, Wrench, Zap, AlertTriangle, Droplets, Flame, Gauge,
  TrendingUp, X, Plus, Eye, Flag, CheckCircle2,
  Wifi, WifiOff, Bell, Activity, ShieldAlert, BarChart3,
} from 'lucide-react'
import DashboardCard from '@/components/ui/DashboardCard'
import ChartCard from '@/components/ui/ChartCard'
import { useModalState } from '@/hooks/useModalState'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityDashboardSkeleton } from '@/components/skeletons'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import facilityDashboardData from '@/data/facilityDashboard.json'

// ─── MOCK DATA (loaded from JSON) ─────────────────────────────────────────────
const ELEC        = facilityDashboardData.chartData.ELEC
const WATER       = facilityDashboardData.chartData.WATER
const THERMAL     = facilityDashboardData.chartData.THERMAL
const COMPARISON  = facilityDashboardData.chartData.COMPARISON
const INIT_UNITS   = facilityDashboardData.units
const INIT_ALERTS  = facilityDashboardData.alerts
const INIT_TICKETS = facilityDashboardData.maintenanceTickets
const TECHNICIANS  = facilityDashboardData.technicians
const TOOLTIP_STYLE = { borderRadius:12,border:'1px solid #e2e8f0',fontSize:12,boxShadow:'0 4px 20px rgba(0,0,0,0.08)',backgroundColor:'#fff' }

// ─── Style maps ───────────────────────────────────────────────────────────────
const UNIT_STATUS_CLS = {
  Normal:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'High Usage':'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  Warning:     'bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400',
}
const TICKET_STATUS_CLS = {
  Pending:      'bg-slate-100  text-slate-500  dark:bg-slate-800      dark:text-slate-400',
  'In Progress':'bg-violet-100 text-violet-700 dark:bg-violet-900/30  dark:text-violet-400',
  Resolved:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}
const ALERT_SEV_CLS   = { High:'border-l-rose-400 bg-rose-50/60 dark:bg-rose-900/10',   Medium:'border-l-amber-400 bg-amber-50/60 dark:bg-amber-900/10',  Low:'border-l-blue-400 bg-blue-50/60 dark:bg-blue-900/10' }
const ALERT_BADGE_CLS = { High:'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', Medium:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', Low:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
const ALERT_DOT_CLS   = { High:'bg-rose-500',Medium:'bg-amber-500',Low:'bg-blue-500' }

// ─── Shared modal shell ───────────────────────────────────────────────────────
function FacilityModal({ isOpen, onClose, title, children, maxWidth='max-w-lg' }) {
  if (!isOpen) return null
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-700/50 flex flex-col overflow-hidden animate-in`} style={{ maxHeight:'88svh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all'
const labelCls = 'block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5'
function Field({ label, children }) { return <div><label className={labelCls}>{label}</label>{children}</div> }

// ─── Memoised charts section ──────────────────────────────────────────────────
const FacilityCharts = memo(function FacilityCharts({ filter, elecData, waterData, thermalData, compData }) {
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Electricity Consumption" subtitle={`${filter} kWh · trend view`} accentHex="#f59e0b"
          badge={filter==='Daily'?'1,245 kWh':filter==='Monthly'?'17,991 kWh/mo':'178K kWh/yr'}
          badgeCls="font-mono text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={elecData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <defs><linearGradient id="gradElec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5}/>
              <XAxis dataKey="t" tick={{fontSize:10,fill:'#94a3b8'}}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>[`${v.toLocaleString()} kWh`,'Usage']}/>
              <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradElec)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Water Consumption" subtitle={`${filter} m³ · bar view`} accentHex="#06b6d4"
          badge={filter==='Daily'?'332 m³':filter==='Monthly'?'4,800 m³/mo':'49K m³/yr'}
          badgeCls="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waterData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5}/>
              <XAxis dataKey="t" tick={{fontSize:10,fill:'#94a3b8'}}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>[`${v.toLocaleString()} m³`,'Usage']}/>
              <Bar dataKey="v" fill="#06b6d4" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid lg:grid-cols-5 gap-4">
        <ChartCard className="lg:col-span-2" title="Thermal Energy" subtitle={`${filter} kBTU/h`} accentHex="#f43f5e"
          badge={filter==='Daily'?'748 kBTU/h':filter==='Monthly'?'12,400 kBTU/mo':'121K kBTU/yr'}
          badgeCls="font-mono text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={thermalData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5}/>
              <XAxis dataKey="t" tick={{fontSize:10,fill:'#94a3b8'}}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>[`${v.toLocaleString()} kBTU/h`,'Thermal']}/>
              <Line type="monotone" dataKey="v" stroke="#f43f5e" strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard className="lg:col-span-3" title="Utility Comparison" subtitle={`Electricity vs Water vs Thermal · ${filter}`} action={<BarChart3 className="w-4 h-4 text-slate-400"/>}>
          <ResponsiveContainer width="100%" height={232}>
            <BarChart data={compData} margin={{top:5,right:10,left:-10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5}/>
              <XAxis dataKey="t" tick={{fontSize:10,fill:'#94a3b8'}}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}}/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="electricity" fill="#f59e0b" radius={[4,4,0,0]} name="Electricity"/>
              <Bar dataKey="water"       fill="#06b6d4" radius={[4,4,0,0]} name="Water"/>
              <Bar dataKey="thermal"     fill="#f43f5e" radius={[4,4,0,0]} name="Thermal"/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
})

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FacilityDashboard() {
  const loading = usePageLoader(800)

  const [filter, setFilter]   = useState('Monthly')
  const [alerts,  setAlerts]  = useState(INIT_ALERTS)
  const [tickets, setTickets] = useState(INIT_TICKETS)
  const [units]               = useState(INIT_UNITS)

  // useModalState replaces 4× separate useState booleans
  const unitModal   = useModalState()
  const alertModal  = useModalState()
  const reportModal = useModalState()
  const [ticketModalOpen, setTicketModalOpen] = useState(false)

  const BLANK = { issue:'',location:'',technician:'Unassigned',priority:'Medium',notes:'' }
  const [ticketForm, setTicketForm] = useState(BLANK)
  const [ticketErr,  setTicketErr]  = useState({})
  const [reportForm, setReportForm] = useState({ desc:'', severity:'Medium' })

  if (loading) return <FacilityDashboardSkeleton />

  const elecData    = ELEC[filter]
  const waterData   = WATER[filter]
  const thermalData = THERMAL[filter]
  const compData    = COMPARISON[filter]

  const activeAlerts  = alerts.filter(a => !a.resolved)
  const pendingCount  = tickets.filter(t => t.status === 'Pending').length
  const inProgCount   = tickets.filter(t => t.status === 'In Progress').length
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length

  const SUMMARY_TOP = [
    { label:'Total Units',    value:'48',                         icon:Building2,  gradient:'from-blue-500 to-indigo-600',   shadow:'shadow-blue-500/25',   trend:'+2 this month',                             trendUp:true,  sub:'42 occupied · 6 vacant' },
    { label:'Active Meters',  value:'142',                        icon:Gauge,      gradient:'from-violet-500 to-purple-600', shadow:'shadow-violet-500/25', trend:'3 offline',                                 trendUp:false, sub:'138 online · 1 warning' },
    { label:'Maintenance',    value:String(pendingCount+inProgCount), icon:Wrench, gradient:'from-amber-500 to-orange-500',  shadow:'shadow-amber-500/25',  trend:`+${pendingCount} pending`,                  trendUp:true,  sub:`${pendingCount} pending · ${inProgCount} in progress` },
    { label:'Utility Alerts', value:String(activeAlerts.length),  icon:ShieldAlert,gradient:'from-rose-500 to-pink-600',    shadow:'shadow-rose-500/25',   trend:`${activeAlerts.filter(a=>a.severity==='High').length} critical`, trendUp:activeAlerts.length>0, sub:'Requires immediate review' },
  ]
  const SUMMARY_TODAY = [
    { label:'Electricity Today',value:'1,245 kWh', icon:Zap,      gradient:'from-yellow-400 to-amber-500',shadow:'shadow-yellow-500/25',trend:'↑ 6% vs yesterday', trendUp:true,  sub:'vs 1,174 kWh yesterday' },
    { label:'Water Today',      value:'332 m³',    icon:Droplets, gradient:'from-cyan-500 to-blue-500',  shadow:'shadow-cyan-500/25',  trend:'↓ 3% vs yesterday', trendUp:false, sub:'vs 342 m³ yesterday' },
    { label:'Thermal Energy',   value:'748 kBTU/h',icon:Flame,    gradient:'from-rose-400 to-red-500',   shadow:'shadow-rose-500/25',  trend:'↑ 11% above avg',   trendUp:true,  sub:'3F spike detected' },
  ]

  const resolveAlert = (id) => setAlerts(p => p.map(a => a.id===id ? { ...a,resolved:true } : a))

  const validateTicket = () => {
    const e = {}
    if (!ticketForm.issue.trim())    e.issue    = 'Required'
    if (!ticketForm.location.trim()) e.location = 'Required'
    setTicketErr(e)
    return !Object.keys(e).length
  }

  const submitTicket = () => {
    if (!validateTicket()) return
    setTickets(p => [{ ...ticketForm, id:`MNT-${String(Date.now()).slice(-3)}`, status:'Pending', updated:new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) }, ...p])
    setTicketForm(BLANK); setTicketErr({}); setTicketModalOpen(false)
  }

  const submitReport = () => {
    const row = reportModal.selectedItem
    if (!row || !reportForm.desc.trim()) return
    setTickets(p => [{ id:`MNT-${String(Date.now()).slice(-3)}`, issue:reportForm.desc, location:row.unit, technician:'Unassigned', priority:reportForm.severity, status:'Pending', updated:new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) }, ...p])
    setReportForm({ desc:'',severity:'Medium' }); reportModal.close()
  }

  const createTicketFromAlert = (alert) => {
    setTickets(p => [{ id:`MNT-${String(Date.now()).slice(-3)}`, issue:alert.msg, location:alert.location, technician:'Unassigned', priority:alert.severity, status:'Pending', updated:new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) }, ...p])
    resolveAlert(alert.id); alertModal.close()
  }

  const updateTicketStatus = (id, status) => setTickets(p => p.map(t => t.id===id ? { ...t,status } : t))

  return (
    <div className="section-gap animate-in pb-4">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500"/>Facility Dashboard</h1>
          <p className="muted-text mt-0.5">Real-time building operations &amp; utility monitoring</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live</span>
          </div>
          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {['Daily','Monthly','Yearly'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium transition-all ${filter===f?'bg-blue-600 text-white':'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI CARDS – standardised grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SUMMARY_TOP.map(({ label,value,icon,gradient,shadow,trend,trendUp,sub },i) => (
          <DashboardCard key={label} icon={icon} title={label} value={value} sub={sub} badge={trend} badgeUp={trendUp} gradient={gradient} glow={shadow} className={`stagger-${i+1} animate-in`}/>
        ))}
      </div>

      {/* TODAY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SUMMARY_TODAY.map(({ label,value,icon,gradient,shadow,trend,trendUp,sub },i) => (
          <DashboardCard key={label} icon={icon} title={label} value={value} sub={sub} badge={trend} badgeUp={trendUp} gradient={gradient} glow={shadow} className={`stagger-${i+1} animate-in`}/>
        ))}
      </div>

      {/* CHARTS – memoised */}
      <FacilityCharts filter={filter} elecData={elecData} waterData={waterData} thermalData={thermalData} compData={compData}/>

      {/* UNIT MONITORING TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Floor &amp; Unit Monitoring</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Live utility readings · highlighted rows require attention</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"/>Normal</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>High Usage</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"/>Warning</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Unit','Floor','Electricity (kWh)','Water (m³)','Thermal (kBTU/h)','Status','Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap ${h==='Actions'||h==='Status'?'text-center':'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {units.map(row => (
                <tr key={row.unit} className={`transition-colors ${row.status==='Warning'?'bg-rose-50/40 dark:bg-rose-900/10 hover:bg-rose-50 dark:hover:bg-rose-900/20':row.status==='High Usage'?'bg-amber-50/40 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20':'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.unit}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.floor}</td>
                  <td className={`px-4 py-3 font-mono tabular-nums ${row.elec>450?'text-amber-600 dark:text-amber-400 font-bold':'text-slate-700 dark:text-slate-200'}`}>{row.elec.toLocaleString()}</td>
                  <td className={`px-4 py-3 font-mono tabular-nums ${row.water>90?'text-rose-600 dark:text-rose-400 font-bold':'text-slate-700 dark:text-slate-200'}`}>{row.water}</td>
                  <td className={`px-4 py-3 font-mono tabular-nums ${row.thermal>300?'text-rose-600 dark:text-rose-400 font-bold':'text-slate-700 dark:text-slate-200'}`}>{row.thermal}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${UNIT_STATUS_CLS[row.status]}`}>
                      {row.status!=='Normal'&&<AlertTriangle className="w-3 h-3"/>}{row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => unitModal.open(row)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all whitespace-nowrap">
                        <Eye className="w-3 h-3"/> Details
                      </button>
                      <button onClick={() => reportModal.open(row)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all whitespace-nowrap">
                        <Flag className="w-3 h-3"/> Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALERTS + MAINTENANCE */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2"><Bell className="w-4 h-4 text-rose-500"/>Real-Time Alerts</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeAlerts.length} active · {alerts.filter(a=>a.resolved).length} resolved today</p>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight:440 }}>
            {alerts.map(alert => (
              <div key={alert.id} className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800 border-l-4 transition-opacity ${ALERT_SEV_CLS[alert.severity]} ${alert.resolved?'opacity-40':''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ALERT_DOT_CLS[alert.severity]}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ALERT_BADGE_CLS[alert.severity]}`}>{alert.severity}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.time}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{alert.msg}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{alert.location}</p>
                    {!alert.resolved && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button onClick={() => alertModal.open(alert)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all">
                          <Eye className="w-3 h-3"/>View Details
                        </button>
                        <button onClick={() => createTicketFromAlert(alert)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-all">
                          <Plus className="w-3 h-3"/>Create Ticket
                        </button>
                        <button onClick={() => resolveAlert(alert.id)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all">
                          <CheckCircle2 className="w-3 h-3"/>Resolve
                        </button>
                      </div>
                    )}
                    {alert.resolved && <p className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5"><CheckCircle2 className="w-3 h-3"/>Resolved</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-500"/>Recent Maintenance</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{tickets.length} tickets · {pendingCount} pending · {resolvedCount} resolved</p>
            </div>
            <button onClick={() => setTicketModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5"/>

              <span className="hidden sm:inline">Create Ticket</span>
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight:380 }}>
            <table className="w-full text-xs min-w-[560px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur border-b border-slate-100 dark:border-slate-800">
                <tr>{['ID','Issue','Location','Technician','Status','Updated'].map(h=>(
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{t.id}</td>
                    <td className="px-4 py-3 max-w-[150px]"><p className="truncate font-medium text-slate-700 dark:text-slate-200">{t.issue}</p></td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.location}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.technician}</td>
                    <td className="px-4 py-3">
                      <select value={t.status} onChange={e => updateTicketStatus(t.id,e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border-0 outline-none cursor-pointer ${TICKET_STATUS_CLS[t.status]}`}>
                        <option>Pending</option><option>In Progress</option><option>Resolved</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{t.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            {[{label:'Pending',count:pendingCount,cls:'text-slate-500'},{label:'In Progress',count:inProgCount,cls:'text-violet-600 dark:text-violet-400'},{label:'Resolved',count:resolvedCount,cls:'text-emerald-600 dark:text-emerald-400'}].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
                <span className={`font-bold text-sm ${s.cls}`}>{s.count}</span>
                <span className="text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODALS (via useModalState) ─────────────────────────────────────────── */}

      {/* Unit Detail */}
      <FacilityModal isOpen={unitModal.isOpen} onClose={unitModal.close} title={unitModal.selectedItem?`Unit Details — ${unitModal.selectedItem.unit}`:''}>
        {unitModal.selectedItem && (() => { const row = unitModal.selectedItem; return (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${UNIT_STATUS_CLS[row.status]}`}>
                {row.status!=='Normal'&&<AlertTriangle className="w-4 h-4"/>}{row.status}
              </span>
              <span className="text-sm text-slate-400">{row.floor} · {row.unit}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{label:'Electricity',value:`${row.elec} kWh`,icon:Zap,color:'from-amber-400 to-orange-500',alert:row.elec>450},{label:'Water',value:`${row.water} m³`,icon:Droplets,color:'from-cyan-400 to-blue-500',alert:row.water>90},{label:'Thermal',value:`${row.thermal} kBTU/h`,icon:Flame,color:'from-rose-400 to-pink-500',alert:row.thermal>300}].map(({label,value,icon:Icon,color,alert})=>(
                <div key={label} className={`rounded-2xl p-4 border ${alert?'border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-700/30':'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'}`}>
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 shadow-sm`}><Icon className="w-4 h-4 text-white"/></div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
                  <p className={`text-base font-bold mt-0.5 ${alert?'text-rose-600 dark:text-rose-400':'text-slate-800 dark:text-white'}`}>{value}</p>
                  {alert&&<p className="text-[10px] text-rose-500 mt-0.5">Above threshold</p>}
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"><p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Meter Info</p></div>
              {[{label:'Electric Meter',id:`ME-${row.unit.replace('Unit ','')}`,online:true},{label:'Water Meter',id:`MW-${row.unit.replace('Unit ','')}`,online:row.water<=90},{label:'Thermal Sensor',id:`TS-${row.floor}`,online:row.thermal<=300}].map(m=>(
                <div key={m.label} className="flex items-center justify-between px-4 py-2.5 text-sm border-b last:border-0 border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-700 dark:text-slate-200">{m.id}</span>
                    {m.online?<span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400"><Wifi className="w-3 h-3"/>Online</span>:<span className="flex items-center gap-1 text-[10px] text-rose-500"><WifiOff className="w-3 h-3"/>Offline</span>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { reportModal.open(row); unitModal.close() }} className="w-full py-2.5 rounded-xl text-sm font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
              <Flag className="w-4 h-4"/>Report Issue for this Unit
            </button>
          </div>
        )})()}
      </FacilityModal>

      {/* Alert Detail */}
      <FacilityModal isOpen={alertModal.isOpen} onClose={alertModal.close} title="Alert Details">
        {alertModal.selectedItem && (() => { const a = alertModal.selectedItem; return (
          <div className="space-y-4">
            <div className={`rounded-xl border px-4 py-3 ${ALERT_SEV_CLS[a.severity]} border-l-4`}>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ALERT_BADGE_CLS[a.severity]}`}>{a.severity} Severity</span>
              <p className="font-semibold text-slate-800 dark:text-white mt-2">{a.msg}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{a.location}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">{a.time}</p>
            </div>
            {!a.resolved && (
              <div className="flex gap-3 pt-1">
                <button onClick={() => { resolveAlert(a.id); alertModal.close() }} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/>Mark Resolved
                </button>
                <button onClick={() => createTicketFromAlert(a)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4"/>Create Ticket
                </button>
              </div>
            )}
          </div>
        )})()}
      </FacilityModal>

      {/* Report Issue */}
      <FacilityModal isOpen={reportModal.isOpen} onClose={reportModal.close} title={reportModal.selectedItem?`Report Issue — ${reportModal.selectedItem.unit}`:''}>
        {reportModal.selectedItem && (() => { const row = reportModal.selectedItem; return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center text-xs">
              {[{label:'Electricity',val:`${row.elec} kWh`,hi:row.elec>450},{label:'Water',val:`${row.water} m³`,hi:row.water>90},{label:'Thermal',val:`${row.thermal} kBTU/h`,hi:row.thermal>300}].map(c=>(
                <div key={c.label}><p className="text-slate-400 mb-0.5">{c.label}</p><p className={`font-bold ${c.hi?'text-rose-600 dark:text-rose-400':'text-slate-700 dark:text-slate-200'}`}>{c.val}</p></div>
              ))}
            </div>
            <Field label="Issue Description *">
              <textarea value={reportForm.desc} onChange={e=>setReportForm(p=>({...p,desc:e.target.value}))} rows={3} placeholder="Describe the issue clearly..." className={`${inputCls} resize-none`}/>
            </Field>
            <Field label="Severity">
              <select value={reportForm.severity} onChange={e=>setReportForm(p=>({...p,severity:e.target.value}))} className={inputCls}>
                {['Low','Medium','High'].map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="flex gap-3 pt-1">
              <button onClick={reportModal.close} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={submitReport} disabled={!reportForm.desc.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-lg shadow-blue-500/25 transition-all">Submit Report</button>
            </div>
          </div>
        )})()}
      </FacilityModal>

      {/* Announcements */}
      <AnnouncementPanel />

      {/* Create Ticket */}
      <FacilityModal isOpen={ticketModalOpen} onClose={() => { setTicketModalOpen(false); setTicketErr({}) }} title="Create Maintenance Ticket">
        <div className="space-y-4">
          <Field label="Issue Title *">
            <input value={ticketForm.issue} onChange={e=>setTicketForm(p=>({...p,issue:e.target.value}))} placeholder="e.g., Water leak detected in Unit 203" className={`${inputCls} ${ticketErr.issue?'border-red-400':''}`}/>
            {ticketErr.issue&&<p className="text-xs text-red-500 mt-1">{ticketErr.issue}</p>}
          </Field>
          <Field label="Location *">
            <input value={ticketForm.location} onChange={e=>setTicketForm(p=>({...p,location:e.target.value}))} placeholder="e.g., Unit 203, 2nd Floor" className={`${inputCls} ${ticketErr.location?'border-red-400':''}`}/>
            {ticketErr.location&&<p className="text-xs text-red-500 mt-1">{ticketErr.location}</p>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assign Technician">
              <select value={ticketForm.technician} onChange={e=>setTicketForm(p=>({...p,technician:e.target.value}))} className={inputCls}>
                {TECHNICIANS.map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={ticketForm.priority} onChange={e=>setTicketForm(p=>({...p,priority:e.target.value}))} className={inputCls}>
                {['Low','Medium','High','Critical'].map(p=><option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea value={ticketForm.notes} onChange={e=>setTicketForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Additional details..." className={`${inputCls} resize-none`}/>
          </Field>
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setTicketModalOpen(false); setTicketErr({}) }} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">Cancel</button>
            <button onClick={submitTicket} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">Create Ticket</button>
          </div>
        </div>
      </FacilityModal>

    </div>
  )
}
