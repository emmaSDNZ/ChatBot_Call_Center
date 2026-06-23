export default function ActivityFeed({ data = [] }) {
  const activities = data;

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
      <div
        className="
          absolute
          top-0
          left-0
          w-[180px]
          h-[180px]
          bg-emerald-500/5
          blur-[90px]
        "
      />

      <div className="relative z-10">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">
            Monitoreo en Vivo
          </span>

          <h3 className="text-lg font-semibold text-white mt-2">
            Flujo de Actividad
          </h3>
        </div>

        <div className="mt-6 space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activity.title}
                </p>

                <span className="text-[11px] text-slate-500 mt-1 block">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}