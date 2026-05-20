export default function AppLoadingScreen() {
  return (
    <>
      <style>{`
        @keyframes triangle-spin-1 {
          0% { transform: rotate(-360deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes triangle-spin-2 {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        .triangle-1 {
          animation: triangle-spin-1 1s ease-in-out infinite;
        }

        .triangle-2 {
          animation: triangle-spin-2 1s ease-in-out infinite alternate;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          
          {/* Loader */}
          <div className="relative">
            {/* Top Triangle */}
            <div
              className="
                triangle-1
                w-0 h-0
                border-t-[50px]
                border-r-[50px]
                border-t-violet-500
                border-r-transparent
                mx-auto
              "
            />

            {/* Bottom Triangle */}
            <div
              className="
                triangle-2
                w-0 h-0
                border-b-[50px]
                border-l-[50px]
                border-b-violet-400/60
                border-l-transparent
                -mt-[50px]
                mx-auto
              "
            />
          </div>

          {/* Text */}
          <p className="mt-8 text-sm font-medium tracking-[0.3em] text-slate-500 dark:text-slate-400">
            PLEASE WAIT
          </p>
        </div>
      </div>
    </>
  );
}