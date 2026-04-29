import{j as e}from"./index-CFq7nmog.js";import{L as d}from"./router-UErtFBTk.js";import{G as c}from"./GridBackground-RDL8yK4N.js";import"./icons-vendor-jyEi1FPh.js";import"./pdf-vendor-BWZ0IJjl.js";function x(){return e.jsxs("svg",{viewBox:"0 0 220 160",xmlns:"http://www.w3.org/2000/svg",className:"h-full w-full","aria-label":"Animated electric meter",children:[e.jsx("style",{children:`
        @keyframes needleSpin {
          0%   { transform: rotate(-80deg); }
          15%  { transform: rotate(10deg); }
          30%  { transform: rotate(-60deg); }
          50%  { transform: rotate(50deg); }
          65%  { transform: rotate(-20deg); }
          80%  { transform: rotate(70deg); }
          100% { transform: rotate(-80deg); }
        }
        @keyframes digitRoll {
          0%   { transform: translateY(0); }
          10%  { transform: translateY(-100%); }
          20%  { transform: translateY(-200%); }
          30%  { transform: translateY(-300%); }
          40%  { transform: translateY(-400%); }
          50%  { transform: translateY(-500%); }
          60%  { transform: translateY(-600%); }
          70%  { transform: translateY(-700%); }
          80%  { transform: translateY(-800%); }
          90%  { transform: translateY(-900%); }
          100% { transform: translateY(0); }
        }
        @keyframes digitRoll2 {
          0%,9%    { transform: translateY(0); }
          10%,19%  { transform: translateY(-100%); }
          20%,29%  { transform: translateY(-200%); }
          30%,39%  { transform: translateY(-300%); }
          40%,49%  { transform: translateY(-400%); }
          50%,59%  { transform: translateY(-500%); }
          60%,69%  { transform: translateY(-600%); }
          70%,79%  { transform: translateY(-700%); }
          80%,89%  { transform: translateY(-800%); }
          90%,100% { transform: translateY(-900%); }
        }
        @keyframes blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0.2; }
        }
        @keyframes pulse {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes arcGlow {
          0%,100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .needle {
          transform-origin: 110px 105px;
          animation: needleSpin 3s ease-in-out infinite;
        }
        .digit-fast { animation: digitRoll 1s steps(1) infinite; }
        .digit-slow { animation: digitRoll2 10s steps(1) infinite; }
        .blink { animation: blink 1s step-end infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .arc-glow { animation: arcGlow 1.5s ease-in-out infinite; }
      `}),e.jsx("rect",{x:"20",y:"10",width:"180",height:"140",rx:"10",ry:"10",fill:"#1e293b",stroke:"#334155",strokeWidth:"2"}),e.jsx("rect",{x:"24",y:"14",width:"172",height:"132",rx:"8",ry:"8",fill:"#0f172a",stroke:"#1e3a5f",strokeWidth:"1"}),e.jsx("rect",{x:"70",y:"18",width:"80",height:"14",rx:"3",fill:"#1e3a5f"}),e.jsx("text",{x:"110",y:"28.5",textAnchor:"middle",fill:"#60a5fa",fontSize:"7",fontFamily:"monospace",fontWeight:"bold",letterSpacing:"2",children:"EC METER"}),e.jsx("rect",{x:"35",y:"36",width:"150",height:"38",rx:"4",fill:"#0a1628",stroke:"#1d4ed8",strokeWidth:"1.5"}),[0,1,2,3,4].map(t=>e.jsxs("g",{children:[e.jsx("rect",{x:40+t*27,y:"39",width:"23",height:"32",rx:"2",fill:"#050d1a",stroke:"#1e3a5f",strokeWidth:"0.5"}),e.jsx("clipPath",{id:`clip-d${t}`,children:e.jsx("rect",{x:40+t*27,y:"39",width:"23",height:"32",rx:"2"})}),e.jsx("g",{clipPath:`url(#clip-d${t})`,children:e.jsx("g",{className:t===4?"digit-fast":"digit-slow",style:{animationDelay:`${-t*.3}s`},children:["0","1","2","3","4","5","6","7","8","9","0"].map((r,a)=>e.jsx("text",{x:51.5+t*27,y:56+a*32,textAnchor:"middle",fill:t===4?"#f59e0b":"#34d399",fontSize:"18",fontFamily:"monospace",fontWeight:"bold",children:r},a))})})]},t)),e.jsx("text",{x:"192",y:"58",textAnchor:"middle",fill:"#64748b",fontSize:"6",fontFamily:"monospace",children:"kWh"}),e.jsx("path",{d:"M 45 130 A 65 65 0 0 1 175 130",fill:"none",stroke:"#1e293b",strokeWidth:"14",strokeLinecap:"round"}),e.jsx("path",{d:"M 45 130 A 65 65 0 0 1 84 77",fill:"none",stroke:"#22c55e",strokeWidth:"10",strokeLinecap:"round",opacity:"0.7"}),e.jsx("path",{d:"M 84 77 A 65 65 0 0 1 136 72",fill:"none",stroke:"#f59e0b",strokeWidth:"10",strokeLinecap:"round",opacity:"0.7"}),e.jsx("path",{d:"M 136 72 A 65 65 0 0 1 175 130",fill:"none",stroke:"#ef4444",strokeWidth:"10",strokeLinecap:"round",opacity:"0.7"}),e.jsx("path",{d:"M 45 130 A 65 65 0 0 1 175 130",className:"arc-glow",fill:"none",stroke:"#3b82f6",strokeWidth:"2",strokeLinecap:"round",strokeDasharray:"4 3"}),Array.from({length:9}).map((t,r)=>{const s=(-150+r*37.5)*Math.PI/180,n=110,l=105,i=58,o=65;return e.jsx("line",{x1:n+i*Math.cos(s),y1:l+i*Math.sin(s),x2:n+o*Math.cos(s),y2:l+o*Math.sin(s),stroke:"#475569",strokeWidth:r%4===0?2:1},r)}),e.jsxs("g",{className:"needle",children:[e.jsx("line",{x1:"110",y1:"105",x2:"110",y2:"52",stroke:"#f1f5f9",strokeWidth:"2.5",strokeLinecap:"round"}),e.jsx("line",{x1:"110",y1:"105",x2:"110",y2:"118",stroke:"#94a3b8",strokeWidth:"2",strokeLinecap:"round"})]}),e.jsx("circle",{cx:"110",cy:"105",r:"6",fill:"#1e40af",stroke:"#3b82f6",strokeWidth:"1.5"}),e.jsx("circle",{cx:"110",cy:"105",r:"2.5",fill:"#93c5fd"}),e.jsx("circle",{cx:"185",cy:"100",r:"4",fill:"#22c55e",className:"pulse"}),e.jsx("circle",{cx:"185",cy:"112",r:"4",fill:"#3b82f6",className:"blink"}),e.jsx("text",{x:"110",y:"148",textAnchor:"middle",fill:"#475569",fontSize:"6.5",fontFamily:"monospace",letterSpacing:"1",children:"DIGITAL WATT-HOUR METER"})]})}function g(){return e.jsxs("div",{className:"relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6 dark:bg-slate-950",children:[e.jsx(c,{}),e.jsxs("div",{className:"relative w-full max-w-md text-center",children:[e.jsx("div",{className:"mx-auto mb-6 h-40 w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95",children:e.jsx(x,{})}),e.jsxs("div",{className:"rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95",children:[e.jsxs("div",{className:"mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 dark:border-blue-800 dark:bg-blue-900/30",children:[e.jsx("span",{className:"h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"}),e.jsx("span",{className:"text-xs font-mono font-semibold tracking-widest text-blue-600 dark:text-blue-400",children:"ERROR 404"})]}),e.jsx("h1",{className:"text-2xl font-bold text-slate-800 dark:text-white",children:"Page not found"}),e.jsx("p",{className:"mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400",children:"Looks like this meter is not registered in the system. The page you are looking for does not exist or may have been moved."}),e.jsx("div",{className:"mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row",children:e.jsx(d,{to:"/",className:"inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto",children:"Go back home"})})]}),e.jsx("p",{className:"mt-4 text-xs text-slate-400 dark:text-slate-600",children:"EC Billing System - If this keeps happening, contact your administrator."})]})]})}export{g as default};
