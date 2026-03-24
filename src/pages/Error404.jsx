/**
 * pages/Error404.jsx
 * 404 – Page Not Found
 *
 * Design language matches the ECBills system:
 *  • DM Sans font, mesh-bg, glass card, slate/violet palette
 *  • Inline SVG "spinning electricity meter" animation (no external GIF needed)
 *  • Role-aware "Go Home" redirect via useAuth
 *  • Fully responsive + accessible
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Home, ArrowLeft, Zap } from 'lucide-react'

// ── Role → home path ─────────────────────────────────────────────────────────
function getHomePath(role) {
  switch (role) {
    case 'super_admin':
    case 'admin':          return '/admin'
    case 'facility_manager': return '/facility/dashboard'
    case 'finance':        return '/finance/dashboard'
    case 'tenant':         return '/tenant/dashboard'
    default:               return '/login'
  }
}

// ── Animated Electricity Meter SVG ───────────────────────────────────────────
function MeterAnimation() {
  return (
    <div
      className="relative flex items-center justify-center"
      role="img"
      aria-label="Animated electricity meter illustration showing spinning dial"
    >
      <svg
        viewBox="0 0 280 260"
        xmlns="http://www.w3.org/2000/svg"
        className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-2xl"
        aria-hidden="true"
      >
        <defs>
          {/* Meter body gradient */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Glass face gradient */}
          <radialGradient id="faceGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#334155" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="1"   />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Needle gradient */}
          <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <style>{`
            @keyframes spinDial {
              0%   { transform: rotate(-140deg); }
              15%  { transform: rotate(-80deg);  }
              35%  { transform: rotate(20deg);   }
              55%  { transform: rotate(-30deg);  }
              75%  { transform: rotate(100deg);  }
              90%  { transform: rotate(60deg);   }
              100% { transform: rotate(-140deg); }
            }
            @keyframes blinkLed {
              0%, 100% { opacity: 1; }
              50%       { opacity: 0.15; }
            }
            @keyframes scrollDigit {
              0%   { transform: translateY(0px);   }
              10%  { transform: translateY(-18px);  }
              20%  { transform: translateY(-36px);  }
              30%  { transform: translateY(-54px);  }
              40%  { transform: translateY(-72px);  }
              50%  { transform: translateY(-90px);  }
              60%  { transform: translateY(-108px); }
              70%  { transform: translateY(-126px); }
              80%  { transform: translateY(-144px); }
              90%  { transform: translateY(-162px); }
              100% { transform: translateY(-180px); }
            }
            @keyframes floatUp {
              0%, 100% { transform: translateY(0px);   }
              50%       { transform: translateY(-8px);  }
            }
            @keyframes arcPulse {
              0%, 100% { opacity: 0.3; stroke-width: 1.5; }
              50%       { opacity: 1;   stroke-width: 2.5; }
            }
            .meter-float { animation: floatUp 3s ease-in-out infinite; }
            .needle      {
              transform-origin: 140px 148px;
              animation: spinDial 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .led-red   { animation: blinkLed 0.8s ease-in-out infinite; }
            .led-green { animation: blinkLed 1.3s ease-in-out infinite 0.4s; }
            .arc-1     { animation: arcPulse 2s ease-in-out infinite; }
            .arc-2     { animation: arcPulse 2s ease-in-out infinite 0.6s; }
            .arc-3     { animation: arcPulse 2s ease-in-out infinite 1.2s; }
          `}</style>
        </defs>

        {/* ── Floating wrapper ── */}
        <g className="meter-float">

          {/* Shadow ellipse */}
          <ellipse cx="140" cy="252" rx="70" ry="8"
            fill="black" opacity="0.25"
          />

          {/* Meter body */}
          <rect x="30" y="20" width="220" height="220" rx="18" ry="18"
            fill="url(#bodyGrad)"
            stroke="#334155" strokeWidth="2"
          />

          {/* Top ridge */}
          <rect x="55" y="16" width="170" height="10" rx="5"
            fill="#1e293b" stroke="#334155" strokeWidth="1"
          />

          {/* Bottom ridge */}
          <rect x="55" y="214" width="170" height="10" rx="5"
            fill="#1e293b" stroke="#334155" strokeWidth="1"
          />

          {/* Brand strip */}
          <rect x="50" y="28" width="180" height="22" rx="4"
            fill="#0f172a" opacity="0.7"
          />
          <text x="140" y="43" textAnchor="middle"
            fill="#64748b" fontSize="9" fontFamily="monospace" letterSpacing="3"
          >
            ENYECONTROLS
          </text>

          {/* ── Dial face ── */}
          <circle cx="140" cy="130" r="72"
            fill="url(#faceGrad)"
            stroke="#334155" strokeWidth="2"
          />

          {/* Dial arc marks */}
          {Array.from({ length: 21 }, (_, i) => {
            const angle = -140 + i * 14
            const rad   = (angle * Math.PI) / 180
            const isMajor = i % 5 === 0
            const r1 = isMajor ? 56 : 60
            const r2 = 66
            const x1 = 140 + r1 * Math.cos(rad)
            const y1 = 130 + r1 * Math.sin(rad)
            const x2 = 140 + r2 * Math.cos(rad)
            const y2 = 130 + r2 * Math.sin(rad)
            return (
              <line key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? '#94a3b8' : '#475569'}
                strokeWidth={isMajor ? 2 : 1}
                strokeLinecap="round"
              />
            )
          })}

          {/* Dial arc labels */}
          {[0, 2, 4, 6, 8, 10].map((val, i) => {
            const angle = -140 + i * 28
            const rad   = (angle * Math.PI) / 180
            const rx    = 140 + 48 * Math.cos(rad)
            const ry    = 130 + 48 * Math.sin(rad)
            return (
              <text key={val} x={rx} y={ry + 3}
                textAnchor="middle" dominantBaseline="middle"
                fill="#94a3b8" fontSize="7" fontFamily="monospace"
              >
                {val}
              </text>
            )
          })}

          {/* kWh label */}
          <text x="140" y="162" textAnchor="middle"
            fill="#64748b" fontSize="8" fontFamily="monospace" letterSpacing="1"
          >
            kWh × 100
          </text>

          {/* Arc pulse rings */}
          <circle cx="140" cy="130" r="40"
            fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.3"
            className="arc-1"
          />
          <circle cx="140" cy="130" r="52"
            fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.2"
            className="arc-2"
          />

          {/* Needle */}
          <g className="needle" filter="url(#glow)">
            <line
              x1="140" y1="100"
              x2="140" y2="148"
              stroke="url(#needleGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="140" cy="148" r="5"
              fill="#6366f1"
            />
            <circle cx="140" cy="148" r="2.5"
              fill="#c4b5fd"
            />
          </g>

          {/* ── Display panel ── */}
          <rect x="75" y="175" width="130" height="24" rx="4"
            fill="#0f172a" stroke="#1e3a5f" strokeWidth="1.5"
          />

          {/* Scrolling digit window */}
          <rect x="79" y="178" width="122" height="18" rx="2"
            fill="#001a33"
          />

          {/* Digit cells */}
          {[0, 1, 2, 3, 4, 5].map((cell) => {
            const x = 82 + cell * 20
            return (
              <g key={cell}>
                <rect x={x} y="178" width="18" height="18"
                  fill="#001025" rx="1"
                />
                <g style={{
                  clipPath: `inset(0 0 0 0)`,
                  overflow: 'hidden'
                }}>
                  <text
                    x={x + 9} y="192"
                    textAnchor="middle"
                    fill="#22d3ee"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    style={{
                      animation: `scrollDigit ${2 + cell * 0.3}s linear infinite`,
                    }}
                  >
                    {cell % 3 === 0 ? '4' : cell % 3 === 1 ? '0' : '7'}
                  </text>
                </g>
              </g>
            )
          })}

          {/* ── LED indicators ── */}
          <circle cx="70"  cy="60" r="5" fill="#ef4444" className="led-red"   />
          <circle cx="70"  cy="75" r="5" fill="#22c55e" className="led-green" />

          {/* LED labels */}
          <text x="82" y="64" fill="#64748b" fontSize="6" fontFamily="monospace">ERR</text>
          <text x="82" y="79" fill="#64748b" fontSize="6" fontFamily="monospace">ACT</text>

          {/* ── Terminal screws ── */}
          {[60, 100, 140, 180, 220].map((x) => (
            <g key={x}>
              <rect x={x - 6} y="204" width="12" height="10" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <line x1={x - 3} y1="209" x2={x + 3} y2="209" stroke="#475569" strokeWidth="1" />
              <line x1={x} y1="206" x2={x} y2="212" stroke="#475569" strokeWidth="1" />
            </g>
          ))}

          {/* ── Lightning bolt badge ── */}
          <circle cx="210" cy="55" r="14"
            fill="#4f46e5" opacity="0.9"
          />
          <text x="210" y="60" textAnchor="middle"
            fill="white" fontSize="16" fontWeight="bold"
          >
            ⚡
          </text>

        </g>
      </svg>
    </div>
  )
}

