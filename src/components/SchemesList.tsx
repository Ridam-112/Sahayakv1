import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Edit2,
  MessageSquare,
  Info,
} from "lucide-react";
import { Scheme, LanguageCode, NavTab } from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

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

        {/* Scheme Cards */}
        <div className="space-y-3.5 pt-1">
          {schemes.map((scheme) => {
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
