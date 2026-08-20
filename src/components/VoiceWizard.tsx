import React, { useState, useEffect, useRef } from "react";
import { Mic, RotateCcw, Check, Volume2 } from "lucide-react";
import { CitizenProfile, LanguageCode, NavTab } from "../types";
import { VOICE_STEPS } from "../data/mockData";
import { speakText, stopSpeaking, toBengaliNumerals, createSpeechRecognizer } from "../utils/speech";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface VoiceWizardProps {
  profile: CitizenProfile;
  onChangeProfile: (updated: Partial<CitizenProfile>) => void;
  onComplete: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onBack: () => void;
  onSelectNavTab: (tab: NavTab) => void;
}

export const VoiceWizard: React.FC<VoiceWizardProps> = ({
  profile,
  onChangeProfile,
  onComplete,
  currentLanguage,
  onSelectLanguage,
  onBack,
  onSelectNavTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const step = VOICE_STEPS[currentStepIndex];

  // Current value from profile
  const currentValue = (profile[step.fieldKey] as string) || "";

  // Question in chosen language
  const getQuestion = () => {
    if (currentLanguage === "hi") return step.questionHi;
    if (currentLanguage === "bn") return step.questionBn;
    return step.questionEn;
  };

  const getSubQuestion = () => {
    if (currentLanguage === "bn") return `(${step.questionEn})`;
    if (currentLanguage === "hi") return `(${step.questionEn})`;
    return `(${step.questionEn})`;
  };

  // Speak question aloud - Mic is strictly NOT started until speech + buffer completes
  const askQuestionAloud = () => {
    setIsSpeaking(true);
    // If mic was listening, stop it while AI speaks
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);

    const textToSpeak = getQuestion();
    const langCode = currentLanguage === "hi" ? "hi" : currentLanguage === "bn" ? "bn" : "en";
    
    console.log(`[TTS] VoiceWizard speaking: "${textToSpeak}" (lang: ${langCode})`);
    speakText(textToSpeak, langCode, () => {
      setIsSpeaking(false);
      console.log(`[TTS] VoiceWizard speech finished + buffer complete`);
    });
  };

  useEffect(() => {
    // Read aloud question on step change
    askQuestionAloud();
    return () => {
      stopSpeaking();
    };
  }, [currentStepIndex, currentLanguage]);

  // Handle voice mic recognition
  const handleToggleListening = () => {
    // If AI is currently speaking, stop AI speech first
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    console.log(`[MIC] VoiceWizard mic listening START at ${new Date().toISOString()}`);
    setIsListening(true);
    const langTag = currentLanguage === "hi" ? "hi-IN" : currentLanguage === "bn" ? "bn-IN" : "en-IN";
    
    const recognizer = createSpeechRecognizer(
      langTag,
      (transcript) => {
        console.log(`[MIC] VoiceWizard transcript: "${transcript}"`);
        // Parse numbers if step is number
        if (step.type === "number") {
          const matchedNum = transcript.match(/\d+/);
          if (matchedNum) {
            onChangeProfile({ [step.fieldKey]: matchedNum[0] });
          } else {
            // Keep transcript
            onChangeProfile({ [step.fieldKey]: transcript });
          }
        } else if (step.type === "boolean") {
          const lower = transcript.toLowerCase();
          const isYes = lower.includes("হ্যাঁ") || lower.includes("yes") || lower.includes("हाँ") || lower.includes("ache");
          onChangeProfile({ [step.fieldKey]: isYes });
        } else {
          onChangeProfile({ [step.fieldKey]: transcript });
        }
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
      } catch (err) {
        console.warn(err);
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  };

  const handleNext = () => {
    stopSpeaking();
    if (currentStepIndex < VOICE_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleRepeat = () => {
    stopSpeaking();
    askQuestionAloud();
  };

  // Display value formatting
  const displayValue = () => {
    if (!currentValue) {
      return currentLanguage === "bn"
        ? "— (উত্তর দিন / Say your answer)"
        : currentLanguage === "hi"
        ? "— (उत्तर दें / Say your answer)"
        : "— (Say or type answer)";
    }
    if (step.id === "age") {
      return currentLanguage === "bn" ? toBengaliNumerals(currentValue) : currentValue;
    }
    if (step.type === "boolean") {
      return currentValue ? "হ্যাঁ (Yes)" : "না (No)";
    }
    return currentValue;
  };

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={true}
        onBack={onBack}
        isVoiceActive={true}
        onToggleVoice={handleToggleListening}
      />

      <main className="max-w-md mx-auto w-full px-4 py-4 space-y-4 flex-1">
        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-2 py-2">
          {VOICE_STEPS.map((s, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={s.id}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCompleted
                    ? "bg-emerald-600"
                    : isCurrent
                    ? "bg-indigo-600 scale-125"
                    : "bg-slate-300"
                }`}
              />
            );
          })}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Question text with robot icon */}
          <div className="text-center space-y-2">
            <div className="text-3xl mb-1">🤖</div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              "{getQuestion()}"
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {getSubQuestion()}
            </p>
          </div>

          {/* Large Value Display Box */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center flex items-center justify-center min-h-[90px]">
            <span className="text-4xl font-extrabold text-slate-900 tracking-wide">
              {displayValue()}
            </span>
          </div>

          {/* Indigo Mic Tap to speak button */}
          <div className="flex flex-col items-center justify-center space-y-2 pt-1">
            <button
              id="voice-wizard-mic-button"
              onClick={handleToggleListening}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer relative ${
                isSpeaking
                  ? "bg-indigo-700 text-white animate-pulse ring-4 ring-indigo-300"
                  : isListening
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-200 animate-pulse scale-105"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
              title={isSpeaking ? "AI is speaking..." : isListening ? "Listening..." : "Tap to speak"}
            >
              {isSpeaking ? (
                <Volume2 className="w-8 h-8 stroke-[2.2] animate-bounce" />
              ) : (
                <Mic className="w-8 h-8 stroke-[2.2]" />
              )}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                </span>
              )}
            </button>
            <span className="text-xs font-semibold text-slate-700">
              {isSpeaking
                ? currentLanguage === "bn"
                  ? "সহায়ক কথা বলছে..."
                  : currentLanguage === "hi"
                  ? "सहायक बोल रही है..."
                  : "AI is speaking..."
                : isListening
                ? currentLanguage === "bn"
                  ? "শুনছি... (Listening)"
                  : currentLanguage === "hi"
                  ? "सुन रहे हैं... (Listening)"
                  : "Listening..."
                : currentLanguage === "bn"
                ? "বলতে ট্যাপ করুন (Tap to speak)"
                : currentLanguage === "hi"
                ? "बोलने के लिए टैप करें (Tap to speak)"
                : "Tap to speak"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Correct Button */}
            <button
              id="btn-voice-correct"
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {currentLanguage === "bn"
                  ? "✓ ঠিক আছে (Correct)"
                  : currentLanguage === "hi"
                  ? "✓ ठीक है (Correct)"
                  : "✓ Correct / Next"}
              </span>
            </button>

            {/* Say Again Button */}
            <button
              id="btn-voice-say-again"
              onClick={handleRepeat}
              className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4 text-slate-500 stroke-[2]" />
              <span>
                {currentLanguage === "bn"
                  ? "🔁 আবার বলুন (Say again)"
                  : currentLanguage === "hi"
                  ? "🔁 दोबारा सुनें (Say again)"
                  : "🔁 Say again"}
              </span>
            </button>
          </div>
        </div>
      </main>

      <BottomNav currentTab="schemes" onSelectTab={onSelectNavTab} />
    </div>
  );
};
