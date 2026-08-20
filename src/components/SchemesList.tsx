import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Edit2,
  MessageSquare,
  Info,
  Mic,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { Scheme, LanguageCode, NavTab } from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { createSpeechRecognizer } from "../utils/speech";

interface SchemesListProps {
  schemes: Scheme[];
  onSelectScheme: (scheme: Scheme) => void;
  onUpdateSchemeInfo: (scheme: Scheme) => void;
  onAskQuestion: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectNavTab: (tab: NavTab) => void;
  onBack?: () => void;
}

export const SchemesList: React.FC<SchemesListProps> = ({
  schemes,
  onSelectScheme,
  onUpdateSchemeInfo,
  onAskQuestion,
  currentLanguage,
  onSelectLanguage,
  onSelectNavTab,
  onBack,
}) => {
  const [activeReasonModal, setActiveReasonModal] = useState<Scheme | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleToggleVoiceSearch = () => {
    console.log("[VOICE INPUT] Mic tap detected in SchemesList search bar.");
    setMicError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const langTag = currentLanguage === "hi" ? "hi-IN" : currentLanguage === "bn" ? "bn-IN" : "en-IN";
    console.log(`[VOICE INPUT] Starting speech recognition in SchemesList (lang: ${langTag})`);

    const recognizer = createSpeechRecognizer(
      langTag,
      (transcript) => {
        console.log(`[VOICE INPUT] Raw transcript received: "${transcript}"`);
        console.log(`[VOICE INPUT] Transcript passed to app state (searchQuery): "${transcript}"`);
        setSearchQuery(transcript);
        setIsListening(false);
      },
      (err) => {
        console.warn("[VOICE INPUT] Speech recognition error:", err);
        setIsListening(false);
        if (err === "not-allowed" || err === "service-not-allowed") {
          setMicError(
            currentLanguage === "bn"
              ? "মাইক্রোফোনের অনুমতি দেওয়া হয়নি। দয়া করে ব্রাউজারে অনুমতি দিন বা টাইপ করুন।"
              : currentLanguage === "hi"
              ? "माइक्रोफ़ोन की अनुमति नहीं है। कृपया अनुमति दें या टाइप करें।"
              : "Microphone access denied. Please allow microphone access or type."
          );
        } else {
          setMicError(
            currentLanguage === "bn"
              ? "কথা বোঝা যায়নি। আবার বলুন বা টাইপ করুন।"
              : currentLanguage === "hi"
              ? "आवाज़ नहीं पहचानी गई। कृपया पुनः बोलें या लिखें।"
              : "Could not recognize voice. Please try again or type."
          );
        }
      },
      (interim) => {
        console.log(`[VOICE INPUT] Interim search transcript: "${interim}"`);
        setSearchQuery(interim);
      }
    );

    if (!recognizer) {
      setMicError(
        currentLanguage === "bn"
          ? "আপনার ব্রাউজারে ভয়েস সার্চ সমর্থিত নয়।"
          : currentLanguage === "hi"
          ? "आपके ब्राउज़र में वॉयस सर्च समर्थित नहीं है।"
          : "Voice search is not supported in this browser."
      );
      return;
    }

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
      setIsListening(true);
      console.log("[VOICE INPUT] recognition.start() called in SchemesList.");
    } catch (e) {
      console.warn("[VOICE INPUT] Failed to start recognition:", e);
      setIsListening(false);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.fullName || "").toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.benefitShort || "").toLowerCase().includes(q) ||
      (s.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={!!onBack}
        onBack={onBack}
      />

      <main className="max-w-md mx-auto w-full px-4 py-5 space-y-4 flex-1 pb-20">
        {/* Header Title */}
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {schemes.length} schemes found for you
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Based on the information you provided.
          </p>
        </div>

        {/* Search & Voice Filter */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              id="input-schemes-list-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLanguage === "bn"
                  ? "প্রকল্প খুঁজুন বা মাইক চেপে বলুন..."
                  : currentLanguage === "hi"
                  ? "योजना खोजें या माइक दबाकर बोलें..."
                  : "Search schemes or speak..."
              }
              className="w-full pl-9 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                id="btn-schemes-list-voice"
                onClick={handleToggleVoiceSearch}
                className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-xs"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
                title={isListening ? "Listening... tap to stop" : "Speak to search"}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Listening State */}
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold animate-pulse">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>
                  {currentLanguage === "bn"
                    ? "🎙️ শুনছি... বলুন"
                    : currentLanguage === "hi"
                    ? "🎙️ सुन रहा हूँ... बोलिए"
                    : "🎙️ Listening... Speak query"}
                </span>
              </span>
              <button
                type="button"
                onClick={handleToggleVoiceSearch}
                className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Mic Error Alert */}
          {micError && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{micError}</div>
              <button
                type="button"
                onClick={() => setMicError(null)}
                className="text-amber-700 hover:text-amber-900 font-bold ml-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Scheme Cards */}
        <div className="space-y-3.5 pt-1">
          {filteredSchemes.map((scheme) => {
            const isEligible = scheme.status === "eligible";
            const isNeedsInfo = scheme.status === "needs_info";
            const isNotEligible = scheme.status === "not_eligible";

            return (
              <div
                key={scheme.id}
                id={`scheme-card-${scheme.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Status Badge */}
                <div className="flex items-center gap-1.5">
                  {isEligible && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Eligible</span>
                    </span>
                  )}

                  {isNeedsInfo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Needs More Info</span>
                    </span>
                  )}

                  {isNotEligible && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Not Eligible</span>
                    </span>
                  )}
                </div>

                {/* Scheme Title */}
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {scheme.name}
                </h2>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Needs info prompt box */}
                {isNeedsInfo && scheme.infoRequiredPrompt && (
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 font-medium">
                      {scheme.infoRequiredPrompt}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {isEligible && (
                  <button
                    id={`btn-view-details-${scheme.id}`}
                    onClick={() => onSelectScheme(scheme)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99] transition-all"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {isNeedsInfo && (
                  <button
                    id={`btn-update-info-${scheme.id}`}
                    onClick={() => onUpdateSchemeInfo(scheme)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.99] transition-all"
                  >
                    <span>Update Info</span>
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}

                {isNotEligible && (
                  <div className="text-center pt-1">
                    <button
                      id={`btn-why-not-${scheme.id}`}
                      onClick={() => setActiveReasonModal(scheme)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                    >
                      Why not eligible?
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Ask a Question Button */}
        <div className="sticky bottom-20 flex justify-end pr-1 pointer-events-none">
          <button
            id="btn-floating-ask-question"
            onClick={onAskQuestion}
            className="pointer-events-auto py-2.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask a question</span>
          </button>
        </div>
      </main>

      {/* Modal: Why not eligible */}
      {activeReasonModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Eligibility Criteria
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeReasonModal.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveReasonModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {activeReasonModal.whyNotEligibleReason ||
                "Based on the income, age, or land criteria provided, your current profile does not match the official guideline thresholds."}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">
                Scheme Rules:
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                {activeReasonModal.fullCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setActiveReasonModal(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <BottomNav currentTab="schemes" onSelectTab={onSelectNavTab} />
    </div>
  );
};
