import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Languages,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  Play,
  Settings2,
} from "lucide-react";
import {
  getTtsDebugInfo,
  subscribeTtsDebugInfo,
  TtsDebugInfo,
  testBengaliAudioIsolated,
  getAvailableVoices,
  stopSpeaking,
} from "../utils/speech";
import { LanguageCode } from "../types";

interface TtsDebugIndicatorProps {
  currentLanguage: LanguageCode;
}

export const TtsDebugIndicator: React.FC<TtsDebugIndicatorProps> = ({
  currentLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<TtsDebugInfo>(getTtsDebugInfo());
  const [testingLang, setTestingLang] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTtsDebugInfo((info) => {
      setDebugInfo(info);
    });
    // Trigger initial voices check
    getAvailableVoices();
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTestAudio = async (lang: "bn" | "hi" | "en") => {
    setTestingLang(lang);
    try {
      await testBengaliAudioIsolated(lang);
    } finally {
      setTestingLang(null);
    }
  };

  const getTargetLocale = (lang: string) => {
    if (lang === "bn") return "bn-IN";
    if (lang === "hi") return "hi-IN";
    if (lang === "en") return "en-IN";
    return `${lang}-IN`;
  };

  const activeLocale = getTargetLocale(currentLanguage);

  return (
    <div className="fixed bottom-20 left-4 z-50 font-sans text-xs select-none">
      {/* Floating Pill Badge */}
      <button
        id="tts-debug-indicator-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-lg border border-slate-700/60 backdrop-blur-md transition-all hover:scale-105"
        title="Click to inspect TTS Language & Voice Diagnostics"
      >
        <span className="relative flex h-2 w-2">
          {debugInfo.status === "Speaking" ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : debugInfo.status === "Aborted (Missing Voice)" ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
          )}
        </span>
        <span className="font-semibold tracking-wide text-[11px] text-slate-200">
          TTS: <span className="text-emerald-400 font-mono font-bold">{activeLocale}</span>
        </span>
        <span className="text-slate-400 text-[10px]">
          ({debugInfo.status === "Speaking" ? "Speaking" : debugInfo.engine === "Idle" ? "Ready" : debugInfo.engine})
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        )}
      </button>

      {/* Expanded Diagnostic Card */}
      {isOpen && (
        <div
          id="tts-debug-panel"
          className="mt-2 w-80 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700/80 p-3.5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <span>TTS Locale & Voice Diagnostics</span>
            </div>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-800">
              Dev Mode
            </span>
          </div>

          {/* Status Matrix */}
          <div className="bg-slate-950/60 rounded-lg p-2.5 space-y-2 border border-slate-800/80 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Target Locale:</span>
              <span className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/50 rounded border border-emerald-800/50">
                {activeLocale}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Engine:</span>
              <span className="text-slate-200">{debugInfo.engine}</span>
            </div>

            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-400 shrink-0">Active Voice:</span>
              <span className="text-slate-300 text-right truncate max-w-[170px]" title={debugInfo.voiceName}>
                {debugInfo.voiceName}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Playback Status:</span>
              <span
                className={`font-semibold ${
                  debugInfo.status === "Speaking"
                    ? "text-emerald-400 animate-pulse"
                    : debugInfo.status === "Aborted (Missing Voice)"
                    ? "text-amber-400"
                    : "text-slate-400"
                }`}
              >
                {debugInfo.status}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Device Synthesizers:</span>
              <span className="text-slate-300">{debugInfo.totalVoicesInstalled} voices found</span>
            </div>
          </div>

          {/* Installed Bengali Voices Checklist */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
              <span>Verified bn-IN Voices on Device:</span>
              <span className="text-[10px] text-slate-400">
                {debugInfo.availableBengaliVoices.length} found
              </span>
            </div>
            <div className="max-h-20 overflow-y-auto bg-slate-950/50 rounded p-1.5 border border-slate-800 text-[10px] space-y-1">
              {debugInfo.availableBengaliVoices.length > 0 ? (
                debugInfo.availableBengaliVoices.map((v, i) => (
                  <div key={i} className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{v}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1 text-slate-400 italic">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>No browser bn-IN voice (falls back to Gemini TTS or safe text-only)</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Voice Isolation Testers */}
          <div className="space-y-1.5 pt-1">
            <span className="text-slate-400 text-[10px] font-medium">Verify Voice Output (Direct Test):</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                id="btn-test-bn-tts"
                disabled={testingLang !== null}
                onClick={() => handleTestAudio("bn")}
                className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-1 px-1.5 rounded transition text-[10px]"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>bn-IN (বাংলা)</span>
              </button>

              <button
                id="btn-test-hi-tts"
                disabled={testingLang !== null}
                onClick={() => handleTestAudio("hi")}
                className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-1 px-1.5 rounded transition text-[10px]"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>hi-IN (हिन्दी)</span>
              </button>

              <button
                id="btn-test-en-tts"
                disabled={testingLang !== null}
                onClick={() => handleTestAudio("en")}
                className="flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium py-1 px-1.5 rounded transition text-[10px]"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>en-IN (Eng)</span>
              </button>
            </div>
          </div>

          {/* Safety Rule Note */}
          <div className="text-[9.5px] text-slate-400 border-t border-slate-800 pt-1.5 leading-relaxed">
            🛡️ <strong className="text-slate-300">Strict Locale Rule Active:</strong> Bengali audio is strictly constrained to <code className="text-emerald-400 bg-slate-950 px-1 rounded">bn-IN</code>. Assamese (<code className="text-slate-400">as-IN</code>) and Odia (<code className="text-slate-400">or-IN</code>) are explicitly rejected.
          </div>
        </div>
      )}
    </div>
  );
};
