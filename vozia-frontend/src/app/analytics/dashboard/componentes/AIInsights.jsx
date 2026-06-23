export default function AIInsights({ data = [] }) {
  const insights = data;

  return (
    <div className="bg-[#151B2E] border border-indigo-500/20 rounded-2xl p-6 h-full">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />

        <h3 className="text-xl font-semibold">
          Detecciones de la IA
        </h3>
      </div>

      <div className="space-y-4 mt-8">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-xl p-4 border border-white/5"
          >
            <p className="text-sm leading-relaxed">
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}