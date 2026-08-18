import React, { useState } from "react";
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
} from "lucide-react";
import { Scheme, LanguageCode, NavTab, CitizenProfile } from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface SchemesResultsProps {
  schemes: Scheme[];
  profile: CitizenProfile;
  wishlistIds: string[];
  onToggleWishlist: (schemeId: string) => void;
  onStartScheme: (scheme: Scheme) => void;
  onSelectScheme: (scheme: Scheme) => void;
  onEditProfile: () => void;
  onRestartVoiceAgent: () => void;
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
  currentLanguage,
  onSelectLanguage,
  onSelectNavTab,
  onBack,
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "eligible" | "wishlist">("all");
  const [activeReasonModal, setActiveReasonModal] = useState<Scheme | null>(null);

  // Filter schemes
  const filteredSchemes = schemes.filter((s) => {
    if (activeFilter === "wishlist") return wishlistIds.includes(s.id);
    if (activeFilter === "eligible") return s.status === "eligible";
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
