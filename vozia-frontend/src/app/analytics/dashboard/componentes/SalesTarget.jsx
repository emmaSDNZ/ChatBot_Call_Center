export default function SalesTarget({ data }) {
  const progress = data?.progress ?? 74;

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        border border-white/[0.05]
        bg-[#121826]
        p-5
        h-[260px]
      "
    >
      {/* GLOW */}
      <div
        className="
          absolute
          bottom-0
          left-0
          w-[200px]
          h-[200px]
          bg-indigo-500/10
          blur-[100px]
        "
      />

      <div className="relative z-10">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          Rendimiento
        </span>

        <h3 className="text-lg font-semibold text-white mt-2">
          Objetivo de Ventas
        </h3>

        <div className="mt-5 flex items-center justify-center">
          <div className="relative w-36 h-36">
            <svg
              className="w-full h-full rotate-[-90deg]"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
                fill="none"
              />

              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="#818CF8"
                strokeWidth="10"
                fill="none"
                strokeDasharray={327}
                strokeDashoffset={
                  327 - (327 * progress) / 100
                }
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h2 className="text-3xl font-semibold text-white">
                {progress}%
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Meta Alcanzada
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}