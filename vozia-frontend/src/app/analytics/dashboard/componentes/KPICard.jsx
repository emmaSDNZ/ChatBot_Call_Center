export default function KPICard({
  title,
  value,
  growth,
  description,
}) {
  const realtime =
    growth.toLowerCase() === "realtime";

  return (
    <div
      className="
        relative
        overflow-hidden
        bg-[#111827]/80
        border border-white/[0.04]
        backdrop-blur-xl
        rounded-[22px]
        px-4
        py-4
        min-h-[120px]
      "
    >
      {/* GLOW */}
      <div
        className="
          absolute
          top-0
          right-0
          w-[120px]
          h-[120px]
          bg-white/[0.02]
          blur-[70px]
        "
      />

      <div className="relative z-10">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.18em]
                text-slate-500
                font-medium
              "
            >
              {title}
            </p>

            <h3
              className="
                text-2xl
                font-semibold
                tracking-tight
                text-white
                mt-3
              "
            >
              {value}
            </h3>
          </div>

          <div
            className={`
              px-2 py-1
              rounded-full
              text-[11px]
              border whitespace-nowrap

              ${
                realtime
                  ? `
                    bg-cyan-500/10
                    border-cyan-500/10
                    text-cyan-300
                  `
                  : `
                    bg-emerald-500/10
                    border-emerald-500/10
                    text-emerald-300
                  `
              }
            `}
          >
            {realtime ? "Tiempo Real" : growth}
          </div>
        </div>

        {/* CONTEXT */}
        <div className="mt-5 flex items-center gap-2">
          <div
            className={`
              w-2 h-2 rounded-full

              ${
                realtime
                  ? "bg-yellow-400"
                  : "bg-emerald-400"
              }
            `}
          />

          <p className="text-[12px] text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}