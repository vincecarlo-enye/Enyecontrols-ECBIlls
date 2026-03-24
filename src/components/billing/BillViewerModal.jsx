import { useRef } from "react"
import html2pdf from "html2pdf.js"
import Modal from '@/components/ui/Modal'
import { Printer, Download, Building2, Zap, Droplets, Flame, CheckCircle2, XCircle, Clock } from 'lucide-react'

const ICONS = { Electricity: Zap, Water: Droplets, 'Thermal Energy': Flame }

const STATUS_CFG = {
  paid:    { label:'PAID',    badge:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon:CheckCircle2 },
  unpaid:  { label:'UNPAID',  badge:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 Icon:XCircle },
  pending: { label:'PENDING', badge:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         Icon:Clock },
}

function buildDetail(bill) {
  const elec = bill.breakdown?.electricity ?? 0
  const water = bill.breakdown?.water ?? 0
  const therm = bill.breakdown?.thermal ?? 0
  const sub = elec + water + therm
  const tax = Math.round(sub * 0.12)
  return {
    invoiceNo: bill.id,
    tenantName: bill.tenant,
    unit: bill.unit,
    billDate: (bill.dueDate || '').replace('March 15', 'March 6') || 'March 6, 2026',
    dueDate: bill.dueDate || '—',
    billingPeriod: bill.billingPeriod || '—',
    status: bill.status || 'unpaid',
    charges: [
      { particular:'Electricity',    used:`${(elec/10.99).toFixed(1)} kWh`,    prev:'342,210', curr:String(342210+Math.round(elec/10.99)),   rate:'₱10.99/kWh',  amount:elec  },
      { particular:'Water',          used:`${(water/30).toFixed(1)} m³`,       prev:'8,420',   curr:String(8420+Math.round(water/30)),        rate:'₱30.00/m³',   amount:water },
      { particular:'Thermal Energy', used:`${(therm/11).toFixed(1)} kBTU/h`,   prev:'12,340',  curr:String(12340+Math.round(therm/11)),       rate:'₱11.00/kBTU', amount:therm },
    ],
    subtotal: sub, tax, grandTotal: sub + tax,
  }
}

