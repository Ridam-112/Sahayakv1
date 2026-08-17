import React, { useState, useEffect } from "react";
import {
  CivicFeedItem,
  LanguageCode,
  CitizenProfile,
  Scheme,
} from "../types";
import { FeedBadge } from "./FeedBadge";
import {
  X,
  ExternalLink,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  Loader2,
} from "lucide-react";
import { speakText, stopSpeaking } from "../utils/speech";

interface CivicFeedDetailModalProps {
  item: CivicFeedItem;
  currentLanguage: LanguageCode;
  profile: CitizenProfile;
  schemes: Scheme[];
  onClose: () => void;
  onSelectScheme: (scheme: Scheme) => void;
  onOpenGrievance?: () => void;
}

export const CivicFeedDetailModal: React.FC<CivicFeedDetailModalProps> = ({
  item,
  currentLanguage,
  profile,
  schemes,
  onClose,
  onSelectScheme,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    plainSummary?: string;
    whatChanged?: string;
    whoIsAffected?: string;
    whatShouldDo?: string;
  } | null>(null);

  // Translations
  const trans = item.translations?.[currentLanguage];
  const displayTitle = trans?.title || item.title;
  const displaySummary = trans?.summary || item.summary;
  const displayCta = trans?.cta_label || item.cta_label;
  const displayAudience = trans?.target_audience || item.target_audience;
  const displayAction = trans?.action_required || item.action_required;

  // Matched scheme if available
  const matchedScheme = item.scheme_id
    ? schemes.find(
        (s) =>
          s.id === item.scheme_id ||
          s.code.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            item.scheme_id.toLowerCase().replace(/[^a-z0-9]/g, "")
      )
    : undefined;

  // Calculate deadline countdown
  const getDeadlineText = () => {
    if (!item.effective_date) return null;
    const target = new Date(item.effective_date);
    const now = new Date("2026-08-17"); // current local app time context
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      if (currentLanguage === "bn") return `${diffDays} দিনের মধ্যে শেষ হবে`;
      if (currentLanguage === "hi") return `${diffDays} दिनों में समाप्त होगा`;
      return `Closes in ${diffDays} days`;
    }
    if (diffDays === 0) {
      if (currentLanguage === "bn") return "আজই শেষ দিন";
      if (currentLanguage === "hi") return "आज अंतिम दिन है";
      return "Closes today";
    }
    return null;
  };

  const deadlineText = getDeadlineText();

  // Load AI update explainer
  useEffect(() => {
    let isMounted = true;
    const fetchExplanation = async () => {
      setLoadingAi(true);
      try {
        const res = await fetch("/api/explain-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: displayTitle,
            summary: displaySummary,
            language:
              currentLanguage === "bn"
                ? "Bengali"
                : currentLanguage === "hi"
                ? "Hindi"
                : "English",
            userProfile: profile,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setAiAnalysis(data);
        }
      } catch (err) {
        console.warn("Could not fetch AI update explanation:", err);
      } finally {
        if (isMounted) setLoadingAi(false);
      }
    };

    fetchExplanation();

    return () => {
      isMounted = false;
      stopSpeaking();
    };
  }, [item.id, currentLanguage]);

  // Audio Playback with SpeechSynthesis API
  const handleToggleAudio = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      let speechScript = "";
      if (currentLanguage === "bn") {
        speechScript = `সরকারি আপডেট: ${displayTitle}। বিবরণ: ${displaySummary}। ${
          displayAudience ? `কাদের জন্য: ${displayAudience}।` : ""
        } ${displayAction ? `করণীয় পদক্ষেপ: ${displayAction}।` : ""}`;
      } else if (currentLanguage === "hi") {
        speechScript = `सरकारी अपडेट: ${displayTitle}। विवरण: ${displaySummary}। ${
          displayAudience ? `किसके लिए है: ${displayAudience}।` : ""
        } ${displayAction ? `क्या करना चाहिए: ${displayAction}।` : ""}`;
      } else {
        speechScript = `Government Update: ${displayTitle}. Summary: ${displaySummary}. ${
          displayAudience ? `Who is this for: ${displayAudience}.` : ""
        } ${displayAction ? `What should you do: ${displayAction}.` : ""}`;
      }

      setIsPlaying(true);
      speakText(speechScript, currentLanguage, () => {
        setIsPlaying(false);
      });
    }
  };

  const handleCtaClick = () => {
    stopSpeaking();
    onClose();
    if (matchedScheme) {
      onSelectScheme(matchedScheme);
    } else {
      // Fallback: pick primary scheme or navigate
      if (schemes.length > 0) {
        onSelectScheme(schemes[0]);
      }
    }
  };

  return (
    <div
      id="civic-feed-detail-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FeedBadge type={item.type} currentLanguage={currentLanguage} />
            {deadlineText && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {deadlineText}
              </span>
            )}
          </div>
          <button
            id="close-feed-detail-btn"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-xs flex-1">
          {/* Title & Date */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight">
              {displayTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {currentLanguage === "bn"
                    ? "প্রকাশিত: "
                    : currentLanguage === "hi"
                    ? "प्रकाशित: "
                    : "Published: "}
                  {item.published_at}
                </span>
              </span>
              {item.effective_date && (
                <span className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {currentLanguage === "bn"
                      ? "কার্যকর / শেষ তারিখ: "
                      : currentLanguage === "hi"
                      ? "अंतिम तिथि: "
                      : "Effective Date: "}
                    {item.effective_date}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Audio Listen Bar / Accessibility SpeechSynthesis Feature */}
          <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isPlaying
                    ? "bg-indigo-600 text-white shadow-md animate-pulse"
                    : "bg-white text-indigo-700 border border-indigo-200 shadow-2xs"
                }`}
              >
                {isPlaying ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <span>
                    {currentLanguage === "bn"
                      ? "অডিও সহায়তা (Voice Reader)"
                      : currentLanguage === "hi"
                      ? "ऑडियो सहायता (Voice Reader)"
                      : "Voice Accessibility (TTS)"}
                  </span>
                  {isPlaying && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full border border-emerald-300 animate-pulse">
                      {currentLanguage === "bn"
                        ? "পড়া হচ্ছে..."
                        : currentLanguage === "hi"
                        ? "चल रहा है..."
                        : "Reading aloud..."}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-indigo-900/80 leading-tight">
                  {isPlaying
                    ? currentLanguage === "bn"
                      ? "থামাতে বাটনে ক্লিক করুন"
                      : currentLanguage === "hi"
                      ? "रोकने के लिए क्लिक करें"
                      : "Click button to stop playback"
                    : currentLanguage === "bn"
                    ? "সম্পূর্ণ আপডেটটি নিজের ভাষায় স্পষ্ট উচ্চারণে শুনুন"
                    : currentLanguage === "hi"
                    ? "पूरा अपडेट अपनी भाषा में स्पष्ट आवाज में सुनें"
                    : "Listen to the complete summary, audience, and action steps"}
                </p>
              </div>
            </div>

            <button
              id="btn-listen-feed-update"
              onClick={handleToggleAudio}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 ${
                isPlaying
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
              aria-label={
                isPlaying
                  ? "Stop speech playback"
                  : "Listen to this update using speech synthesis"
              }
            >
              {isPlaying ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>
                    {currentLanguage === "bn"
                      ? "থামান (Stop)"
                      : currentLanguage === "hi"
                      ? "रोकें (Stop)"
                      : "Stop Audio"}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm">🔊</span>
                  <span>
                    {currentLanguage === "bn"
                      ? "আপডেটটি শুনুন"
                      : currentLanguage === "hi"
                      ? "यह अपडेट सुनें"
                      : "Listen to this update"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed text-slate-700 text-xs">
            {displaySummary}
          </div>

          {/* Section: Who is this for? */}
          {displayAudience && (
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 bg-white">
              <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>
                  {currentLanguage === "bn"
                    ? "এটি কাদের জন্য? (Who is this for?)"
                    : currentLanguage === "hi"
                    ? "यह किसके लिए है? (Who is this for?)"
                    : "WHO IS THIS FOR?"}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {displayAudience}
              </p>
            </div>
          )}

          {/* Section: What should I do? */}
          {displayAction && (
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 bg-white">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>
                  {currentLanguage === "bn"
                    ? "আমার কী করা উচিত? (What should I do?)"
                    : currentLanguage === "hi"
                    ? "मुझे क्या करना चाहिए? (What should I do?)"
                    : "WHAT SHOULD I DO?"}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {displayAction}
              </p>
            </div>
          )}

          {/* AI Simplified Breakdown */}
          <div className="border border-indigo-100 rounded-xl p-3.5 bg-indigo-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {currentLanguage === "bn"
                    ? "সহায়ক এআই বিশ্লেষণ"
                    : currentLanguage === "hi"
                    ? "सहायक एआई विवरण"
                    : "Sahayak AI Plain-Language Breakdown"}
                </span>
              </div>
              {loadingAi && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
            </div>

            {aiAnalysis?.whatChanged && (
              <div className="text-xs text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900">
                  {currentLanguage === "bn" ? "কী পরিবর্তন হয়েছে: " : "What changed: "}
                </span>
                <span>{aiAnalysis.whatChanged}</span>
              </div>
            )}
          </div>

          {/* Matched Scheme Connection */}
          {matchedScheme && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">
                    {matchedScheme.name}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  {matchedScheme.benefitShort}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-normal">
                {matchedScheme.description}
              </p>
            </div>
          )}

          {/* Verified Official Source Link */}
          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {currentLanguage === "bn"
                  ? "অফিসিয়াল উৎস: "
                  : currentLanguage === "hi"
                  ? "आधिकारिक स्रोत: "
                  : "Official Source: "}
                <strong className="text-slate-700 font-medium">
                  {item.source_name}
                </strong>
              </span>
            </div>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
            >
              <span>
                {currentLanguage === "bn"
                  ? "অফিসিয়াল পোর্টাল দেখুন"
                  : currentLanguage === "hi"
                  ? "सरकारी पोर्टल देखें"
                  : "View official portal"}
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
          >
            {currentLanguage === "bn"
              ? "বন্ধ করুন"
              : currentLanguage === "hi"
              ? "बंद करें"
              : "Close"}
          </button>
          <button
            id="feed-detail-primary-cta"
            onClick={handleCtaClick}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>{displayCta}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
