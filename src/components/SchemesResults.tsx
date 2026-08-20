import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Heart,
  ExternalLink,
  Sparkles,
  Edit3,
  RotateCcw,
  Info,
  ShieldCheck,
  Building,
  Filter,
  Mic,
  MicOff,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { Scheme, LanguageCode, NavTab, CitizenProfile } from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { createSpeechRecognizer } from "../utils/speech";

interface SchemesResultsProps {
  schemes: Scheme[];
  profile: CitizenProfile;
  wishlistIds: string[];
  onToggleWishlist: (schemeId: string) => void;
  onStartScheme: (scheme: Scheme) => void;
  onSelectScheme: (scheme: Scheme) => void;
  onEditProfile: () => void;
  onRestartVoiceAgent: () => void;
  onResetData?: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectNavTab: (tab: NavTab) => void;
  onBack?: () => void;
}

export const SchemesResults: React.FC<SchemesResultsProps> = ({
  schemes,
  profile,
  wishlistIds,
  onToggleWishlist,
  onStartScheme,
  onSelectScheme,
  onEditProfile,
  onRestartVoiceAgent,
  onResetData,
  currentLanguage,
  onSelectLanguage,
  onSelectNavTab,
  onBack,
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "eligible" | "wishlist">("all");
  const [activeReasonModal, setActiveReasonModal] = useState<Scheme | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Cleanup recognizer on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Voice Search Handler
  const handleToggleVoiceSearch = () => {
    console.log("[VOICE INPUT] Mic tap detected in Schemes search bar.");
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
    console.log(`[VOICE INPUT] Starting recognition for Schemes search query (lang: ${langTag})`);

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
              ? "মাইক্রোফোনের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজারে অনুমতি দিন বা লিখে খুঁজুন।"
              : currentLanguage === "hi"
              ? "माइक्रोफ़ोन की अनुमति नहीं है। कृपया अनुमति दें या टाइप करके खोजें।"
              : "Microphone access denied. Please allow microphone in browser or type search query."
          );
        } else {
          setMicError(
            currentLanguage === "bn"
              ? "কথা শোনা সম্ভব হয়নি। আবার চেষ্টা করুন বা লিখে খুঁজুন।"
              : currentLanguage === "hi"
              ? "आवाज़ पहचान में त्रुटि। कृपया पुनः प्रयास करें या लिखें।"
              : "Could not recognize speech. Please try again or type query."
          );
        }
      },
      (interim) => {
        console.log(`[VOICE INPUT] Interim search transcript: "${interim}"`);
        setSearchQuery(interim);
      }
    );

    if (!recognizer) {
      console.warn("[VOICE INPUT] SpeechRecognition is not supported on this browser.");
      setMicError(
        currentLanguage === "bn"
          ? "আপনার ব্রাউজারে ভয়েস রিকগনিশন সমর্থিত নয়। অনুগ্রহ করে লিখে সার্চ করুন।"
          : currentLanguage === "hi"
          ? "आपके ब्राउज़र में वॉयस सर्च समर्थित नहीं है। कृपया लिखकर खोजें।"
          : "Voice search is not supported in this browser. Please type to search."
      );
      return;
    }

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
      setIsListening(true);
      console.log("[VOICE INPUT] recognition.start() called successfully.");
    } catch (err) {
      console.warn("[VOICE INPUT] Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  // Filter schemes based on active tab and search query
  const filteredSchemes = schemes.filter((s) => {
    if (activeFilter === "wishlist" && !wishlistIds.includes(s.id)) return false;
    if (activeFilter === "eligible" && s.status !== "eligible") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchCode = s.code.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchBenefit = (s.benefitShort || "").toLowerCase().includes(q);
      const matchTags = (s.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchName || matchCode || matchDesc || matchBenefit || matchTags;
    }

    return true;
  });

  const getResultsHeading = () => {
    if (currentLanguage === "bn") {
      return "আপনার জন্য প্রাসঙ্গিক কিছু সরকারি সুবিধা";
    } else if (currentLanguage === "hi") {
      return "यहाँ आपके लिए प्रासंगिक सरकारी योजनाएँ हैं";
    } else {
      return "Here are schemes that may be relevant to you";
    }
  };

  const getResultsSubheading = () => {
    if (currentLanguage === "bn") {
      return `আপনার প্রোফাইল (${profile.occupation || "নাগরিক"}, ${profile.state || "ভারত"}) অনুযায়ী এআই বিশ্লেষণকৃত ফলাফল।`;
    } else if (currentLanguage === "hi") {
      return `आपकी प्रोफ़ाइल (${profile.occupation || "नागरिक"}, ${profile.state || "भारत"}) के आधार पर एआई विश्लेषित परिणाम।`;
    } else {
      return `Personalized match based on your profile (${profile.occupation || "Citizen"}, ${profile.state || "India"}).`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={!!onBack}
        onBack={onBack}
        onResetData={onResetData}
      />

      <main className="max-w-md mx-auto w-full px-4 py-4 space-y-4 flex-1 pb-24">
        {/* Dynamic Personalized Header */}
        <div className="space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Verified Matches</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {getResultsHeading()}
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            {getResultsSubheading()}
          </p>
        </div>

        {/* Collected Profile Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>👤</span>
              <span>{profile.name || "Citizen Profile"}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-edit-profile"
                onClick={onEditProfile}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Profile</span>
              </button>

              <button
                id="btn-talk-again-agent"
                onClick={onRestartVoiceAgent}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 cursor-pointer"
                title="Talk to Sahayak Voice Agent Again"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Re-interview</span>
              </button>

              {onResetData && (
                <button
                  type="button"
                  id="btn-reset-data-schemes-results"
                  onClick={onResetData}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 cursor-pointer"
                  title="Reset All Saved Data"
                >
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Tags */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {profile.age && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                Age: <strong>{profile.age}</strong>
              </span>
            )}
            {profile.occupation && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                Role: <strong>{profile.occupation}</strong>
              </span>
            )}
            {profile.state && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                State: <strong>{profile.state}</strong>
              </span>
            )}
            {profile.income && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                Income: <strong>{profile.income}</strong>
              </span>
            )}
            {profile.ownsLand && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                🌱 Landowner
              </span>
            )}
            {profile.hasDisability && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-medium text-blue-800 border border-blue-200">
                ♿ Divyangjan
              </span>
            )}
          </div>
        </div>

        {/* Search & Voice Filter Bar */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              id="input-schemes-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLanguage === "bn"
                  ? "প্রকল্পের নাম, সুবিধা বা বিষয় দিয়ে খুঁজুন..."
                  : currentLanguage === "hi"
                  ? "योजना का नाम, लाभ या विषय से खोजें..."
                  : "Search schemes, benefits, or topics..."
              }
              className="w-full pl-9 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  id="btn-clear-schemes-search"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                id="btn-schemes-voice-search"
                onClick={handleToggleVoiceSearch}
                className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-xs"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
                title={isListening ? "Listening... tap to finish" : "Search by voice / মুখে বলুন"}
              >
                {isListening ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <Mic className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Voice Listening Feedback */}
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold animate-pulse">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>
                  {currentLanguage === "bn"
                    ? "🎙️ আপনার কথা শুনছি... বলুন (যেমন: 'কৃষি' বা 'বৃত্তি')"
                    : currentLanguage === "hi"
                    ? "🎙️ आपकी आवाज़ सुन रहा हूँ... बोलिए (जैसे: 'किसान' या 'छात्रवृत्ति')"
                    : "🎙️ Listening... Speak scheme keyword (e.g. 'farmer' or 'scholarship')"}
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

          {/* Microphone / Browser Error Message */}
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

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Schemes ({schemes.length})
          </button>
          <button
            onClick={() => setActiveFilter("eligible")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeFilter === "eligible"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Potentially Eligible ({schemes.filter((s) => s.status === "eligible").length})
          </button>
          <button
            onClick={() => setActiveFilter("wishlist")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeFilter === "wishlist"
                ? "bg-white text-rose-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
            <span>Wishlist ({wishlistIds.length})</span>
          </button>
        </div>

        {/* Schemes List */}
        <div className="space-y-3.5">
          {filteredSchemes.map((scheme) => {
            const isEligible = scheme.status === "eligible";
            const isNeedsInfo = scheme.status === "needs_info";
            const isNotEligible = scheme.status === "not_eligible";
            const isWishlisted = wishlistIds.includes(scheme.id);

            return (
              <div
                key={scheme.id}
                id={`scheme-card-${scheme.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all space-y-3 relative"
              >
                {/* Top bar: Status badge & Wishlist Heart */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isEligible && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Potentially Matches</span>
                      </span>
                    )}

                    {isNeedsInfo && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Needs More Info</span>
                      </span>
                    )}

                    {isNotEligible && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Not Matching</span>
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-mono">
                      {scheme.code}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    id={`btn-wishlist-${scheme.id}`}
                    onClick={() => onToggleWishlist(scheme.id)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isWishlisted
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 border border-slate-200"
                    }`}
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted ? "fill-rose-500 stroke-rose-500" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Scheme Title & Benefit */}
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {scheme.name}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {scheme.description}
                  </p>
                </div>

                {/* Direct Benefit Highlight Banner */}
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2">
                  <span className="text-sm">💰</span>
                  <div className="text-xs text-indigo-950">
                    <span className="font-bold">Benefit: </span>
                    <span>{scheme.benefitShort}</span>
                  </div>
                </div>

                {/* Match Criteria Rationale */}
                {scheme.whyEligibleReason && (
                  <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <span>🎯</span>
                      <span>Why it matches your profile:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {scheme.whyEligibleReason}
                    </p>
                  </div>
                )}

                {/* Needs Info Note */}
                {isNeedsInfo && scheme.infoRequiredPrompt && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{scheme.infoRequiredPrompt}</span>
                  </div>
                )}

                {/* Official Source link */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span>Govt Portal</span>
                  </span>
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id={`btn-view-details-${scheme.id}`}
                    onClick={() => onSelectScheme(scheme)}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                  >
                    <span>View Details</span>
                  </button>

                  <button
                    id={`btn-start-${scheme.id}`}
                    onClick={() => onStartScheme(scheme)}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
                  >
                    <span>Start Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSchemes.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="text-base font-bold text-slate-800">
                No schemes found in this category
              </h3>
              <p className="text-xs text-slate-500">
                {activeFilter === "wishlist"
                  ? "You have not saved any schemes to your wishlist yet. Tap the heart icon on any scheme card to save it."
                  : "Try editing your profile or re-running the voice assistant to discover other entitlements."}
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                className="py-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                View All Schemes
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-slate-100/80 rounded-xl text-[11px] text-slate-500 text-center leading-relaxed">
          * Final eligibility and fund disbursement is subject to official government verification, e-KYC, and document scrutiny by state nodal authorities.
        </div>
      </main>

      <BottomNav currentTab="schemes" onSelectTab={onSelectNavTab} />
    </div>
  );
};