function BillContent({ bill }) {
  const pdfRef = useRef(null)
  const d = buildDetail(bill)
  const st = STATUS_CFG[d.status] || STATUS_CFG.unpaid

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=860,height=1000')
    w.document.write(`<!DOCTYPE html><html><head>
      <title>SOA_${d.tenantName}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:system-ui,sans-serif;font-size:13px;color:#1e293b;padding:28px;line-height:1.5}
        .hdr{background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;padding:18px 22px;border-radius:12px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center}
        .hdr h1{font-size:16px;font-weight:700}.hdr p{font-size:11px;opacity:.75;margin-top:2px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px}
        .section{background:#f8fafc;border-radius:10px;padding:14px}
        .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;font-weight:700;margin-bottom:10px}
        .kv{display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px}
        .kv .k{color:#64748b}.kv .v{font-weight:600;text-align:right}
        table{width:100%;border-collapse:collapse;margin-bottom:14px}
        th{font-size:9px;text-transform:uppercase;color:#94a3b8;padding:8px 10px;border-bottom:2px solid #e2e8f0;text-align:left}
        td{padding:9px 10px;border-bottom:1px solid #f1f5f9;font-size:12px}
        .ar{text-align:right;font-weight:700}
        .sum{background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px}
        .sr{display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:5px}
        .tot{background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
        .foot{margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.8}
        @media print{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      </style>
    </head><body>
      <div class="hdr"><div><h1>SmartBuild Tower</h1><p>Official Statement of Account</p></div><div style="text-align:right"><p style="font-weight:700;font-size:14px">${d.invoiceNo}</p><p style="opacity:.75;font-size:11px">Bill Date: ${d.billDate}</p></div></div>
      <div class="grid2">
        <div class="section"><p class="lbl">Account Information</p><div class="kv"><span class="k">Tenant</span><span class="v">${d.tenantName}</span></div><div class="kv"><span class="k">Unit</span><span class="v">${d.unit}</span></div><div class="kv"><span class="k">Invoice No.</span><span class="v">${d.invoiceNo}</span></div></div>
        <div class="section"><p class="lbl">Bill Details</p><div class="kv"><span class="k">Bill Date</span><span class="v">${d.billDate}</span></div><div class="kv"><span class="k">Due Date</span><span class="v">${d.dueDate}</span></div><div class="kv"><span class="k">Period</span><span class="v">${d.billingPeriod}</span></div></div>
      </div>
      <p class="lbl">Utility Charges</p>
      <table><thead><tr><th>Description</th><th>Prev Reading</th><th>Curr Reading</th><th>Consumption</th><th>Rate</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${d.charges.map(c=>`<tr><td><strong>${c.particular}</strong></td><td>${c.prev}</td><td>${c.curr}</td><td>${c.used}</td><td>${c.rate}</td><td class="ar">₱${c.amount.toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr>`).join('')}</tbody></table>
      <div class="sum"><p class="lbl">Summary</p><div class="sr"><span>Subtotal</span><span>₱${d.subtotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div><div class="sr"><span>VAT (12%)</span><span>₱${d.tax.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div><div class="sr"><span>Previous Balance</span><span>₱0.00</span></div></div>
      <div class="tot"><div><p style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.1em">Total Amount Due</p><p style="font-size:11px;opacity:.7;margin-top:3px">Due by ${d.dueDate}</p></div><span style="font-size:22px;font-weight:800">₱${d.grandTotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>
      <div class="foot"><p>Pay at any authorized payment center or via bank transfer to SmartBuild Tower Management (BDO #1234-5678-90).</p><p><strong>billing@smartbuild.ph</strong> · +63 2 8888 0000</p></div>
    </body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 600)
  }

  const handleDownload = () => {
    const rows = [
      ['Enyecontrols — Statement of Account'], [],
      ['Invoice No.', d.invoiceNo], ['Tenant', d.tenantName], ['Unit', d.unit],
      ['Bill Date', d.billDate], ['Due Date', d.dueDate], ['Period', d.billingPeriod], ['Status', d.status.toUpperCase()], [],
      ['UTILITY CHARGES'], ['Description','Prev','Curr','Consumption','Rate','Amount'],
      ...d.charges.map(c=>[c.particular,c.prev,c.curr,c.used,c.rate,`₱${c.amount.toLocaleString()}`]),
      [], ['Subtotal','','','','',`₱${d.subtotal.toLocaleString()}`],
      ['VAT 12%','','','','',`₱${d.tax.toLocaleString()}`],
      ['TOTAL AMOUNT DUE','','','','',`₱${d.grandTotal.toLocaleString()}`],
    ]
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    Object.assign(document.createElement('a'),{href:url,download:`SOA_${d.tenantName.replace(/\s+/g,'_')}.csv`}).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div ref={pdfRef} className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-white/80 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm">Enyecontrols</p>
              <p className="text-xs text-white/70">Official Statement of Account</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${st.badge}`}>
              <st.Icon className="w-3 h-3" />{st.label}
            </span>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors">
              <Printer className="w-3.5 h-3.5" />Print
            </button>
            <button onClick={handleDownload} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors">
              <Download className="w-3.5 h-3.5" />Download
            </button>
          </div>
        </div>
      </div>

      {/* Info grid — stacks on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">Account Information</p>
          <div className="space-y-2">
            {[['Tenant', d.tenantName],['Unit', d.unit],['Invoice No.', d.invoiceNo]].map(([k,v])=>(
              <div key={k} className="flex justify-between gap-2">
                <span className="text-xs text-slate-400 flex-shrink-0">{k}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-right break-all">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">Bill Details</p>
          <div className="space-y-2">
            {[['Bill Date', d.billDate],['Due Date', d.dueDate],['Period', d.billingPeriod]].map(([k,v])=>(
              <div key={k} className="flex justify-between gap-2">
                <span className="text-xs text-slate-400 flex-shrink-0">{k}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charges — horizontal scroll */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Utility Charges</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs" style={{minWidth:'500px'}}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                {['Description','Prev','Current','Consumption','Rate','Amount'].map(h=>(
                  <th key={h} className="text-left font-mono uppercase text-slate-400 px-3 py-2.5 last:text-right whitespace-nowrap" style={{fontSize:'9px',letterSpacing:'.07em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.charges.map(c=>{
                const CIcon = ICONS[c.particular]
                return (
                  <tr key={c.particular} className="border-b border-slate-100 dark:border-slate-700/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {CIcon && <CIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/>}
                        <span className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{c.particular}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-500 dark:text-slate-400">{c.prev}</td>
                    <td className="px-3 py-3 font-mono text-slate-500 dark:text-slate-400">{c.curr}</td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.used}</td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.rate}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">₱{c.amount.toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">Summary</p>
        <div className="space-y-2">
          {[['Subtotal',d.subtotal],['VAT (12%)',d.tax],['Previous Balance',0],['Payments Received',0]].map(([l,v])=>(
            <div key={l} className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{l}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">₱{Number(v).toLocaleString('en-PH',{minimumFractionDigits:2})}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">Total Amount Due</p>
          <p className="text-xs text-white/70 mt-0.5">Due by {d.dueDate}</p>
        </div>
        <p className="text-white font-bold text-xl sm:text-2xl whitespace-nowrap">₱{d.grandTotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</p>
      </div>

      {/* Footer note */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-400 leading-relaxed">
        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Payment Instructions</p>
        <p>Pay at any authorized payment center or via bank transfer to Enyecontrols Management (BDO #1234-5678-90). Inquiries: <span className="text-slate-500">billing@enye.ph</span> · +63 2 8888 0000</p>
      </div>
    </div>
  )
}

// Keep lastBill in a ref so content doesn't disappear mid-close-animation
export default function BillViewerModal({ bill, isOpen, onClose }) {
  const lastRef = useRef(null)
  if (bill) lastRef.current = bill
  const shown = bill ?? lastRef.current

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title="Statement of Account"
      subtitle={shown ? `Invoice ${shown.id}` : ''}
    >
      {shown && <BillContent bill={shown} />}
    </Modal>
  )
}
