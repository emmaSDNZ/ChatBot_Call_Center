import React, { useState, useEffect } from "react";
import { FiHeadphones } from "react-icons/fi";

import Header from "./components/Header";
import AnalysisResults from "./components/AnalysisResults";
import ConversationFlow from "./components/ConversationFlow";
import AudioRecorder from "./components/AudioRecorder";
import { apiService } from "./services/api";

import { usePageContextBridge } from "../../contexts/PageContextBridge";

export default function Main_Ia_Voz() {
  const [isOnline, setIsOnline] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [textInput, setTextInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const { setPageContext } = usePageContextBridge();

  useEffect(() => {
    if (!sessionId) {
      const randomId =
        "CALL_" + Math.random().toString(36).substring(2, 9).toUpperCase();
      setSessionId(randomId);
    }
  }, [sessionId]);

  useEffect(() => {
    const liveContext = {
      session_id: sessionId || "DEMO_001",
      page: "ia_voz",
      status: {
        isOnline,
        isLoading,
        currentStep,
      },
      analysis: analysisData
        ? {
            payload: analysisData,
          }
        : null,
      error,
    };

    setPageContext(liveContext);

    return () => {
      setPageContext(null);
    };
  }, [isOnline, isLoading, currentStep, analysisData, error, setPageContext]);

  useEffect(() => {
    const runInitialCheck = async () => {
      const startTime = Date.now();
      try {
        await apiService.healthCheck();
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        setTimeout(() => {
          setInitialLoading(false);
        }, remainingTime);
      }
    };
    runInitialCheck();

    const interval = setInterval(checkBackendStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      await apiService.healthCheck();
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  };

  const handleAnalyze = async () => {
    if (!textInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setCurrentStep(2);

    try {
      const result = await apiService.getCallState(
        textInput,
        sessionId || "DEMO_001",
      );

      console.log("🔥 BACKEND RESPONSE:", result);

      console.log("🔥 CALL STATE:", result.call_state);

      setAnalysisData(result.call_state);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || "Error al conectar con el backend");
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTextInput("");
    setAnalysisData(null);
    setError(null);
    setCurrentStep(1);
    const randomId =
      "CALL_" + Math.random().toString(36).substring(2, 9).toUpperCase();
    setSessionId(randomId);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center font-sans antialiased">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-slate-400 animate-pulse font-sans">
          Conectando con el motor cognitivo de IA Voz...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans antialiased">
      {/* Margen superior para compensar la barra eliminada */}
      <div className="max-w-7xl mx-auto px-4 pt-12 md:pt-8">
        <Header />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna del Flow del Copiloto */}
          <div className="col-span-1 lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/60 backdrop-blur-xl p-4 lg:p-5">
              <ConversationFlow currentStep={currentStep} />
            </div>
          </div>

          {/* Columna Principal - Adaptable sin scroll forzado */}
          <div className="lg:col-span-9">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              {currentStep === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <FiHeadphones size={22} className="text-cyan-400" />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold">
                        Simulación de Audio de Llamada
                      </h2>
                      <p className="text-sm text-slate-400">
                        Simula el audio de una llamada usando tus auriculares o
                        sube un archivo grabado.
                      </p>
                    </div>
                  </div>

                  {/* Entrada de Audio - Dos opciones side-by-side */}
                  <AudioRecorder
                    textInput={textInput}
                    setTextInput={setTextInput}
                    isTranscribing={isTranscribing}
                    setIsTranscribing={setIsTranscribing}
                    transcribeError={transcribeError}
                    setTranscribeError={setTranscribeError}
                    fileName={fileName}
                    setFileName={setFileName}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    sessionId={sessionId}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Transcripción del Audio (Editable)
                    </label>
                    <div className="relative">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        disabled={isTranscribing}
                        placeholder={
                          isTranscribing
                            ? "Mejorando transcripción con Whisper IA..."
                            : "La transcripción del audio aparecerá aquí... También puedes escribir tu propio texto manualmente."
                        }
                        className={`
                          w-full
                          min-h-[160px]
                          rounded-2xl
                          border
                          p-5
                          text-slate-100
                          resize-none
                          outline-none
                          transition-all duration-500
                          ${
                            isTranscribing
                              ? "bg-slate-950/40 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse"
                              : "bg-slate-950/60 border-white/10 focus:border-cyan-400/50"
                          }
                        `}
                      />
                      {isTranscribing && (
                        <div className="absolute top-4 right-4 flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/95 border border-cyan-500/30 rounded-xl shadow-lg">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                          <span className="text-[10px] font-semibold text-cyan-300 tracking-wider uppercase font-mono animate-pulse">
                            {fileName === "microfono_grabacion.webm"
                              ? "Optimizando con IA"
                              : "Procesando Audio"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={
                      isLoading ||
                      isTranscribing ||
                      isRecording ||
                      !textInput.trim()
                    }
                    className="
                      h-12
                      rounded-xl
                      bg-cyan-500
                      font-semibold
                      transition-all
                      hover:bg-cyan-400
                      disabled:opacity-50
                    "
                  >
                    Procesar Texto
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="relative w-12 h-12 mb-4">
                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Procesando llamada...
                  </h3>
                  <p className="text-xs text-slate-500 animate-pulse font-sans">
                    Analizando emoción, intención y contexto con IA Voz...
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  {/* Resultados estilizados reales */}
                  <AnalysisResults data={analysisData} />

                  {/* Contenedor JSON con scroll interno controlado para que no rompa el Main */}
                  <div className="rounded-xl border border-cyan-500/20 bg-slate-950/50 p-4">
                    <h3 className="mb-3 font-semibold text-sm text-slate-200">
                      JSON recibido del Backend
                    </h3>
                    <div className="max-h-60 overflow-y-auto rounded-lg bg-black/20 p-3">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">
                        {JSON.stringify(analysisData, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="
                      h-11
                      px-6
                      rounded-xl
                      bg-slate-800
                      hover:bg-slate-700
                      transition-all
                    "
                  >
                    Nueva prueba
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
