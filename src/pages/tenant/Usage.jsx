import { useState, useEffect } from 'react'
import { Zap, Droplets, Flame, Wifi } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import tenantUsageData from '@/data/tenantUsage.json'

// Generate 24-hour mock data
function genHourly() {
  return Array.from({ length: 24 }, (_, h) => {
    const isDay = h >= 6 && h <= 21
    const base  = isDay ? 1.8 : 0.6
    return {
      time: `${String(h).padStart(2,'0')}:00`,
      electric: parseFloat((base + Math.random() * 1.6).toFixed(2)),
      water:    parseFloat((0.05 + Math.random() * 0.4).toFixed(2)),
      thermal:  parseFloat((base * 2.1 + Math.random() * 1.5).toFixed(2)),
    }
  })
}

const DAILY   = tenantUsageData.daily
const MONTHLY = tenantUsageData.monthly

const ttStyle = {
  contentStyle: { background:'rgba(255,255,255,0.97)', border:'1px solid rgba(226,232,240,0.8)', borderRadius:'10px', fontSize:'12px' },
}

export default function TenantUsage() {
  const loading = usePageLoader(700)
  const [hourly, setHourly] = useState(() => genHourly())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [tab, setTab] = useState('hourly')

  // Live update every 5 seconds — must be unconditional (Rules of Hooks)
  useEffect(() => {
    if (loading) return  // skip intervals while skeleton is showing
    const dataTimer = setInterval(() => {
      setHourly(prev => {
        const updated = [...prev]
        // randomly update 2-3 rows
        for (let i = 0; i < 3; i++) {
          const idx = Math.floor(Math.random() * 24)
          const isDay = idx >= 6 && idx <= 21
          const base = isDay ? 1.8 : 0.6
          updated[idx] = {
            ...updated[idx],
            electric: parseFloat((base + Math.random() * 1.6).toFixed(2)),
            water:    parseFloat((0.05 + Math.random() * 0.4).toFixed(2)),
            thermal:  parseFloat((base * 2.1 + Math.random() * 1.5).toFixed(2)),
          }
        }
        return updated
      })
      setSecondsAgo(0)
    }, 1000)

    const tickTimer = setInterval(() => setSecondsAgo(s => s + 1), 1000)

    return () => { clearInterval(dataTimer); clearInterval(tickTimer) }
  }, [loading])

  if (loading) return <FacilityPageSkeleton />

  const totalE = hourly.reduce((a,r) => a + r.electric, 0).toFixed(2)
  const totalW = hourly.reduce((a,r) => a + r.water,    0).toFixed(2)
  const totalT = hourly.reduce((a,r) => a + r.thermal,  0).toFixed(2)

  const summaryCards = [
    { label:'Daily Electric', value:`${totalE} kWh`, icon:Zap,      grad:'from-amber-500 to-amber-600', glow:'shadow-amber-500/20' },
    { label:'Daily Water',    value:`${totalW} m³`,  icon:Droplets, grad:'from-cyan-500 to-cyan-600',   glow:'shadow-cyan-500/20' },
    { label:'Daily Thermal',  value:`${totalT} kBTU`,icon:Flame,    grad:'from-rose-500 to-rose-600',   glow:'shadow-rose-500/20' },
  ]

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">Usage Monitoring</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time utility consumption for your unit</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Live · Updated {secondsAgo}s ago
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`glass rounded-2xl p-4 shadow-lg ${s.glow} card-hover stagger-${i+1} animate-in`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Today's total</p>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" strokeWidth={2}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {['hourly','daily','monthly'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${tab===t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Hourly tab */}
      {tab === 'hourly' && (
        <>
          <div className="glass rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-1">Hourly Consumption — Today</h2>
            <p className="text-xs text-slate-400 mb-4">Live-updating chart — refreshes every 5 seconds</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={hourly} margin={{top:5,right:8,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)"/>
                <XAxis dataKey="time" tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false} interval={3}/>
                <YAxis tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip {...ttStyle}/>
                <Legend wrapperStyle={{fontSize:'11px'}}/>
                <Line type="monotone" dataKey="electric" stroke="#f59e0b" strokeWidth={2} dot={false} name="Electric (kWh)"/>
                <Line type="monotone" dataKey="water"    stroke="#06b6d4" strokeWidth={2} dot={false} name="Water (m³)"/>
                <Line type="monotone" dataKey="thermal"  stroke="#f43f5e" strokeWidth={2} dot={false} name="Thermal (kBTU)"/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Hourly Data Table</h2>
            </div>
            <div className="overflow-auto max-h-72">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/60">
                    {['Time','Electric (kWh)','Water (m³)','Thermal (kBTU)'].map(col => (
                      <th key={col} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hourly.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">{row.time}</td>
                      <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-mono text-xs">{row.electric}</td>
                      <td className="px-4 py-2.5 text-cyan-600 dark:text-cyan-400 font-mono text-xs">{row.water}</td>
                      <td className="px-4 py-2.5 text-rose-600 dark:text-rose-400 font-mono text-xs">{row.thermal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Daily tab */}
      {tab === 'daily' && (
        <div className="glass rounded-2xl p-5 shadow-lg">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-1">Daily Totals — This Week</h2>
          <p className="text-xs text-slate-400 mb-4">Consumption breakdown per day</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DAILY} barSize={16} barGap={3} margin={{top:5,right:8,left:-18,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)"/>
              <XAxis dataKey="day" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip {...ttStyle}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              <Bar dataKey="electric" name="Electric (kWh)" fill="#f59e0b" radius={[4,4,0,0]}/>
              <Bar dataKey="water"    name="Water (m³)"     fill="#06b6d4" radius={[4,4,0,0]}/>
              <Bar dataKey="thermal"  name="Thermal (kBTU)" fill="#f43f5e" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly tab */}
      {tab === 'monthly' && (
        <div className="glass rounded-2xl p-5 shadow-lg">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-1">Monthly Totals — Last 6 Months</h2>
          <p className="text-xs text-slate-400 mb-4">Consumption trend over time</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MONTHLY} barSize={16} barGap={3} margin={{top:5,right:8,left:-18,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)"/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip {...ttStyle}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              <Bar dataKey="electric" name="Electric (kWh)" fill="#f59e0b" radius={[4,4,0,0]}/>
              <Bar dataKey="water"    name="Water (m³)"     fill="#06b6d4" radius={[4,4,0,0]}/>
              <Bar dataKey="thermal"  name="Thermal (kBTU)" fill="#f43f5e" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
