import{e as m}from"./exportCsv-sjmfDSMG.js";function b(i,r){i.querySelectorAll(r).forEach(n=>n.remove())}function u(i){b(i,["script","style","button","input","select","textarea","form",'[role="button"]','[data-print-hide="true"]',".no-print",".sr-only"].join(", "))}function g(i){var p;const r=i.closest("section, article, div");if(!r)return"";const n=r.querySelector("h1, h2, h3, h4, h5, h6");return(p=n==null?void 0:n.textContent)!=null&&p.trim()?n.textContent.trim():Array.from(r.querySelectorAll("p, span")).map(e=>{var a;return((a=e.textContent)==null?void 0:a.replace(/\s+/g," ").trim())||""}).filter(Boolean).find(e=>e.length<=80)||""}function h(i){i.querySelectorAll("table").forEach(r=>{const n=Array.from(r.rows||[]);if(n.length===0)return;const o=n.find(e=>e.querySelector("th"));if(!o)return;const p=Array.from(o.cells||[]).map((e,a)=>{var t;return{index:a,label:((t=e.textContent)==null?void 0:t.trim().toLowerCase())||""}}).filter(({label:e})=>["action","actions","controls","options"].includes(e)).map(({index:e})=>e).sort((e,a)=>a-e);p.length!==0&&n.forEach(e=>{p.forEach(a=>{var t;(t=e.cells)!=null&&t[a]&&e.deleteCell(a)})})})}function f(i){var n;const r=Array.from(i.querySelectorAll("div, section, article, aside, header, footer, label"));for(let o=r.length-1;o>=0;o-=1){const p=r[o];if(!p.isConnected)continue;const e=p.querySelector("table, thead, tbody, tr, td, th, img, svg, canvas, ul, ol, li, p, h1, h2, h3, h4, h5, h6"),a=((n=p.textContent)==null?void 0:n.replace(/\s+/g," ").trim())||"";!e&&!a&&p.remove()}}function x(i){const r=Array.from(i.querySelectorAll("table"));if(r.length===0)return i;const n=document.createElement("div");return r.forEach((o,p)=>{const e=document.createElement("section");e.className="print-table-block";const a=g(o);if(a){const t=document.createElement("h2");t.className="print-table-title",t.textContent=a,e.appendChild(t)}if(e.appendChild(o.cloneNode(!0)),n.appendChild(e),p<r.length-1){const t=document.createElement("div");t.className="print-table-spacer",n.appendChild(t)}}),n}function y(i,r="tables"){const n=i.cloneNode(!0);return u(n),r==="full"||r==="visual"?(f(n),n):(b(n,["svg","canvas","img"].join(", ")),h(n),f(n),x(n))}function v(){return Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style')).map(i=>i.outerHTML).join(`
`)}function w(i,r=[]){if(!Array.isArray(r)||r.length===0)return!1;const n=r.map(l=>l&&typeof l=="object"&&!Array.isArray(l)?l:{value:l}),o=Array.from(n.reduce((l,d)=>(Object.keys(d).forEach(c=>l.add(c)),l),new Set));if(o.length===0)return!1;const p=[o.map(m).join(","),...n.map(l=>o.map(d=>m(l[d])).join(","))].join(`\r
`),e=new Blob([p],{type:"text/csv;charset=utf-8;"}),a=URL.createObjectURL(e),t=document.createElement("a");return t.href=a,t.setAttribute("download",i),document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(a),!0}function A({title:i,subtitle:r="",element:n,mode:o="tables"}){if(!n)return!1;const p=new Date().toLocaleString("en-PH",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}),e=y(n,o).innerHTML,a=o==="visual"?v():"",t=document.createElement("iframe");t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.right="0",t.style.bottom="0",t.style.width="0",t.style.height="0",t.style.border="0";const l=`
  <html>
    <head>
      <title>${i}</title>
      ${a}
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 28px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.5;
          color: #0f172a;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 180px);
        }
        .print-shell { max-width: 1120px; margin: 0 auto; }
        .print-header {
          margin-bottom: 24px;
          padding: 20px 22px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: #fff;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        .print-brand {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.78;
          margin: 0 0 6px;
        }
        .print-title { font-size: 24px; font-weight: 800; margin: 0 0 4px; line-height: 1.2; }
        .print-subtitle { font-size: 13px; color: rgba(255,255,255,.82); margin: 0; max-width: 640px; }
        .print-meta-panel {
          min-width: 220px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.18);
        }
        .print-meta-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.72;
          margin: 0 0 6px;
        }
        .print-meta-value { font-size: 13px; font-weight: 700; margin: 0; }
        .print-content > * + * { margin-top: 18px; }
        .print-table-block {
          break-inside: avoid;
          padding: 16px 18px 18px;
          border: 1px solid #dbe7f3;
          border-radius: 14px;
          background: #fff;
        }
        .print-table-title {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 12px;
          color: #0f172a;
        }
        .print-table-spacer { height: 0; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 14px !important; }
        .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, [class*="shadow-"] { box-shadow: none !important; }
        .border, [class*="border-"] { border-color: #cbd5e1 !important; }
        .bg-white, .bg-slate-50, .bg-slate-100, .dark\\:bg-slate-900, .dark\\:bg-slate-800, .dark\\:bg-slate-800\\/50 { background: #ffffff !important; }
        .text-white, .dark\\:text-white { color: #0f172a !important; }
        .text-slate-400, .text-slate-500, .dark\\:text-slate-400, .dark\\:text-slate-300 { color: #475569 !important; }
        .grid { display: grid; gap: 16px; }
        .flex { display: flex; }
        .overflow-x-auto { overflow: visible !important; }
        [data-print-hide="true"], .no-print { display: none !important; }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 8px;
          overflow: hidden;
          border: 1px solid #dbe7f3;
          border-radius: 12px;
        }
        th, td {
          border: 0;
          border-bottom: 1px solid #e8eef5;
          padding: 10px 12px;
          text-align: left;
          font-size: 12px;
          vertical-align: top;
        }
        tbody tr:last-child td { border-bottom: 0; }
        tbody tr:nth-child(even) td { background: #f8fbff; }
        th {
          background: #eff6ff !important;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 9px;
          font-weight: 800;
        }
        thead { display: table-header-group; }
        tr, img, svg, canvas { break-inside: avoid; }
        canvas, svg { max-width: 100% !important; }
        button { display: none !important; }
        input, select { border: 1px solid #cbd5e1 !important; background: #fff !important; color: #0f172a !important; }
        @media print {
          body { padding: 18px; background: #fff; }
          .print-shell { max-width: none; }
          .print-header { break-inside: avoid; }
        }
        ${o==="visual"?`
        body {
          padding: 20px;
          background: #f8fafc;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-shell { max-width: 1240px; }
        .print-content {
          color: inherit;
        }
        .print-content .animate-in {
          animation: none !important;
        }
        .print-content .glass {
          backdrop-filter: none !important;
        }
        .print-content [class*="shadow-"] {
          box-shadow: none !important;
        }
        .print-content .dark\\:text-white,
        .print-content .dark\\:text-slate-200,
        .print-content .dark\\:text-slate-300,
        .print-content .dark\\:text-slate-400,
        .print-content .dark\\:bg-slate-900,
        .print-content .dark\\:bg-slate-800,
        .print-content .dark\\:bg-slate-800\\/60,
        .print-content .dark\\:border-slate-700 {
          color: inherit !important;
          background: inherit;
          border-color: inherit;
        }
        .print-content .grid {
          break-inside: avoid;
        }
        .print-content .print-occupancy-summary {
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          gap: 12px !important;
          align-items: stretch;
        }
        .print-content .print-occupancy-summary > * {
          min-width: 0;
        }
        .print-content .print-billing-summary {
          display: grid !important;
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 12px !important;
          align-items: stretch;
        }
        .print-content .print-billing-summary-card {
          min-width: 0;
          padding: 14px 16px !important;
          border: 1px solid #dbe7f3 !important;
          border-radius: 16px !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
          box-shadow: none !important;
        }
        .print-content .print-billing-summary-label {
          margin: 0 0 8px !important;
          font-size: 10px !important;
          letter-spacing: 0.1em !important;
          color: #64748b !important;
        }
        .print-content .print-billing-summary-value {
          margin: 0 !important;
          font-size: 30px !important;
          line-height: 1 !important;
        }
        .print-content .print-facility-overview {
          gap: 10px !important;
          margin-bottom: 12px !important;
        }
        .print-content .print-facility-report-main {
          grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.9fr) !important;
          gap: 12px !important;
          align-items: start !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .print-content .print-facility-chart-card,
        .print-content .print-facility-summary-card {
          padding: 14px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .print-content .print-facility-chart-card .mb-5 {
          margin-bottom: 10px !important;
        }
        .print-content .print-facility-chart-card .flex.flex-wrap.gap-2 {
          gap: 6px !important;
          margin-bottom: 10px !important;
        }
        .print-content .print-facility-chart-card button {
          display: inline-flex !important;
          padding: 6px 10px !important;
          font-size: 11px !important;
          box-shadow: none !important;
        }
        .print-content .print-facility-chart-wrap {
          height: 220px !important;
          min-height: 220px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .print-content .print-facility-chart-wrap .recharts-responsive-container {
          height: 220px !important;
        }
        .print-content .print-facility-summary-card h2 {
          margin-bottom: 10px !important;
        }
        .print-content .print-facility-summary-card .space-y-3 > * + * {
          margin-top: 8px !important;
        }
        .print-content .print-facility-summary-card .space-y-3 > div {
          padding: 10px 12px !important;
        }
        .print-content section,
        .print-content article,
        .print-content .rounded-2xl,
        .print-content .rounded-xl {
          break-inside: avoid;
        }
        @media print {
          body {
            padding: 12px;
            background: #fff;
          }
          .print-header {
            margin-bottom: 18px;
          }
          .print-content .print-occupancy-summary {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }
          .print-content .print-billing-summary {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .print-content .print-facility-overview {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .print-content .print-facility-report-main {
            grid-template-columns: minmax(0, 1.45fr) minmax(240px, 0.9fr) !important;
            gap: 10px !important;
          }
          .print-content .print-facility-chart-wrap,
          .print-content .print-facility-chart-wrap .recharts-responsive-container {
            height: 200px !important;
            min-height: 200px !important;
          }
        }
        `:""}
      </style>
    </head>
    <body>
      <div class="print-shell">
        <div class="print-header">
          <div>
            <p class="print-brand">Enyecontrols</p>
            <h1 class="print-title">${i}</h1>
            ${r?`<p class="print-subtitle">${r}</p>`:""}
          </div>
          <div class="print-meta-panel">
            <p class="print-meta-label">Generated</p>
            <p class="print-meta-value">${p}</p>
          </div>
        </div>
        <div class="print-content">${e}</div>
      </div>
    </body>
  </html>
  `,d=()=>{t.parentNode&&t.parentNode.removeChild(t)};return t.onload=()=>{const c=t.contentWindow;if(!c){d();return}const s=()=>setTimeout(d,1200);c.onafterprint=s,c.focus(),c.requestAnimationFrame(()=>{c.print(),s()})},document.body.appendChild(t),t.srcdoc=l,!0}export{w as e,A as p};
