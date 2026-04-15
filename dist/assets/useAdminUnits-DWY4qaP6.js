import{r as u,I as b,j as s,X as p,f as v,J as k,K as j,M as U}from"./index-SrZpqNgu.js";function F({isOpen:d,onClose:i,title:x,subtitle:f,children:h}){return u.useEffect(()=>{if(!d)return;const o=w=>{w.key==="Escape"&&i()};return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[d,i]),u.useEffect(()=>(d?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[d]),b.createPortal(s.jsxs(s.Fragment,{children:[s.jsx("div",{onClick:i,"aria-hidden":"true",className:`
          fixed inset-0 z-[400]
          bg-black/50 backdrop-blur-sm
          transition-opacity duration-200
          ${d?"opacity-100 pointer-events-auto":"opacity-0 pointer-events-none"}
        `}),s.jsxs("div",{role:"dialog","aria-modal":"true",className:`
          fixed top-20 right-0 z-[410]
          w-full max-w-[440px] max-h-[90vh]
          flex flex-col overflow-hidden
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-700
          shadow-[0_0_60px_rgba(0,0,0,0.25)]
          transition-transform duration-300 ease-out
          ${d?"translate-x-0":"translate-x-full"}
        `,children:[s.jsxs("div",{className:"flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0",children:[s.jsxs("div",{className:"min-w-0 flex-1 pr-3",children:[s.jsx("h2",{className:"font-semibold text-[16px] text-slate-800 dark:text-white leading-tight truncate",children:x}),f&&s.jsx("p",{className:"text-xs text-slate-400 mt-0.5 truncate",children:f})]}),s.jsx("button",{onClick:i,className:`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl\r
            bg-slate-100 dark:bg-slate-800\r
            text-slate-500 dark:text-slate-400\r
            hover:bg-slate-200 dark:hover:bg-slate-700\r
            hover:text-slate-700 dark:hover:text-white\r
            transition-all`,children:s.jsx(p,{className:"w-4 h-4"})})]}),s.jsx("div",{className:"flex-1 overflow-y-auto p-5",children:h})]})]}),document.body)}function D(){const[d,i]=u.useState([]),[x,f]=u.useState(!0),[h,o]=u.useState(!1),[w,l]=u.useState(""),m=u.useCallback(async()=>{var r,n;try{f(!0),l("");const a=await v();i(Array.isArray(a==null?void 0:a.data)?a.data:[])}catch(a){l(((n=(r=a==null?void 0:a.response)==null?void 0:r.data)==null?void 0:n.message)||"Failed to load units.")}finally{f(!1)}},[]);return u.useEffect(()=>{m()},[m]),{units:d,loading:x,submitting:h,error:w,loadUnits:m,addUnit:async r=>{var n,a;try{o(!0),l("");const t=await U(r),e=t==null?void 0:t.data;return e?i(c=>[e,...c]):await m(),t}catch(t){const e=((a=(n=t==null?void 0:t.response)==null?void 0:n.data)==null?void 0:a.message)||"Failed to create unit.";throw l(e),t}finally{o(!1)}},editUnit:async(r,n)=>{var a,t;try{o(!0),l("");const e=await j(r,n),c=e==null?void 0:e.data;return c?i(g=>g.map(y=>String(y.id)===String(r)?c:y)):await m(),e}catch(e){const c=((t=(a=e==null?void 0:e.response)==null?void 0:a.data)==null?void 0:t.message)||"Failed to update unit.";throw l(c),e}finally{o(!1)}},removeUnit:async r=>{var n,a;try{o(!0),l("");const t=await k(r);return i(e=>e.filter(c=>String(c.id)!==String(r))),t}catch(t){const e=((a=(n=t==null?void 0:t.response)==null?void 0:n.data)==null?void 0:a.message)||"Failed to delete unit.";throw l(e),t}finally{o(!1)}}}}export{F as D,D as u};
