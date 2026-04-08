import{j as l}from"./index-CZ_GbMMd.js";import{D as u}from"./download-E2d4TcLB.js";import{P as f}from"./printer-DAAcrICg.js";function g({onExport:n,onPrint:r,exportLabel:o="Export CSV",printLabel:a="Print",iconOnly:i=!1,className:t=""}){return l.jsxs("div",{className:`flex items-center gap-2 flex-wrap ${t}`.trim(),children:[n?l.jsxs("button",{type:"button",onClick:n,"aria-label":o,title:o,className:`inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-900/60 ${i?"h-10 w-10":"gap-2 px-4 py-2.5 text-sm font-semibold"}`,children:[l.jsx(u,{className:"h-4 w-4"}),i?l.jsx("span",{className:"sr-only",children:o}):o]}):null,r?l.jsxs("button",{type:"button",onClick:r,"aria-label":a,title:a,className:`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${i?"h-10 w-10":"gap-2 px-4 py-2.5 text-sm font-semibold"}`,children:[l.jsx(f,{className:"h-4 w-4"}),i?l.jsx("span",{className:"sr-only",children:a}):a]}):null]})}function p(n){return`"${String(n??"").replace(/"/g,'""')}"`}function y(n,r=[]){if(!Array.isArray(r)||r.length===0)return!1;const o=r.map(e=>e&&typeof e=="object"&&!Array.isArray(e)?e:{value:e}),a=Array.from(o.reduce((e,d)=>(Object.keys(d).forEach(m=>e.add(m)),e),new Set));if(a.length===0)return!1;const i=[a.map(p).join(","),...o.map(e=>a.map(d=>p(e[d])).join(","))].join(`\r
`),t=new Blob([i],{type:"text/csv;charset=utf-8;"}),c=URL.createObjectURL(t),s=document.createElement("a");return s.href=c,s.setAttribute("download",n),document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(c),!0}function w({title:n,subtitle:r="",element:o}){if(!o)return!1;const a=new Date().toLocaleString("en-PH",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}),i=o.innerHTML,t=document.createElement("iframe");t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.right="0",t.style.bottom="0",t.style.width="0",t.style.height="0",t.style.border="0";const c=`
  <html>
    <head>
      <title>${n}</title>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
          background: #ffffff;
        }
        .print-shell { max-width: 1200px; margin: 0 auto; }
        .print-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
        .print-title { font-size: 24px; font-weight: 700; margin: 0 0 6px; }
        .print-subtitle { font-size: 13px; color: #475569; margin: 0 0 10px; }
        .print-meta { font-size: 12px; color: #64748b; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 14px !important; }
        .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, [class*="shadow-"] { box-shadow: none !important; }
        .border, [class*="border-"] { border-color: #cbd5e1 !important; }
        .bg-white, .bg-slate-50, .bg-slate-100, .dark\\:bg-slate-900, .dark\\:bg-slate-800, .dark\\:bg-slate-800\\/50 { background: #ffffff !important; }
        .text-white, .dark\\:text-white { color: #0f172a !important; }
        .text-slate-400, .text-slate-500, .dark\\:text-slate-400, .dark\\:text-slate-300 { color: #475569 !important; }
        .grid { display: grid; gap: 16px; }
        .flex { display: flex; }
        .overflow-x-auto { overflow: visible !important; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
        th { background: #f8fafc !important; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
        canvas, svg { max-width: 100% !important; }
        button { display: none !important; }
        input, select { border: 1px solid #cbd5e1 !important; background: #fff !important; color: #0f172a !important; }
        @media print {
          body { padding: 18px; }
          .print-shell { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-shell">
        <div class="print-header">
          <h1 class="print-title">${n}</h1>
          ${r?`<p class="print-subtitle">${r}</p>`:""}
          <div class="print-meta">Generated ${a}</div>
        </div>
        <div>${i}</div>
      </div>
    </body>
  </html>
  `,s=()=>{t.parentNode&&t.parentNode.removeChild(t)};return t.onload=()=>{const e=t.contentWindow;if(!e){s();return}const d=()=>setTimeout(s,1200);e.onafterprint=d,e.focus(),e.requestAnimationFrame(()=>{e.print(),d()})},document.body.appendChild(t),t.srcdoc=c,!0}export{g as P,y as d,w as p};
