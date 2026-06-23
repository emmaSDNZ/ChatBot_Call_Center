import React from "react";
import { FiMic, FiZap, FiBarChart2, FiCheckCircle } from "react-icons/fi";

export default function ConversationFlow({ currentStep }) {
  const steps = [
    {
      id: 1,
      title: "Captura de Audio",
      description: "Llamada entrante activa",
      icon: <FiMic size={16} />,
      activeColor:
        "border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-transparent text-blue-400",
    },
    {
      id: 2,
      title: "Análisis Cognitivo",
      description: "Procesando NLP e IA",
      icon: <FiZap size={16} />,
      activeColor:
        "border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-transparent text-purple-400",
    },
    {
      id: 3,
      title: "Métricas de Voz",
      description: "Extrayendo KPIs",
      icon: <FiBarChart2 size={16} />,
      activeColor:
        "border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400",
    },
    {
      id: 4,
      title: "Acción Copilot",
      description: "Sugerencia estratégica",
      icon: <FiCheckCircle size={16} />,
      activeColor:
        "border-teal-500/40 bg-gradient-to-r from-teal-500/10 to-transparent text-teal-400",
    },
  ];

  const progressPercent = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="w-full flex flex-col justify-between h-full font-sans antialiased selection:bg-blue-500/20">
      {/* Encabezado Ejecutivo */}
      <div className="mb-5 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Monitoreo del Flujo
            </h3>
            <p className="text-[11px] text-slate-500 hidden lg:block">
              Estado del pipeline en tiempo real
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
            {progressPercent}%
          </span>
        </div>
        {/* Barra de progreso fluida */}
        <div className="w-full bg-white/5 h-1.5 mt-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 h-full transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Grid Responsivo Premium (Feria QR Mobile Ready) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-col lg:space-y-3 lg:gap-0">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="relative flex flex-col flex-1">
              {/* Card de Paso Ejecutiva */}
              <div
                className={`p-3.5 border rounded-xl transition-all duration-300 h-full flex flex-col justify-between ${
                  isActive
                    ? `${step.activeColor} shadow-lg shadow-black/10 backdrop-blur-md`
                    : isCompleted
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400/80"
                      : "border-white/5 bg-white/[0.01] text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded bg-white/5 ${
                      isActive
                        ? "text-white border border-white/10"
                        : "text-slate-500"
                    }`}
                  >
                    Paso {step.id}
                  </span>

                  {/* Icono con sutil resplandor si está activo */}
                  <div
                    className={`p-1 rounded-lg ${isActive ? "bg-white/5 shadow-inner" : ""}`}
                  >
                    {isCompleted ? (
                      <FiCheckCircle
                        size={14}
                        className="text-emerald-400 animate-fade-in"
                      />
                    ) : (
                      <span
                        className={isActive ? "text-inherit" : "text-slate-500"}
                      >
                        {step.icon}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h4
                    className={`text-xs font-semibold tracking-wide ${isActive ? "text-white" : isCompleted ? "text-emerald-300" : "text-slate-300"}`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${isActive ? "text-slate-300" : "text-slate-500"}`}
                  >
                    {isActive
                      ? "Analizando ahora..."
                      : isCompleted
                        ? "Completado"
                        : step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
