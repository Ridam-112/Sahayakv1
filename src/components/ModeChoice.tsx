import React from "react";
import { Edit3, Mic, HelpCircle } from "lucide-react";
import { LanguageCode } from "../types";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface ModeChoiceProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectTypeMode: () => void;
  onSelectVoiceMode: () => void;
  onNeedHelp: () => void;
  onBack: () => void;
}

export const ModeChoice: React.FC<ModeChoiceProps> = ({
  currentLanguage,
  onSelectLanguage,
  onSelectTypeMode,
  onSelectVoiceMode,
  onNeedHelp,
  onBack,
}) => {
  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={true}
        onBack={onBack}
      />

      <main className="max-w-md mx-auto w-full px-5 py-6 space-y-6 flex-1">
        {/* Title */}
        <div className="text-center space-y-1.5 pt-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            কীভাবে করবেন?
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            (How would you like to do this?)
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3.5 pt-2">
          {/* Type Mode Card */}
          <button
            id="mode-choice-type"
            onClick={onSelectTypeMode}
            className="w-full p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-600 hover:ring-4 hover:ring-indigo-50 transition-all shadow-xs flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Edit3 className="w-7 h-7 stroke-[2]" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <span>✍️</span>
                <span>লিখব</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                (I'll type)
              </div>
            </div>
          </button>

          {/* Voice Mode Card */}
          <button
            id="mode-choice-voice"
            onClick={onSelectVoiceMode}
            className="w-full p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-600 hover:ring-4 hover:ring-indigo-50 transition-all shadow-xs flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:scale-105 transition-transform">
              <Mic className="w-7 h-7 stroke-[2]" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1.5">
                <span>🎤</span>
                <span>বলব</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                (I'll speak)
              </div>
            </div>
          </button>

          {/* Help Button */}
          <button
            id="mode-choice-help"
            onClick={onNeedHelp}
            className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>সাহায্য দরকার (Need Help?)</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};
