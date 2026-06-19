import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Calendar,
  Clock,
  Smile,
  ShieldAlert,
  Frown,
  FileText,
  Activity,
  AlertTriangle,
  Heart,
  Play,
  Pause,
  Copy,
  Check,
  Sparkles,
  Volume2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Header from "../ai-voz/components/Header";

import { API_URL } from "../../config/api";
export default function Main_Historial() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedScript, setCopiedScript] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [activeAudioEl, setActiveAudioEl] = useState(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [filterMetric, setFilterMetric] = useState("all");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/ia-voz/history`);
      if (!response.ok) {
        throw new Error("Error al obtener el historial del servidor.");
      }
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Fetch history failed:", err);
      setError(err.message || "Error al conectar con el backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (activeAudioEl) {
        if (activeAudioEl._simInterval) {
          clearInterval(activeAudioEl._simInterval);
        } else {
          activeAudioEl.pause();
        }
      }
    };
  }, [activeAudioEl]);

  const toggleExpand = (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
    }
  };

  const handleCopy = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === "session") {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else if (type === "script") {
      setCopiedScript(id);
      setTimeout(() => setCopiedScript(null), 2000);
    }
  };

  const togglePlayAudio = (sessionId) => {
    // Si ya está reproduciendo este audio, lo pausamos
    if (playingAudio === sessionId) {
      if (activeAudioEl) {
        if (activeAudioEl._simInterval) {
          clearInterval(activeAudioEl._simInterval);
        } else {
          activeAudioEl.pause();
        }
      }
      setPlayingAudio(null);
      return;
    }

    // Detener cualquier reproducción previa
    if (activeAudioEl) {
      if (activeAudioEl._simInterval) {
        clearInterval(activeAudioEl._simInterval);
      } else {
        activeAudioEl.pause();
      }
    }

    // Iniciar reproducción del audio real desde el endpoint del backend
    const audioUrl =   `${API_URL}/ia-voz/audio/${sessionId}`;;
    const newAudio = new Audio(audioUrl);

    newAudio.addEventListener("canplaythrough", () => {
      newAudio.play().catch((err) => {
        console.warn("Autoplay bloqueado por el navegador:", err);
      });
    });

    newAudio.addEventListener("play", () => {
      setPlayingAudio(sessionId);
    });

    newAudio.addEventListener("timeupdate", () => {
      if (newAudio.duration) {
        const progress = (newAudio.currentTime / newAudio.duration) * 100;
        setAudioProgress((prev) => ({ ...prev, [sessionId]: progress }));
      }
    });

    newAudio.addEventListener("ended", () => {
      setPlayingAudio(null);
      setActiveAudioEl(null);
      setAudioProgress((prev) => ({ ...prev, [sessionId]: 0 }));
    });

    newAudio.addEventListener("error", () => {
      // FALLBACK: Si no hay audio físico grabado, simula de forma interactiva
      console.log(
        `Audio no disponible en BD para ${sessionId}. Usando simulación visual.`,
      );
      setPlayingAudio(sessionId);

      let progressVal = 0;
      const interval = setInterval(() => {
        progressVal += 2;
        setAudioProgress((prev) => ({ ...prev, [sessionId]: progressVal }));
        if (progressVal >= 100) {
          clearInterval(interval);
          setPlayingAudio(null);
          setAudioProgress((prev) => ({ ...prev, [sessionId]: 0 }));
        }
      }, 150);

      newAudio._simInterval = interval;
    });

    setActiveAudioEl(newAudio);
  };

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return "Desconocida";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Desconocida";
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getSimulatedDuration = (text) => {
    if (!text) return "0:05";
    const words = text.split(/\s+/).length;
    const totalSeconds = Math.max(
      5,
      Math.min(120, Math.round((words / 110) * 60)),
    );
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Helper for emotion styles
  const getEmotionBadge = (emotion) => {
    const emotionLower = emotion?.toLowerCase() || "neutral";
    const styles = {
      enojo:
        "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
      ansiedad:
        "bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]",
      confusión:
        "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      confusion:
        "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      alivio:
        "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      neutral: "bg-slate-500/10 border-slate-500/20 text-slate-400",
    };

    const label = emotion ? emotion.toUpperCase() : "NEUTRAL";
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border tracking-wider flex items-center gap-1.5 ${styles[emotionLower] || styles.neutral}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {label}
      </span>
    );
  };

  // Procesamiento local de filtrado y ordenación
  const processedHistory = history
    .filter((call) => {
      // 1. Filtro por término de búsqueda (ID de sesión o transcripción)
      const sessionMatch = call.session_id
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const transcriptMatch =
        call.transcript?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      if (searchTerm && !sessionMatch && !transcriptMatch) return false;

      // 2. Filtro por Métrica Cognitiva
      const satisfaccion = Number(call.call_state?.analisis?.satisfaccion) || 0;
      const interes = Number(call.call_state?.analisis?.interes) || 0;
      const angustia = Number(call.call_state?.analisis?.angustia) || 0;
      const urgencia = Number(call.call_state?.analisis?.urgencia) || 0;

      if (filterMetric === "high_satisfaction" && satisfaccion < 80)
        return false;
      if (filterMetric === "low_satisfaction" && satisfaccion > 50)
        return false;
      if (filterMetric === "high_stress" && angustia < 70) return false;
      if (filterMetric === "high_interest" && interes < 70) return false;
      if (filterMetric === "high_urgency" && urgencia < 70) return false;

      return true;
    })
    .sort((a, b) => {
      const stateA = a.call_state || {};
      const stateB = b.call_state || {};
      const satA = Number(stateA.analisis?.satisfaccion) || 0;
      const satB = Number(stateB.analisis?.satisfaccion) || 0;
      const urgA = Number(stateA.analisis?.urgencia) || 0;
      const urgB = Number(stateB.analisis?.urgencia) || 0;
      const dateA = new Date(a.timestamp || 0).getTime();
      const dateB = new Date(b.timestamp || 0).getTime();

      if (sortBy === "date_desc") return dateB - dateA;
      if (sortBy === "date_asc") return dateA - dateB;
      if (sortBy === "sat_desc") return satB - satA;
      if (sortBy === "sat_asc") return satA - satB;
      if (sortBy === "urg_desc") return urgB - urgA;

      return dateB - dateA;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans antialiased">
      {/* INJECT ANIMATION STYLE FOR WAVEFORM */}
      <style>{`
        @keyframes wavePlay {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        .animate-wave-bar {
          animation: wavePlay 1s ease-in-out infinite;
        }
        /* Custom scrollbar styling */
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* HEADER CENTRADO */}
      <div className="max-w-7xl mx-auto px-4 pt-12 md:pt-8">
        <Header />
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
              Historial de Llamadas
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Consulta el registro y análisis emocional en tiempo real de todas
              las simulaciones procesadas.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition-all border border-cyan-500/20 hover:border-cyan-500/30 flex items-center gap-2 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm animate-pulse">
              Cargando llamadas guardadas...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center max-w-xl mx-auto my-8">
            <ShieldAlert className="text-red-400 mx-auto mb-3" size={36} />
            <h4 className="text-md font-semibold text-white mb-2">
              Error de conexión
            </h4>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchHistory}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-all border border-white/5"
            >
              Reintentar
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center max-w-xl mx-auto my-8">
            <Frown className="text-slate-500 mx-auto mb-3" size={40} />
            <h4 className="text-md font-semibold text-white mb-1">
              Sin historial disponible
            </h4>
            <p className="text-sm text-slate-400">
              Aún no has procesado ninguna llamada en la simulación. Inicia una
              prueba en el panel **AI Voz** y las transcripciones aparecerán
              aquí.
            </p>
          </div>
        ) : (
          <>
            {/* PANEL DE FILTROS */}
            <div className="mb-6 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-cyan-400" />
                  Filtros y Búsqueda
                </span>
                {(searchTerm ||
                  filterMetric !== "all" ||
                  sortBy !== "date_desc") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterMetric("all");
                      setSortBy("date_desc");
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
                {/* Buscador */}
                <div className="md:col-span-5 relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por ID o transcripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950/40 border border-white/5 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 outline-none text-slate-200 placeholder-slate-500 transition-all"
                  />
                </div>

                {/* Filtrar por Métrica Cognitiva */}
                <div className="md:col-span-4">
                  <select
                    value={filterMetric}
                    onChange={(e) => setFilterMetric(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/40 border border-white/5 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 outline-none text-slate-300 transition-all cursor-pointer"
                  >
                    <option value="all" className="bg-slate-950 text-slate-300">
                      Todas las Métricas Cognitivas
                    </option>
                    <option
                      value="high_satisfaction"
                      className="bg-slate-950 text-slate-300"
                    >
                      Satisfacción: Alta (≥ 80%)
                    </option>
                    <option
                      value="low_satisfaction"
                      className="bg-slate-950 text-slate-300"
                    >
                      Satisfacción: Baja (≤ 50%)
                    </option>
                    <option
                      value="high_stress"
                      className="bg-slate-950 text-slate-300"
                    >
                      Estrés / Angustia: Alto (≥ 70%)
                    </option>
                    <option
                      value="high_interest"
                      className="bg-slate-950 text-slate-300"
                    >
                      Nivel de Interés: Alto (≥ 70%)
                    </option>
                    <option
                      value="high_urgency"
                      className="bg-slate-950 text-slate-300"
                    >
                      Nivel de Urgencia: Alto (≥ 70%)
                    </option>
                  </select>
                </div>

                {/* Ordenar por */}
                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/40 border border-white/5 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 outline-none text-slate-300 transition-all cursor-pointer"
                  >
                    <option
                      value="date_desc"
                      className="bg-slate-950 text-slate-300"
                    >
                      Fecha: Más recientes
                    </option>
                    <option
                      value="date_asc"
                      className="bg-slate-950 text-slate-300"
                    >
                      Fecha: Más antiguos
                    </option>
                    <option
                      value="sat_desc"
                      className="bg-slate-950 text-slate-300"
                    >
                      Satisfacción: Mayor primero
                    </option>
                    <option
                      value="sat_asc"
                      className="bg-slate-950 text-slate-300"
                    >
                      Satisfacción: Menor primero
                    </option>
                    <option
                      value="urg_desc"
                      className="bg-slate-950 text-slate-300"
                    >
                      Urgencia: Mayor primero
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* LISTADO DE LLAMADAS FILTRADAS */}
            {processedHistory.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center max-w-xl mx-auto my-8">
                <Search
                  className="text-slate-500 mx-auto mb-3 animate-pulse"
                  size={40}
                />
                <h4 className="text-md font-semibold text-white mb-1">
                  Sin resultados de búsqueda
                </h4>
                <p className="text-sm text-slate-400">
                  No encontramos registros de llamadas que coincidan con los
                  criterios o filtros seleccionados. Prueba modificando la
                  búsqueda o haciendo clic en **Limpiar Filtros**.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {processedHistory.map((call) => {
                  const sessionId = call.session_id;
                  const isExpanded = expandedSession === sessionId;
                  const state = call.call_state || {};
                  const analisis = state.analisis || {};
                  const resultado = state.resultado || {};
                  const accion = state.accion || {};
                  const copilot = state.copilot || {};
                  const guia_agente = copilot.guia_agente || {};

                  // Calcular valores de métricas y sanitizarlos
                  const emocion = analisis.emocion_principal || "neutral";
                  const satisfaccion = Number(analisis.satisfaccion) || 0;
                  const interes = Number(analisis.interes) || 0;
                  const angustia = Number(analisis.angustia) || 0;
                  const urgencia = Number(analisis.urgencia) || 0;

                  // Calcular radio y circunferencia para SVG circular de satisfacción
                  const radius = 16;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset =
                    circumference - (satisfaccion / 100) * circumference;

                  return (
                    <div
                      key={sessionId}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isExpanded
                          ? "border-cyan-500/30 bg-slate-900/60 shadow-[0_0_35px_rgba(6,182,212,0.06)]"
                          : "border-white/5 bg-slate-900/40 hover:border-white/10 hover:bg-slate-900/60"
                      }`}
                    >
                      {/* ACCORDION HEADER */}
                      <div
                        onClick={() => toggleExpand(sessionId)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 cursor-pointer select-none hover:bg-white/[0.01] transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                            <Phone size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                                ID:
                                <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/10 text-[11px]">
                                  #{sessionId.slice(-8).toUpperCase()}
                                </span>
                              </h3>
                              {getEmotionBadge(emocion)}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar
                                  size={12}
                                  className="text-slate-600"
                                />
                                {formatDate(call.timestamp)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} className="text-slate-600" />
                                {formatTime(call.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                          {/* Metrica de Satisfaccion circular */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold hidden sm:inline">
                              Satisfacción
                            </span>
                            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="16"
                                  className="stroke-white/5"
                                  strokeWidth="3"
                                  fill="transparent"
                                />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="16"
                                  className={`${
                                    satisfaccion >= 75
                                      ? "stroke-emerald-500"
                                      : satisfaccion >= 45
                                        ? "stroke-amber-500"
                                        : "stroke-red-500"
                                  } transition-all duration-500`}
                                  strokeWidth="3"
                                  fill="transparent"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute text-[10px] font-bold text-slate-200">
                                {satisfaccion}%
                              </span>
                            </div>
                          </div>

                          <div className="text-slate-500 hover:text-white transition-colors">
                            {isExpanded ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACCORDION BODY - Smooth Grid Height Transition */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          transition:
                            "grid-template-rows 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms",
                          opacity: isExpanded ? 1 : 0,
                        }}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-white/5 bg-slate-950/40 p-4 md:p-6 space-y-6">
                            {/* ACCIONES RAPIDAS DE CABECERA INTERNA */}
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="font-semibold text-slate-300">
                                  Sesión Completa:
                                </span>
                                <span className="font-mono text-slate-500 break-all select-all">
                                  {sessionId}
                                </span>
                                <button
                                  onClick={() =>
                                    handleCopy(sessionId, "session", sessionId)
                                  }
                                  className="p-1 hover:bg-white/5 rounded text-cyan-400 transition-colors"
                                  title="Copiar ID de Sesión"
                                >
                                  {copiedId === sessionId ? (
                                    <Check
                                      size={12}
                                      className="text-emerald-400"
                                    />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>

                              {/* REPRODUCTOR SIMULADO */}
                              <div className="flex items-center gap-3 bg-slate-900/60 border border-white/5 rounded-lg py-1.5 px-3">
                                <button
                                  onClick={() => togglePlayAudio(sessionId)}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                    playingAudio === sessionId
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                                  }`}
                                >
                                  {playingAudio === sessionId ? (
                                    <Pause size={12} />
                                  ) : (
                                    <Play size={12} className="ml-0.5" />
                                  )}
                                </button>

                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                                    Simulador de Audio
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {/* Waveform animation */}
                                    <div className="flex items-end gap-0.5 h-4 w-[60px]">
                                      {[...Array(10)].map((_, i) => {
                                        const delay = `${i * 0.08}s`;
                                        const isPlaying =
                                          playingAudio === sessionId;
                                        return (
                                          <div
                                            key={i}
                                            className={`w-[4px] bg-cyan-400/80 rounded-full transition-all duration-300 ${
                                              isPlaying
                                                ? "animate-wave-bar"
                                                : ""
                                            }`}
                                            style={{
                                              animationDelay: isPlaying
                                                ? delay
                                                : undefined,
                                              height: isPlaying
                                                ? undefined
                                                : `${3 + (i % 3) * 3}px`,
                                            }}
                                          />
                                        );
                                      })}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {playingAudio === sessionId
                                        ? `${Math.floor(((audioProgress[sessionId] || 0) / 100) * 10)}s`
                                        : getSimulatedDuration(call.transcript)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* FILA DE DETALLES PRINCIPALES */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              {/* COLUMNA TRANSCRIPCION */}
                              <div className="lg:col-span-6 space-y-3">
                                <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                                  <FileText
                                    size={14}
                                    className="text-cyan-400"
                                  />
                                  Transcripción Analizada
                                </h4>
                                <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 min-h-[160px] max-h-[240px] overflow-y-auto custom-scroll">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        Cliente
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleCopy(
                                            call.transcript,
                                            "session",
                                            sessionId + "-trans",
                                          )
                                        }
                                        className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                                      >
                                        {copiedId === sessionId + "-trans" ? (
                                          <>
                                            Copiado{" "}
                                            <Check
                                              size={10}
                                              className="text-emerald-400"
                                            />
                                          </>
                                        ) : (
                                          <>
                                            Copiar <Copy size={10} />
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap italic">
                                      "{call.transcript}"
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* COLUMNA METRICAS COGNITIVAS */}
                              <div className="lg:col-span-6 space-y-3">
                                <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                                  <Smile size={14} className="text-cyan-400" />
                                  Métricas Cognitivas
                                </h4>

                                <div className="grid grid-cols-2 gap-3.5">
                                  {/* Angustia / Estrés */}
                                  <div className="rounded-xl bg-white/[0.01] border border-white/5 p-3 flex flex-col justify-between hover:bg-white/[0.03] transition-colors relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-colors" />
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        Estrés / Angustia
                                      </span>
                                      <Activity
                                        size={12}
                                        className="text-red-400"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2.5 mt-4">
                                      <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full"
                                          style={{ width: `${angustia}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-slate-300 shrink-0 font-mono">
                                        {angustia}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Nivel de Interés */}
                                  <div className="rounded-xl bg-white/[0.01] border border-white/5 p-3 flex flex-col justify-between hover:bg-white/[0.03] transition-colors relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        Nivel de Interés
                                      </span>
                                      <Smile
                                        size={12}
                                        className="text-blue-400"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2.5 mt-4">
                                      <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full"
                                          style={{ width: `${interes}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-slate-300 shrink-0 font-mono">
                                        {interes}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Nivel de Urgencia */}
                                  <div className="rounded-xl bg-white/[0.01] border border-white/5 p-3 flex flex-col justify-between hover:bg-white/[0.03] transition-colors relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        Nivel de Urgencia
                                      </span>
                                      <AlertTriangle
                                        size={12}
                                        className="text-amber-400"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2.5 mt-4">
                                      <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                                          style={{ width: `${urgencia}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-slate-300 shrink-0 font-mono">
                                        {urgencia}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Satisfacción */}
                                  <div className="rounded-xl bg-white/[0.01] border border-white/5 p-3 flex flex-col justify-between hover:bg-white/[0.03] transition-colors relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        Satisfacción
                                      </span>
                                      <Heart
                                        size={12}
                                        className="text-emerald-400"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2.5 mt-4">
                                      <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 h-full rounded-full"
                                          style={{ width: `${satisfaccion}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">
                                        {satisfaccion}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* RESUMEN E INDICACIONES DE IA */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                              {/* Resumen del Copiloto */}
                              <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/70 transition-colors relative">
                                <h5 className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                                  <Sparkles
                                    size={12}
                                    className="text-purple-400"
                                  />
                                  Resumen Ejecutivo de la IA
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {resultado.resumen ||
                                    "No se generó un resumen para esta llamada."}
                                </p>
                                {resultado.palabras_clave &&
                                  resultado.palabras_clave.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {resultado.palabras_clave.map((kw, i) => (
                                        <span
                                          key={i}
                                          className="text-[9px] px-2.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 font-mono"
                                        >
                                          #{kw}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                              </div>

                              {/* Recomendación de Acción */}
                              <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-950/15 transition-colors relative group">
                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {guia_agente.como_decirlo && (
                                    <button
                                      onClick={() =>
                                        handleCopy(
                                          guia_agente.como_decirlo,
                                          "script",
                                          sessionId,
                                        )
                                      }
                                      className="p-1 bg-white/5 rounded text-cyan-400 hover:bg-white/10 transition-colors"
                                      title="Copiar guion recomendado"
                                    >
                                      {copiedScript === sessionId ? (
                                        <Check
                                          size={12}
                                          className="text-emerald-400"
                                        />
                                      ) : (
                                        <Copy size={12} />
                                      )}
                                    </button>
                                  )}
                                </div>

                                <h5 className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                                  <Sparkles
                                    size={12}
                                    className="text-cyan-400"
                                  />
                                  Recomendación de Copiloto
                                </h5>

                                <div className="space-y-2.5">
                                  <div>
                                    <span className="text-[9px] uppercase text-slate-500 font-bold block">
                                      Acción Recomendada
                                    </span>
                                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                                      {accion.recomendada ||
                                        guia_agente.que_hacer ||
                                        "Mantener atención estándar y guiar con empatía."}
                                    </p>
                                  </div>

                                  {guia_agente.como_decirlo && (
                                    <div className="border-t border-cyan-500/10 pt-2">
                                      <span className="text-[9px] uppercase text-slate-500 font-bold block">
                                        Guion Sugerido
                                      </span>
                                      <p className="text-xs text-cyan-400 italic bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/10 mt-1">
                                        "{guia_agente.como_decirlo}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
