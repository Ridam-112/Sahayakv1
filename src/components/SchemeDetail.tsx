import React, { useState } from "react";
import {
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowRight,
  ClipboardList,
  ExternalLink,
  CreditCard,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { Scheme, LanguageCode } from "../types";
import { speakText, stopSpeaking } from "../utils/speech";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface SchemeDetailProps {
  scheme: Scheme;
  onApply: (scheme: Scheme) => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onBack: () => void;
}

export const SchemeDetail: React.FC<SchemeDetailProps> = ({
  scheme,
  onApply,
  currentLanguage,
  onSelectLanguage,
  onBack,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleToggleReadAloud = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const textToRead = `${scheme.name}. ${scheme.benefitShort}. Why you're eligible: ${scheme.whyEligibleReason}. Required documents: ${scheme.documents.map((d) => d.name).join(", ")}.`;
      speakText(textToRead, currentLanguage, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  const getDocIcon = (iconType: string) => {
    switch (iconType) {
      case "id":
        return <CreditCard className="w-5 h-5 text-blue-700" />;
      case "land":
        return <FileText className="w-5 h-5 text-emerald-700" />;
      case "bank":
        return <Landmark className="w-5 h-5 text-indigo-700" />;
      default:
        return <FileText className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={true}
        onBack={() => {
          stopSpeaking();
          onBack();
        }}
      />

      <main className="max-w-md mx-auto w-full px-4 py-5 space-y-4 flex-1">
        {/* Top Hero Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ELIGIBLE</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {scheme.name}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              {scheme.benefitShort}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Read Aloud button */}
            <button
              id="btn-scheme-read-aloud"
              onClick={handleToggleReadAloud}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPlayingAudio
                  ? "bg-indigo-600 text-white border-indigo-700 animate-pulse"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Stop Reading</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {/* Apply button */}
            <button
              id="btn-scheme-apply"
              onClick={() => {
                stopSpeaking();
                onApply(scheme);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] cursor-pointer transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Apply for this scheme</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: Why you're eligible */}
        <div className="bg-indigo-50/60 rounded-xl border border-indigo-100 p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <span className="text-sm">💡</span>
            <span>Why you're eligible</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {scheme.whyEligibleReason}
          </p>
        </div>

        {/* Section 2: Documents Needed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Documents Needed</span>
          </div>

          <div className="space-y-3 pt-1">
            {scheme.documents.map((doc, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-indigo-600">
                  {getDocIcon(doc.icon)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {doc.name}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    {doc.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Official Source */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-xs font-bold text-slate-900">Official Source</div>
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                {scheme.officialUrl.replace("https://", "")}
              </a>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </div>

        {/* Section 4: How to Apply Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="text-sm">📑</span>
            <span>How to Apply</span>
          </div>

          <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {scheme.howToApplySteps.map((step) => (
              <div key={step.stepNumber} className="relative">
                {/* Timeline circle */}
                <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                  {step.stepNumber}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