// ── Floating particle dots ────────────────────────────────────────────────────
function Particles() {
  const dots = [
    { x: '10%',  y: '15%', size: 3,  delay: '0s',    dur: '4s'   },
    { x: '88%',  y: '10%', size: 2,  delay: '1.2s',  dur: '5s'   },
    { x: '75%',  y: '80%', size: 4,  delay: '0.5s',  dur: '6s'   },
    { x: '5%',   y: '70%', size: 2,  delay: '2s',    dur: '4.5s' },
    { x: '92%',  y: '55%', size: 3,  delay: '0.8s',  dur: '5.5s' },
    { x: '50%',  y: '5%',  size: 2,  delay: '1.5s',  dur: '3.8s' },
    { x: '20%',  y: '90%', size: 3,  delay: '3s',    dur: '5s'   },
    { x: '65%',  y: '25%', size: 2,  delay: '0.3s',  dur: '4.2s' },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-violet-400/30 dark:bg-violet-500/20"
          style={{
            left: d.x, top: d.y,
            width: d.size, height: d.size,
            animation: `floatParticle ${d.dur} ease-in-out ${d.delay} infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1);   opacity: 0.4; }
          50%       { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

// ── Main 404 Component ────────────────────────────────────────────────────────
export default function Error404() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const homePath  = getHomePath(user?.role)

  return (
    <main
      className="min-h-screen mesh-bg dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      role="main"
    >
      <Particles />

      {/* Decorative blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 dark:opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full opacity-10 dark:opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Card */}
      <article className="glass rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-black/50 w-full max-w-lg p-8 sm:p-10 animate-in text-center relative z-10">

        {/* Error code */}
        <div className="relative inline-block mb-2" aria-hidden="true">
          <span
            className="text-[7rem] sm:text-[9rem] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 20px rgba(99,102,241,0.3))',
            }}
          >
            404
          </span>
          {/* Zap accent */}
          <Zap
            className="absolute -top-2 -right-6 w-7 h-7 text-amber-400"
            fill="currentColor"
            aria-hidden="true"
          />
        </div>

        {/* Meter animation */}
        <div className="my-4 flex justify-center">
          <MeterAnimation />
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
          Looks like this meter has gone offline. The page you're looking for
          doesn't exist or may have been moved.
        </p>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
          <span>ERR_ROUTE_NOT_FOUND</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(homePath)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-full sm:w-auto justify-center"
            aria-label="Go to dashboard homepage"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go to Dashboard
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-full sm:w-auto justify-center"
            aria-label="Go back to the previous page"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go Back
          </button>
        </div>

        {/* Footer hint */}
        <p className="mt-8 text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest">
          ECBills · Enyecontrols Billing System
        </p>
      </article>
    </main>
  )
}
