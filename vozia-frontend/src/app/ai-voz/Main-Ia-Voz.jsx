import React, { useState, useEffect, useRef } from "react";
import {
  FiMic,
  FiCheckCircle,
  FiAlertCircle,
  FiUploadCloud,
  FiSquare,
} from "react-icons/fi";

import Header from "./components/Header";
import AnalysisResults from "./components/AnalysisResults";
import ConversationFlow from "./components/ConversationFlow";
import { apiService } from "./services/api";

import { usePageContextBridge } from "../../contexts/PageContextBridge";

export default function Main_Ia_Voz() {
  const [isOnline, setIsOnline] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [textInput, setTextInput] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeError, setTranscribeError] = useState(null);
  const [fileName, setFileName] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API no está soportado en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-ES";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const currentVal = finalTranscript + interimTranscript;
      if (currentVal.trim()) {
        setTextInput(currentVal.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento de voz:", event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Convierte un AudioBuffer de la Web Audio API a un Blob en formato WAV PCM de 16-bit
  const bufferToWav = (buffer) => {
    let numOfChan = buffer.numberOfChannels,
      length = buffer.length * 2 + 44,
      bufferArr = new ArrayBuffer(length),
      view = new DataView(bufferArr),
      channels = [],
      i,
      sample,
      offset = 0,
      pos = 0;

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // Longitud del archivo - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // Chunk "fmt "
    setUint32(16); // Longitud del chunk
    setUint16(1); // Formato PCM sin compresión
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // Byte rate
    setUint16(numOfChan * 2); // Block align
    setUint16(16); // Bits por muestra (16 bits)
    setUint32(0x61746164); // Chunk "data"
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // Limitar
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // Escalar a entero de 16 bits
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([bufferArr], { type: "audio/wav" });
  };

  const processAudioBlob = async (blob, name) => {
    setIsTranscribing(true);
    setTranscribeError(null);
    setTranscribeProgress(10);
    setFileName(name);

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      setTranscribeProgress(30);

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setTranscribeProgress(50);

      const offlineCtx = new OfflineAudioContext(
        1,
        audioBuffer.duration * 16000,
        16000,
      );

      const bufferSource = offlineCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(offlineCtx.destination);
      bufferSource.start();

      const resampledBuffer = await offlineCtx.startRendering();
      setTranscribeProgress(70);

      const wavBlob = bufferToWav(resampledBuffer);
      setTranscribeProgress(85);

      const data = await apiService.transcribeAudio(wavBlob);
      setTranscribeProgress(100);

      if (name === "microfono_grabacion.webm") {
        setTextInput(data.transcript);
      } else {
        simulateTypingEffect(data.transcript);
      }
    } catch (err) {
      console.error("Error transcribiendo audio:", err);
      setTranscribeError(
        err.message || "Error al procesar y transcribir el audio.",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    setTranscribeError(null);
    audioChunksRef.current = [];
    setRecordingTime(0);
    setTextInput("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        processAudioBlob(audioBlob, "microfono_grabacion.webm");
      };

      mediaRecorder.start(10);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      const isChrome =
        /Chrome/.test(navigator.userAgent) &&
        /Google Inc/.test(navigator.vendor);
      if (isChrome) {
        startSpeechRecognition();
      }
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      setTranscribeError(
        "No se pudo acceder al micrófono. Por favor, verifica los permisos.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const simulateTypingEffect = (text) => {
    let currentText = "";
    let i = 0;
    setTextInput("");

    const words = text.split(" ");
    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? "" : " ") + words[i];
        setTextInput(currentText);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 70);
  };

  const { setPageContext } = usePageContextBridge();

  useEffect(() => {
    const liveContext = {
      session_id: "DEMO_001",
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
    checkBackendStatus();
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
      const result = await apiService.getCallState(textInput, "DEMO_001");

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans antialiased">
      {/* Margen superior para compensar la barra eliminada */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
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
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <FiMic size={22} />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold">
                        Simulación de Transcripción
                      </h2>
                      <p className="text-sm text-slate-400">
                        Graba desde tu micrófono o sube un audio para
                        transcribirlo con IA.
                      </p>
                    </div>
                  </div>

                  {/* Entrada de Audio - Dos opciones side-by-side */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Entrada de Audio ( Whisper Real )
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Opción 1: Drag & Drop */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (!isTranscribing && !isRecording) {
                            setIsDragging(true);
                          }
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (isTranscribing || isRecording) return;
                          const files = e.dataTransfer.files;
                          if (files.length > 0) {
                            processAudioBlob(files[0], files[0].name);
                          }
                        }}
                        onClick={() => {
                          if (!isTranscribing && !isRecording) {
                            document.getElementById("audio-file-input").click();
                          }
                        }}
                        className={`
                          relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group
                          ${
                            isDragging
                              ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-[1.01]"
                              : "border-white/10 bg-slate-900/40 hover:border-cyan-500/30 hover:bg-slate-900/60"
                          }
                          ${isTranscribing || isRecording ? "opacity-40 cursor-not-allowed" : ""}
                        `}
                      >
                        <input
                          id="audio-file-input"
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          disabled={isTranscribing || isRecording}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              processAudioBlob(files[0], files[0].name);
                            }
                          }}
                        />

                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                            <FiUploadCloud size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              Subir Archivo de Audio
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Arrastra o haz clic. MP3, WAV, M4A, WebM.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Opción 2: Grabar Micrófono */}
                      <div
                        onClick={() => {
                          if (isTranscribing) return;
                          if (isRecording) {
                            stopRecording();
                          } else {
                            startRecording();
                          }
                        }}
                        className={`
                          relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group
                          ${
                            isRecording
                              ? "border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-[1.01]"
                              : "border-white/10 bg-slate-900/40 hover:border-cyan-500/30 hover:bg-slate-900/60"
                          }
                          ${isTranscribing ? "opacity-40 cursor-not-allowed" : ""}
                        `}
                      >
                        {isRecording ? (
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 relative">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                              <FiSquare size={20} className="relative z-10" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-red-200">
                                Grabando llamada...
                              </p>
                              <p className="text-xs font-mono text-red-400 mt-1 font-semibold">
                                {formatTime(recordingTime)} (Haz clic para
                                detener)
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                              <FiMic size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-200">
                                Grabar con Micrófono
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Habla en tiempo real y transcribe en vivo.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estado de Transcripción General */}
                    {isTranscribing && (
                      <div className="flex items-center justify-center gap-3 p-4 mt-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <div className="absolute inset-0 border-3 border-cyan-500/20 rounded-full"></div>
                          <div className="absolute inset-0 border-3 border-t-cyan-400 rounded-full animate-spin"></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-cyan-300 animate-pulse">
                            Transcribiendo con Whisper/Google... (
                            {transcribeProgress}%)
                          </span>
                          <span className="text-xs text-slate-400">
                            Procesando "{fileName}"
                          </span>
                        </div>
                      </div>
                    )}

                    {transcribeError && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 mt-2 text-xs text-red-200">
                        ⚠️ {transcribeError}
                      </div>
                    )}
                  </div>

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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse"></div>
                    <div className="absolute inset-2 rounded-full bg-cyan-500/40 flex items-center justify-center">
                      <FiMic className="text-white" size={26} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-white mb-2">
                    Procesando llamada
                  </h3>

                  <p className="text-slate-300 text-sm max-w-md">
                    Analizando emoción, intención y contexto...
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
