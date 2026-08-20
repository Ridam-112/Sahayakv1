import React, { useState } from "react";
import { ArrowLeft, Globe, Mic, Shield, RotateCcw, Settings } from "lucide-react";
import { LanguageCode } from "../types";
import { ALL_LANGUAGES } from "../data/mockData";

interface HeaderProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  showBack?: boolean;
  onBack?: () => void;
  isVoiceActive?: boolean;
  onToggleVoice?: () => void;
  onResetData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onSelectLanguage,
  showBack = false,
  onBack,
  isVoiceActive = false,
  onToggleVoice,
  onResetData,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const getLanguageLabel = (code: LanguageCode) => {
    switch (code) {
      case "bn":
        return "বাং";
      case "hi":
        return "हिं";
      case "te":
        return "తె";
      case "ta":
        return "த";
      default:
        return "EN";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            id="header-back-button"
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors active:scale-95 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Sahayak
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language selector dropdown */}
        <div className="relative">
          <button
            id="header-language-toggle"
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowSettingsMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{getLanguageLabel(currentLanguage)}</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Language
              </div>
              <div className="max-h-60 overflow-y-auto">
                {ALL_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                      currentLanguage === lang.code
                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                        : "text-slate-700"
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-xs text-slate-400">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings / Reset Data menu */}
        {onResetData && (
          <div className="relative">
            <button
              id="header-settings-toggle"
              onClick={() => {
                setShowSettingsMenu(!showSettingsMenu);
                setShowLangMenu(false);
              }}
              className="p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer"
              title="Settings & Reset Data"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Data Settings
                </div>
                <button
                  type="button"
                  id="btn-reset-saved-data"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    onResetData();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset my data / নতুন শুরু করুন</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Voice Assistant Toggle */}
        {onToggleVoice && (
          <button
            id="header-voice-button"
            onClick={onToggleVoice}
            className={`p-2 rounded-lg border transition-all active:scale-95 cursor-pointer ${
              isVoiceActive
                ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-200 shadow-xs"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900"
            }`}
            title={isVoiceActive ? "Voice mode active" : "Enable voice assistant"}
            aria-label="Toggle voice assistant"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
