import React, { useState } from "react";
import {
  Calendar,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  User,
  CreditCard,
  Landmark,
  MapPin,
  FileText,
  ArrowRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { Scheme, CitizenProfile, LanguageCode } from "../types";
import { Header } from "./Header";
import { Footer } from "./Footer";
import confetti from "canvas-confetti";

interface SchemeApplyProps {
  scheme: Scheme;
  profile: CitizenProfile;
  onUpdateProfile: (updated: Partial<CitizenProfile>) => void;
  onGetSummary: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onBack: () => void;
}

export const SchemeApply: React.FC<SchemeApplyProps> = ({
  scheme,
  profile,
  onUpdateProfile,
  onGetSummary,
  currentLanguage,
  onSelectLanguage,
  onBack,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [showCriteria, setShowCriteria] = useState(true);
  const [showPortalSuccess, setShowPortalSuccess] = useState(false);

  const handleOpenPortal = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}
    setShowPortalSuccess(true);
  };

  const handleSaveField = (key: keyof CitizenProfile) => {
    if (tempValue.trim()) {
      onUpdateProfile({ [key]: tempValue.trim() });
    }
    setEditingField(null);
    setTempValue("");
  };

  const getItemIcon = (id: string) => {
    switch (id) {
      case "full_name":
        return <User className="w-5 h-5 text-slate-700" />;
      case "aadhaar":
        return <CreditCard className="w-5 h-5 text-slate-700" />;
      case "bank_acc":
        return <Landmark className="w-5 h-5 text-slate-700" />;
      case "land_id":
        return <MapPin className="w-5 h-5 text-slate-700" />;
      default:
        return <FileText className="w-5 h-5 text-slate-700" />;
    }
  };

  // Determine dynamic checklist status based on profile
  const checklistItems = scheme.requiredDetailsChecklist.map((item) => {
    let hasValue = item.status === "have_it";
    if (item.id === "full_name") hasValue = !!profile.name;
    if (item.id === "aadhaar") hasValue = !!profile.aadhaarNumber;
    if (item.id === "bank_acc") hasValue = !!profile.bankAccountNumber;
    if (item.id === "land_id") hasValue = !!profile.landParcelId;
    if (item.id === "ration_card") hasValue = !!profile.rationCardNumber;

    return {
      ...item,
      isHave: hasValue,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={true}
        onBack={onBack}
      />

      <main className="max-w-md mx-auto w-full px-4 py-5 space-y-4 flex-1">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Apply: {scheme.name}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {scheme.fullName}
          </p>
        </div>

        {/* Application Window Notice */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Application Window</div>
            <div className="text-[11px] text-slate-500">
              Always open — apply anytime
            </div>
          </div>
        </div>

        {/* Indigo Info Notification */}
        <div className="bg-indigo-50/70 rounded-xl border border-indigo-100 p-4 flex items-start gap-3 shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-indigo-950">
              We've filled in what we know...
            </div>
            <div className="text-[11px] text-indigo-900/80 leading-snug">
              You'll complete the rest on the official site.
            </div>
          </div>
        </div>

        {/* Details You'll Need */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Details You'll Need</span>
          </div>

          <div className="space-y-2.5">
            {checklistItems.map((item) => {
              const isHave = item.isHave;
              const isEditing = editingField === item.id;

              return (
                <div
                  key={item.id}
                  id={`detail-item-${item.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                        {getItemIcon(item.id)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    {isHave ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>have it</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingField(item.id);
                          setTempValue("");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>missing</span>
                      </button>
                    )}
                  </div>

                  {/* Inline quick input if missing */}
                  {isEditing && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder={`Enter ${item.label}...`}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveField(item.fieldKey as keyof CitizenProfile)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        className="px-2 py-1.5 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Eligibility Criteria */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full Eligibility Criteria</span>
            </div>
          </div>

          <ul className="text-xs text-slate-600 space-y-2 list-none pl-0">
            {scheme.fullCriteria.map((crit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span className="leading-relaxed">{crit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Get filled summary */}
          <button
            id="btn-get-filled-summary"
            onClick={onGetSummary}
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99] cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Get my filled summary</span>
          </button>

          {/* Go to official portal */}
          <button
            id="btn-go-to-official-portal"
            onClick={handleOpenPortal}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] cursor-pointer transition-all"
          >
            <span>Go to official portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Official Portal Handoff Modal */}
      {showPortalSuccess && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                DPI Gateway Ready
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your pre-filled dossier has been packaged. You are ready to complete authentication on the official{" "}
                <strong className="text-slate-900">{scheme.officialUrl.replace("https://", "")}</strong> portal.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-left text-xs text-slate-700 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Next Step on Portal:</div>
              <div>1. Click 'New Farmer Registration'</div>
              <div>2. Enter Aadhaar & OTP</div>
              <div>3. Paste Land Parcel ID from your Sahayak summary</div>
            </div>

            <div className="flex gap-2">
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowPortalSuccess(false)}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Open {scheme.name} Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowPortalSuccess(false)}
                className="px-3 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
