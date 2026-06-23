

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  CartesianGrid,
} from "recharts";

export default function RevenueChart({ data = [] }) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        border border-white/[0.05]
        bg-[#121826]
        p-5
        h-[320px]
      "
    >
      <div
        className="
          absolute
          top-0
          right-0
          w-[300px]
          h-[300px]
          bg-indigo-500/10
          blur-[120px]
          rounded-full
        "
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

            <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-medium">
              Análisis de Ingresos
            </span>
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-white mt-3">
            Rendimiento de Ingresos
          </h3>

          <p className="text-sm text-slate-400 mt-1">
            La IA detectó una sólida tendencia alcista este trimestre.
          </p>
        </div>

        <div
          className="
            px-3 py-2
            rounded-2xl
            bg-emerald-500/10
            border border-emerald-500/10
          "
        >
          <p className="text-[11px] text-emerald-300 uppercase tracking-wide">
            Crecimiento
          </p>

          <h4 className="text-lg font-semibold text-white mt-1">
            +24.8%
          </h4>
        </div>
      </div>

      <div className="relative z-10 h-[210px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818CF8" stopOpacity={0.45} />
                <stop offset="45%" stopColor="#6366F1" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.04)"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                background: "#0F172A",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                color: "#fff",
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#818CF8"
              strokeWidth={3}
              fill="url(#premiumGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}