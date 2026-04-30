import { Link } from 'react-router-dom'
import GridBackground from '@/components/common/GridBackground'

function MeterAnimation() {
  return (
    <svg
      viewBox="0 0 220 160"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-label="Animated electric meter"
    >
      <style>{`
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
      `}</style>

      <rect x="20" y="10" width="180" height="140" rx="10" ry="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      <rect x="24" y="14" width="172" height="132" rx="8" ry="8" fill="#0f172a" stroke="#1e3a5f" strokeWidth="1" />

      <rect x="70" y="18" width="80" height="14" rx="3" fill="#1e3a5f" />
      <text x="110" y="28.5" textAnchor="middle" fill="#60a5fa" fontSize="7" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
        EC METER
      </text>

      <rect x="35" y="36" width="150" height="38" rx="4" fill="#0a1628" stroke="#1d4ed8" strokeWidth="1.5" />

      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={40 + i * 27} y="39" width="23" height="32" rx="2" fill="#050d1a" stroke="#1e3a5f" strokeWidth="0.5" />
          <clipPath id={`clip-d${i}`}>
            <rect x={40 + i * 27} y="39" width="23" height="32" rx="2" />
          </clipPath>
          <g clipPath={`url(#clip-d${i})`}>
            <g className={i === 4 ? 'digit-fast' : 'digit-slow'} style={{ animationDelay: `${-i * 0.3}s` }}>
              {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d, j) => (
                <text
                  key={j}
                  x={51.5 + i * 27}
                  y={56 + j * 32}
                  textAnchor="middle"
                  fill={i === 4 ? '#f59e0b' : '#34d399'}
                  fontSize="18"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {d}
                </text>
              ))}
            </g>
          </g>
        </g>
      ))}

      <text x="192" y="58" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">kWh</text>

      <path d="M 45 130 A 65 65 0 0 1 175 130" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
      <path d="M 45 130 A 65 65 0 0 1 84 77" fill="none" stroke="#22c55e" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
      <path d="M 84 77 A 65 65 0 0 1 136 72" fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
      <path d="M 136 72 A 65 65 0 0 1 175 130" fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" opacity="0.7" />

      <path
        d="M 45 130 A 65 65 0 0 1 175 130"
        className="arc-glow"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />

      {Array.from({ length: 9 }).map((_, i) => {
        const angle = -150 + i * (300 / 8)
        const rad = (angle * Math.PI) / 180
        const cx = 110
        const cy = 105
        const r1 = 58
        const r2 = 65

        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(rad)}
            y1={cy + r1 * Math.sin(rad)}
            x2={cx + r2 * Math.cos(rad)}
            y2={cy + r2 * Math.sin(rad)}
            stroke="#475569"
            strokeWidth={i % 4 === 0 ? 2 : 1}
          />
        )
      })}

      <g className="needle">
        <line x1="110" y1="105" x2="110" y2="52" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="110" y1="105" x2="110" y2="118" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </g>

      <circle cx="110" cy="105" r="6" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="110" cy="105" r="2.5" fill="#93c5fd" />

      <circle cx="185" cy="100" r="4" fill="#22c55e" className="pulse" />
      <circle cx="185" cy="112" r="4" fill="#3b82f6" className="blink" />

      <text x="110" y="148" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace" letterSpacing="1">
        DIGITAL WATT-HOUR METER
      </text>
    </svg>
  )
}

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6 dark:bg-slate-950">
      <GridBackground />

      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-6 h-40 w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95">
          <MeterAnimation />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 dark:border-blue-800 dark:bg-blue-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold tracking-widest text-blue-600 dark:text-blue-400">
              ERROR 404
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Page not found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Looks like this meter is not registered in the system.
            The page you are looking for does not exist or may have been moved.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
            >
              Go back home
            </Link>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-600">
          EC Billing System - If this keeps happening, contact your administrator.
        </p>
      </div>
    </div>
  )
}
