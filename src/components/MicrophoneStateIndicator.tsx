import React from "react";
import { Mic, Volume2, Loader2, Sparkles, Radio, CheckCircle2, AlertCircle } from "lucide-react";
import { LanguageCode } from "../types";
import { TurnState, VoiceOrbState } from "./VoiceOrb";

export interface MicrophoneStateIndicatorProps {
  turnState: TurnState | VoiceOrbState;
  currentLanguage: LanguageCode;
  volumeLevel?: number;
  interimTranscript?: string;
  hasSpeechDetected?: boolean;
  onMicClick?: () => void;
  className?: string;
}

export const MicrophoneStateIndicator: React.FC<MicrophoneStateIndicatorProps> = ({
  turnState,
  currentLanguage,
  volumeLevel = 0,
  interimTranscript,
  hasSpeechDetected = false,
  onMicClick,
  className = "",
}) => {
  // Determine normalized state
  const isListening =
    turnState === "WAITING_FOR_USER" ||
    turnState === "USER_SPEAKING" ||
    turnState === "listening";

  const isUserSpeaking =
    turnState === "USER_SPEAKING" || (isListening && (volumeLevel > 0.05 || hasSpeechDetected));

  const isProcessing =
    turnState === "PROCESSING_USER" ||
    turnState === "thinking" ||
    turnState === "connecting";

  const isAssistantSpeaking =
    turnState === "ASSISTANT_SPEAKING" || turnState === "speaking";

  const isIdle =
    turnState === "IDLE" || turnState === "idle" || turnState === "stopped";

  // Dynamic status text & subtitles
  const getStatusContent = () => {
    if (isUserSpeaking) {
      return {
        badge: currentLanguage === "bn" ? "কথা বলছেন" : currentLanguage === "hi" ? "आप बोल रहे हैं" : "Listening to you",
        headline:
          currentLanguage === "bn"
            ? "আপনার কথা শোনা হচ্ছে... বলা শেষ হলে অপেক্ষা করুন"
            : currentLanguage === "hi"
            ? "आपकी बात सुनी जा रही है... बोलने के बाद रुकें"
            : "Hearing your voice... Pause when done speaking",
        colorClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-800",
        dotColor: "bg-emerald-500 animate-ping",
        icon: Radio,
        actionHint:
          currentLanguage === "bn"
            ? "কথা শেষ হলে স্বয়ংক্রিয়ভাবে জমা হবে"
            : currentLanguage === "hi"
            ? "बोलना बंद करने पर अपने आप सबमिट होगा"
            : "Will auto-submit when you finish speaking",
      };
    }

    if (isListening) {
      return {
        badge: currentLanguage === "bn" ? "মাইক্রোফোন চালু" : currentLanguage === "hi" ? "माइक चालू है" : "Microphone Active",
        headline:
          currentLanguage === "bn"
            ? "এখন আপনার উত্তর স্পষ্ট করে বলুন"
            : currentLanguage === "hi"
            ? "अब अपना उत्तर साफ़ आवाज़ में बोलिए"
            : "Speak your response clearly now",
        colorClass: "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm",
        dotColor: "bg-emerald-600 animate-pulse",
        icon: Mic,
        actionHint:
          currentLanguage === "bn"
            ? "সহায়ক আপনার কথা শুনছে"
            : currentLanguage === "hi"
            ? "सहायक आपकी आवाज़ सुन रही है"
            : "Sahayak is actively listening",
      };
    }

    if (isProcessing) {
      return {
        badge: currentLanguage === "bn" ? "বিশ্লেষণ হচ্ছে" : currentLanguage === "hi" ? "विश्लेषण जारी" : "Processing Audio",
        headline:
          currentLanguage === "bn"
            ? "আপনার উত্তর ও তথ্য যাচাই করা হচ্ছে..."
            : currentLanguage === "hi"
            ? "आपके उत्तर और जानकारी की जांच हो रही है..."
            : "Analyzing your response with AI...",
        colorClass: "bg-amber-50 border-amber-300 text-amber-900 shadow-sm",
        dotColor: "bg-amber-600 animate-spin",
        icon: Loader2,
        actionHint:
          currentLanguage === "bn"
            ? "অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন"
            : currentLanguage === "hi"
            ? "कृपया एक पल प्रतीक्षा करें"
            : "Please wait a moment",
      };
    }

    if (isAssistantSpeaking) {
      return {
        badge: currentLanguage === "bn" ? "সহায়ক কথা বলছে" : currentLanguage === "hi" ? "सहायक बोल रही है" : "Sahayak Speaking",
        headline:
          currentLanguage === "bn"
            ? "সহায়কের নির্দেশনা শুনুন (বাধা দিতে ট্যাপ করুন)"
            : currentLanguage === "hi"
            ? "निर्देश सुनें (बीच में बोलने के लिए टैप करें)"
            : "Listen to instructions (Tap orb to interrupt)",
        colorClass: "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm",
        dotColor: "bg-indigo-600 animate-bounce",
        icon: Volume2,
        actionHint:
          currentLanguage === "bn"
            ? "কথা শেষ হলে মাইক্রোফোন স্বয়ংক্রিয়ভাবে চালু হবে"
            : currentLanguage === "hi"
            ? "बोलने के बाद माइक अपने आप चालू होगा"
            : "Microphone will activate right after speech",
      };
    }

    // Default: IDLE
    return {
      badge: currentLanguage === "bn" ? "মাইক্রোফোন প্রস্তুত" : currentLanguage === "hi" ? "माइक तैयार है" : "Microphone Ready",
      headline:
        currentLanguage === "bn"
          ? "কথা শুরু করতে মাঝের মাইক বোতামে চাপুন"
          : currentLanguage === "hi"
          ? "बातचीत शुरू करने के लिए माइक बटन दबाएं"
          : "Tap the center microphone to start speaking",
      colorClass: "bg-slate-50 border-slate-200 text-slate-700",
      dotColor: "bg-slate-400",
      icon: Mic,
      actionHint:
        currentLanguage === "bn"
          ? "সহায়ক আপনার সাহায্যে প্রস্তুত"
          : currentLanguage === "hi"
          ? "सहायक आपकी मदद के लिए तैयार है"
          : "Ready to assist with welfare schemes",
    };
  };

  const currentStatus = getStatusContent();
  const IconComponent = currentStatus.icon;

  // Render dynamic audio wave bars based on real-time volume
  const waveHeights = [
    Math.max(4, Math.min(24, Math.round(volumeLevel * 30 + 4))),
    Math.max(6, Math.min(32, Math.round(volumeLevel * 45 + 6))),
    Math.max(8, Math.min(40, Math.round(volumeLevel * 60 + 8))),
    Math.max(5, Math.min(28, Math.round(volumeLevel * 38 + 5))),
  ];

  return (
    <div
      id="microphone-state-indicator"
      className={`w-full max-w-lg mx-auto rounded-2xl border transition-all duration-300 p-3.5 ${currentStatus.colorClass} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Status Icon & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/90 shadow-xs shrink-0">
            <IconComponent
              className={`w-4 h-4 ${
                isProcessing
                  ? "animate-spin text-amber-600"
                  : isUserSpeaking || isListening
                  ? "text-emerald-600"
                  : isAssistantSpeaking
                  ? "text-indigo-600 animate-pulse"
                  : "text-slate-500"
              }`}
            />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${currentStatus.dotColor}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">
                {currentStatus.badge}
              </span>
              {isListening && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-600 text-white animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold truncate leading-tight mt-0.5">
              {currentStatus.headline}
            </p>
          </div>
        </div>

        {/* Right: Audio Waveform Activity or Status Pill */}
        <div className="shrink-0 flex items-center gap-2">
          {isListening ? (
            <div className="flex items-center gap-1 h-6 px-2 py-1 bg-white/80 rounded-lg shadow-2xs border border-emerald-200">
              {waveHeights.map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          ) : isProcessing ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/80 rounded-lg shadow-2xs border border-amber-200 text-amber-700 text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI</span>
            </div>
          ) : isAssistantSpeaking ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/80 rounded-lg shadow-2xs border border-indigo-200 text-indigo-700 text-xs font-medium">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Audio</span>
            </div>
          ) : (
            <button
              onClick={onMicClick}
              className="text-xs font-medium px-2.5 py-1 bg-white/90 hover:bg-white rounded-lg shadow-2xs border border-slate-200 text-slate-700 transition cursor-pointer"
            >
              {currentLanguage === "bn" ? "শুরু করুন" : currentLanguage === "hi" ? "शुरू करें" : "Start"}
            </button>
          )}
        </div>
      </div>

      {/* Subtitle / Helper Hint Bar */}
      <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] opacity-85">
        <span className="truncate">{currentStatus.actionHint}</span>
        {isListening && (
          <span className="font-semibold text-emerald-700 shrink-0 ml-2">
            {currentLanguage === "bn"
              ? "কথা বলুন..."
              : currentLanguage === "hi"
              ? "बोलिए..."
              : "Speak..."}
          </span>
        )}
      </div>

      {/* Live Interim Transcript Bubble if user is actively speaking */}
      {interimTranscript && isListening && (
        <div className="mt-2 p-2 bg-white/90 rounded-xl border border-emerald-200/80 text-xs text-slate-800 animate-fadeIn">
          <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">
            {currentLanguage === "bn" ? "শোনা যাচ্ছে:" : currentLanguage === "hi" ? "सुना जा रहा है:" : "Live transcript:"}
          </span>
          <p className="italic font-medium">"{interimTranscript}"</p>
        </div>
      )}
    </div>
  );
};
