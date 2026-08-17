import React, { useState } from "react";
import { CheckCircle2, Globe, ArrowRight, Shield, Languages } from "lucide-react";
import { LanguageCode } from "../types";
import { ALL_LANGUAGES, LANGUAGES } from "../data/mockData";

interface LanguageSelectProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onContinue: () => void;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-col min-h-full justify-between py-8 px-4 max-w-md mx-auto w-full">
      <div className="space-y-6">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm mb-3 ring-4 ring-indigo-50">
            <Shield className="w-7 h-7 stroke-[2]" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Sahayak
          </h1>
          <div className="w-8 h-1 bg-indigo-600 rounded-full mt-2"></div>
        </div>

        {/* Subtitles */}
        <div className="text-center space-y-1.5 pt-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Choose your language
          </h2>
          <p className="text-base text-slate-700 font-medium">
            ভাষা নির্বাচন করুন
          </p>
          <p className="text-sm text-slate-500 font-medium">
            भाषा चुनें
          </p>
        </div>

        {/* Language Cards */}
        <div className="space-y-3 pt-2">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-option-${lang.code}`}
                onClick={() => onSelectLanguage(lang.code)}
                className={`w-full p-4 rounded-xl text-left flex items-center justify-between border-2 transition-all shadow-xs cursor-pointer ${
                  isSelected
                    ? "bg-white border-indigo-600 ring-4 ring-indigo-50"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold w-8 text-center ${isSelected ? "text-indigo-600" : "text-slate-700"}`}>
                    {lang.symbol}
                  </span>
                  <div>
                    <div className="text-base font-bold text-slate-900">
                      {lang.code === "bn" ? "বাংলা" : lang.code === "hi" ? "हिंदी" : lang.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {lang.nativeName}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                )}
              </button>
            );
          })}

          {/* More languages toggle / dropdown */}
          {!showMore ? (
            <button
              id="btn-more-languages"
              onClick={() => setShowMore(true)}
              className="w-full p-3.5 rounded-xl text-left flex items-center gap-3 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-400 transition-colors shadow-2xs cursor-pointer"
            >
              <Languages className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">
                + More Languages
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pt-1 animate-in fade-in duration-200">
              {ALL_LANGUAGES.slice(3).map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    id={`lang-more-${lang.code}`}
                    onClick={() => onSelectLanguage(lang.code)}
                    className={`p-3 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-indigo-600 ring-2 ring-indigo-50 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {lang.nativeName}
                      </div>
                      <div className="text-[11px] text-slate-500">{lang.name}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA and Footer */}
      <div className="pt-8 pb-4 space-y-4">
        <button
          id="btn-get-started"
          onClick={onContinue}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-between shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-indigo-200" />
            <span>Get Started</span>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-200" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Official DPI Platform</span>
        </div>
      </div>
    </div>
  );
};
