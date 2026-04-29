import{j as e}from"./index-DMHJ7g1z.js";import{r as n,a as f}from"./router-UErtFBTk.js";import{X as m}from"./icons-vendor-jyEi1FPh.js";function w({isOpen:t,onClose:r,title:l,subtitle:a,children:i,variant:d="side",panelClassName:x=""}){n.useEffect(()=>{if(!t)return;const o=c=>{c.key==="Escape"&&r()};return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[t,r]),n.useEffect(()=>(t?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[t]);const s=d==="center";return f.createPortal(e.jsxs(e.Fragment,{children:[e.jsx("div",{onClick:r,"aria-hidden":"true",className:`
          fixed inset-0 z-[400]
          bg-black/50 backdrop-blur-sm
          transition-opacity duration-200
          ${t?"opacity-100 pointer-events-auto":"opacity-0 pointer-events-none"}
        `}),e.jsx("div",{className:`
          fixed z-[410]
          ${s?"inset-0 flex items-center justify-center px-4 py-6 sm:px-6 pointer-events-none":`top-20 right-0 w-full max-w-[440px] max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-300 ease-out ${t?"translate-x-0":"translate-x-full"}`}
        `,children:e.jsxs("div",{role:"dialog","aria-modal":"true",className:`
            ${s?`pointer-events-auto w-full max-w-5xl max-h-[88vh] rounded-3xl transition-all duration-200 ${t?"translate-y-0 scale-100 opacity-100":"translate-y-4 scale-[0.98] opacity-0"}`:""}
            flex flex-col overflow-hidden
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            shadow-[0_0_60px_rgba(0,0,0,0.25)]
            ${x}
          `,children:[e.jsxs("div",{className:"flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0",children:[e.jsxs("div",{className:"min-w-0 flex-1 pr-3",children:[e.jsx("h2",{className:"font-semibold text-[16px] text-slate-800 dark:text-white leading-tight truncate",children:l}),a&&e.jsx("p",{className:"text-xs text-slate-400 mt-0.5 truncate",children:a})]}),e.jsx("button",{onClick:r,className:`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl\r
              bg-slate-100 dark:bg-slate-800\r
              text-slate-500 dark:text-slate-400\r
              hover:bg-slate-200 dark:hover:bg-slate-700\r
              hover:text-slate-700 dark:hover:text-white\r
              transition-all`,children:e.jsx(m,{className:"w-4 h-4"})})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-5",children:i})]})})]}),document.body)}export{w as D};
