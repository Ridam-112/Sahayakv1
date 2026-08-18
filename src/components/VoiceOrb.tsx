import React from "react";
import { Mic, MicOff, Volume2, Loader2, Square } from "lucide-react";

export type VoiceOrbState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "stopped";

interface VoiceOrbProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  state?: VoiceOrbState;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  isListening = false,
  isSpeaking = false,
  state,
  onClick,
  size = "lg",
}) => {
  // Infer active state if not explicitly passed
  const activeState: VoiceOrbState =
    state || (isSpeaking ? "speaking" : isListening ? "listening" : "idle");

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div className="relative flex items-center justify-center py-4">
      {/* Outer ambient glow rings when active */}
      {activeState === "listening" && (
        <>
          <div className="absolute w-44 h-44 rounded-full bg-indigo-400/20 animate-ping opacity-60 pointer-events-none" />
          <div className="absolute w-40 h-40 rounded-full bg-indigo-500/25 animate-pulse pointer-events-none" />
          <div className="absolute w-36 h-36 rounded-full border-2 border-indigo-400/50 animate-spin opacity-40 pointer-events-none" />
        </>
      )}

      {activeState === "speaking" && (
        <>
          <div className="absolute w-40 h-40 rounded-full bg-emerald-400/20 animate-pulse pointer-events-none" />
          <div className="absolute w-36 h-36 rounded-full border border-emerald-400/40 animate-ping opacity-40 pointer-events-none" />
        </>
      )}

      {activeState === "thinking" && (
        <>
          <div className="absolute w-36 h-36 rounded-full border-2 border-amber-400/50 border-t-amber-600 animate-spin pointer-events-none" />
        </>
      )}

      {/* Main Interactive Button Orb */}
      <button
        id="voice-agent-orb"
        onClick={onClick}
        className={`${sizeClasses[size]} rounded-full flex flex-col items-center justify-center relative z-10 transition-all duration-300 shadow-xl cursor-pointer active:scale-95 ${
          activeState === "listening"
            ? "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-700 text-white ring-4 ring-indigo-300 shadow-indigo-300/50"
            : activeState === "speaking"
            ? "bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 text-white ring-4 ring-emerald-200 shadow-emerald-200/50 animate-pulse"
            : activeState === "thinking"
            ? "bg-gradient-to-tr from-amber-600 to-amber-700 text-white ring-4 ring-amber-200 shadow-amber-200/50"
            : activeState === "stopped"
            ? "bg-slate-700 text-white hover:bg-slate-800"
            : "bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-200/50 hover:shadow-2xl"
        }`}
        aria-label={
          activeState === "listening"
            ? "Listening, tap to pause"
            : activeState === "speaking"
            ? "Sahayak speaking, tap to interrupt"
            : "Start speaking with Sahayak"
        }
      >
        {activeState === "speaking" ? (
          <Volume2 className={`${iconSizes[size]} animate-bounce stroke-[2]`} />
        ) : activeState === "thinking" ? (
          <Loader2 className={`${iconSizes[size]} animate-spin stroke-[2]`} />
        ) : activeState === "stopped" ? (
          <Square className={`${iconSizes[size]} fill-current stroke-[2]`} />
        ) : (
          <Mic
            className={`${iconSizes[size]} stroke-[2.2] ${
              activeState === "listening" ? "scale-110" : ""
            }`}
          />
        )}

        {/* Live Audio Waveform Dots inside orb */}
        <div className="flex items-center gap-1 mt-1.5">
          <span
            className={`w-1 rounded-full bg-white transition-all ${
              activeState === "listening"
                ? "h-3 animate-pulse"
                : activeState === "speaking"
                ? "h-2.5 animate-bounce"
                : "h-1 opacity-70"
            }`}
          />
          <span
            className={`w-1 rounded-full bg-white transition-all ${
              activeState === "listening"
                ? "h-4.5 animate-pulse delay-75"
                : activeState === "speaking"
                ? "h-4 animate-bounce delay-100"
                : "h-1 opacity-70"
            }`}
          />
          <span
            className={`w-1 rounded-full bg-white transition-all ${
              activeState === "listening"
                ? "h-3 animate-pulse delay-150"
                : activeState === "speaking"
                ? "h-2.5 animate-bounce delay-200"
                : "h-1 opacity-70"
            }`}
          />
        </div>
      </button>
    </div>
  );
};
