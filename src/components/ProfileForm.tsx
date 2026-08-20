import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Mic, ChevronDown, AlertCircle } from "lucide-react";
import { CitizenProfile, LanguageCode } from "../types";
import { ALL_INDIAN_STATES } from "../data/mockData";
import { Header } from "./Header";
import { createSpeechRecognizer } from "../utils/speech";

interface ProfileFormProps {
  profile: CitizenProfile;
  onChangeProfile: (updated: Partial<CitizenProfile>) => void;
  onSubmit: () => void;
  onSwitchToVoice: () => void;
  onResetProfile?: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onBack: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onChangeProfile,
  onSubmit,
  onSwitchToVoice,
  onResetProfile,
  currentLanguage,
  onSelectLanguage,
  onBack,
}) => {
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
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

  const handleVoiceInputField = (fieldName: keyof CitizenProfile) => {
    console.log(`[VOICE INPUT] Mic tap detected for profile field: "${String(fieldName)}"`);
    setMicError(null);

    if (activeVoiceField === fieldName) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setActiveVoiceField(null);
      return;
    }

    const langTag = currentLanguage === "hi" ? "hi-IN" : currentLanguage === "bn" ? "bn-IN" : "en-IN";
    console.log(`[VOICE INPUT] Starting speech recognition for field "${String(fieldName)}" (lang: ${langTag})`);

    const recognizer = createSpeechRecognizer(
      langTag,
      (transcript) => {
        console.log(`[VOICE INPUT] Raw transcript received for ${String(fieldName)}: "${transcript}"`);
        console.log(`[VOICE INPUT] Transcript passed to profile field state:`, { [fieldName]: transcript });
        
        if (fieldName === "age") {
          const matchNum = transcript.match(/\d+/);
          const ageVal = matchNum ? parseInt(matchNum[0], 10) : parseInt(transcript, 10);
          if (!isNaN(ageVal)) {
            onChangeProfile({ age: ageVal });
          } else {
            onChangeProfile({ [fieldName]: transcript } as any);
          }
        } else {
          onChangeProfile({ [fieldName]: transcript } as any);
        }
        setActiveVoiceField(null);
      },
      (err) => {
        console.warn(`[VOICE INPUT] Recognition error on field ${String(fieldName)}:`, err);
        setActiveVoiceField(null);
        if (err === "not-allowed" || err === "service-not-allowed") {
          setMicError(
            currentLanguage === "bn"
              ? "মাইক্রোফোনের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজারে অনুমতি দিন বা টাইপ করুন।"
              : currentLanguage === "hi"
              ? "माइक्रोफ़ोन की अनुमति नहीं है। कृपया अनुमति दें या टाइप करें।"
              : "Microphone permission denied. Please allow microphone access or type below."
          );
        } else {
          setMicError(
            currentLanguage === "bn"
              ? "কথা শোনা যায়নি। আবার চেষ্টা করুন বা লিখে পূরণ করুন।"
              : currentLanguage === "hi"
              ? "आवाज़ सुनाई नहीं दी। कृपया पुनः प्रयास करें या लिखें।"
              : "Could not hear audio. Please try again or type."
          );
        }
      },
      (interim) => {
        console.log(`[VOICE INPUT] Interim transcript for ${String(fieldName)}: "${interim}"`);
        if (fieldName !== "age") {
          onChangeProfile({ [fieldName]: interim } as any);
        }
      }
    );

    if (!recognizer) {
      console.warn("[VOICE INPUT] SpeechRecognition unsupported on this browser.");
      setMicError(
        currentLanguage === "bn"
          ? "আপনার ব্রাউজারে ভয়েস রিকগনিশন সমর্থিত নয়।"
          : currentLanguage === "hi"
          ? "आपके ब्राउज़र में वॉयस इनपुट समर्थিত नहीं है।"
          : "Voice input is not supported in this browser."
      );
      return;
    }

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
      setActiveVoiceField(fieldName);
      console.log(`[VOICE INPUT] recognition.start() called for field: "${String(fieldName)}"`);
    } catch (e) {
      console.warn("[VOICE INPUT] Failed to start field recognition:", e);
      setActiveVoiceField(null);
    }
  };

  const occupations = [
    "Farmer",
    "Agricultural Laborer",
    "Daily Wage Laborer",
    "Artisan / Weaver",
    "Street Vendor",
    "Small Business / Self Employed",
    "Student",
    "Unemployed",
    "Homemaker",
    "Retired / Senior Citizen",
  ];

  const categories = ["General", "OBC", "SC", "ST", "EWS"];
  const genders = ["Male", "Female", "Other"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={true}
        onBack={onBack}
      />

      <main className="max-w-md mx-auto w-full px-4 py-6 space-y-4 flex-1">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          {/* Header step */}
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <div className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
              Step 1 of 1
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Tell us about yourself
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Providing accurate information helps us find the schemes you are eligible for.
            </p>
          </div>

          {/* Microphone / Browser Error Message */}
          {micError && (
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Your Name / আপনার নাম
                </label>
                <button
                  type="button"
                  id="btn-voice-name"
                  onClick={() => handleVoiceInputField("name")}
                  className={`p-1 rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    activeVoiceField === "name"
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-indigo-600 hover:bg-indigo-50"
                  }`}
                  title="Speak Name"
                >
                  <Mic className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">
                    {activeVoiceField === "name" ? "Listening..." : "Speak"}
                  </span>
                </button>
              </div>
              <input
                id="input-name"
                type="text"
                value={profile.name || ""}
                onChange={(e) => onChangeProfile({ name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-age"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Age (in years)
                </label>
                <button
                  type="button"
                  id="btn-voice-age"
                  onClick={() => handleVoiceInputField("age")}
                  className={`p-1 rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    activeVoiceField === "age"
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-indigo-600 hover:bg-indigo-50"
                  }`}
                  title="Speak Age"
                >
                  <Mic className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">
                    {activeVoiceField === "age" ? "Listening..." : "Speak"}
                  </span>
                </button>
              </div>
              <input
                id="input-age"
                type="number"
                value={profile.age || ""}
                onChange={(e) => onChangeProfile({ age: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                placeholder="e.g. 35"
                min="1"
                max="120"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
              />
            </div>

            {/* Income */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-income"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Annual Income (₹)
                </label>
                <button
                  type="button"
                  id="btn-voice-income"
                  onClick={() => handleVoiceInputField("income")}
                  className={`p-1 rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    activeVoiceField === "income"
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-indigo-600 hover:bg-indigo-50"
                  }`}
                  title="Speak Income"
                >
                  <Mic className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">
                    {activeVoiceField === "income" ? "Listening..." : "Speak"}
                  </span>
                </button>
              </div>
              <input
                id="input-income"
                type="text"
                value={profile.income || ""}
                onChange={(e) => onChangeProfile({ income: e.target.value })}
                placeholder="e.g. 45,000"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label
                htmlFor="select-state"
                className="block text-xs font-semibold text-slate-700"
              >
                State / Union Territory
              </label>
              <div className="relative">
                <select
                  id="select-state"
                  value={profile.state}
                  onChange={(e) => onChangeProfile({ state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 pr-9 shadow-2xs transition-all"
                >
                  <option value="">Select your state</option>
                  {ALL_INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Occupation */}
            <div className="space-y-1.5">
              <label
                htmlFor="select-occupation"
                className="block text-xs font-semibold text-slate-700"
              >
                Occupation
              </label>
              <div className="relative">
                <select
                  id="select-occupation"
                  value={profile.occupation}
                  onChange={(e) => onChangeProfile({ occupation: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 pr-9 shadow-2xs transition-all"
                >
                  <option value="">Select occupation</option>
                  {occupations.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Social Category */}
            <div className="space-y-1.5">
              <label
                htmlFor="select-category"
                className="block text-xs font-semibold text-slate-700"
              >
                Social Category
              </label>
              <div className="relative">
                <select
                  id="select-category"
                  value={profile.socialCategory}
                  onChange={(e) => onChangeProfile({ socialCategory: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 pr-9 shadow-2xs transition-all"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label
                htmlFor="select-gender"
                className="block text-xs font-semibold text-slate-700"
              >
                Gender
              </label>
              <div className="relative">
                <select
                  id="select-gender"
                  value={profile.gender}
                  onChange={(e) => onChangeProfile({ gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 pr-9 shadow-2xs transition-all"
                >
                  <option value="">Select gender</option>
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Disability Radio */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="block text-xs font-semibold text-slate-700">
                Do you have any physical disability?
              </span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="disability"
                    checked={profile.hasDisability === true}
                    onChange={() => onChangeProfile({ hasDisability: true })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="disability"
                    checked={profile.hasDisability === false}
                    onChange={() => onChangeProfile({ hasDisability: false })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Voice Mode banner / switch */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 text-xs font-medium">
                <Mic className="w-4 h-4 text-indigo-600" />
                <span>Voice Assistance Mode</span>
              </div>
              <button
                type="button"
                id="toggle-voice-mode-form"
                onClick={onSwitchToVoice}
                className="w-10 h-5.5 bg-indigo-600 rounded-full p-0.5 flex items-center justify-end transition-colors cursor-pointer"
                title="Switch to Voice Mode"
              >
                <div className="w-4.5 h-4.5 bg-white rounded-full shadow-xs"></div>
              </button>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-3 space-y-2">
              <button
                type="submit"
                id="btn-find-my-schemes"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <span>Find My Schemes</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onResetProfile && (
                <button
                  type="button"
                  id="btn-reset-profile-form"
                  onClick={onResetProfile}
                  className="w-full py-2 px-3 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition-colors cursor-pointer text-center"
                >
                  {currentLanguage === "bn"
                    ? "তথ্য রিসেট করুন / Reset my data"
                    : currentLanguage === "hi"
                    ? "डेटा रीसेट करें / Reset my data"
                    : "Reset my profile data"}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
