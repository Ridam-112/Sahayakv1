import React, { useState, useRef } from "react";
import {
  Megaphone,
  Mic,
  Sparkles,
  Bot,
  Copy,
  ExternalLink,
  Check,
  Edit,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { LanguageCode, NavTab, CitizenProfile } from "../types";
import { SAMPLE_GRIEVANCE_DRAFT } from "../data/mockData";
import { createSpeechRecognizer } from "../utils/speech";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface HelpGrievanceProps {
  profile: CitizenProfile;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectNavTab: (tab: NavTab) => void;
  onBack?: () => void;
}

export const HelpGrievance: React.FC<HelpGrievanceProps> = ({
  profile,
  currentLanguage,
  onSelectLanguage,
  onSelectNavTab,
  onBack,
}) => {
  const [complaintInput, setComplaintInput] = useState(
    "I have not received my PM-KISAN installment for the latest cycle even though my e-KYC and bank account are linked."
  );
  const [draftSubject, setDraftSubject] = useState("PM-KISAN payment delay");
  const [draftContent, setDraftContent] = useState(SAMPLE_GRIEVANCE_DRAFT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCPGRAMSModal, setShowCPGRAMSModal] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Toggle voice dictation
  const handleToggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const langTag =
      currentLanguage === "hi"
        ? "hi-IN"
        : currentLanguage === "bn"
        ? "bn-IN"
        : "en-IN";

    const recognizer = createSpeechRecognizer(
      langTag,
      (transcript) => {
        setComplaintInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
      } catch {
        setIsListening(false);
      }
    } else {
      setTimeout(() => setIsListening(false), 2000);
    }
  };

  // Generate formal draft via Gemini API
  const handleGenerateDraft = async () => {
    if (!complaintInput.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintText: complaintInput,
          schemeName: "PM-KISAN",
          language: currentLanguage === "bn" ? "Bengali" : currentLanguage === "hi" ? "Hindi" : "English",
          citizenName: profile.name || "Bikash Mondal",
        }),
      });

      const data = await response.json();
      if (data.draft) {
        setDraftContent(data.draft);
        if (data.subject) setDraftSubject(data.subject);
      }
    } catch (err) {
      console.warn("Using fallback draft:", err);
      // Fallback
      setDraftContent(`Subject: Grievance regarding PM-KISAN Benefit Disbursement

To the Grievance Redressal Officer,

I am writing to formally lodge a complaint regarding the non-receipt of my PM-KISAN installment. My application status is active, land verification is approved, and my e-KYC is linked to my DBT bank account.

I request your urgent intervention to examine the portal status and expedite the release of the pending amount.

Sincerely,
${profile.name || "Bikash Mondal"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={!!onBack}
        onBack={onBack}
        isVoiceActive={isListening}
        onToggleVoice={handleToggleVoice}
      />

      <main className="max-w-md mx-auto w-full px-4 py-5 space-y-4 flex-1 pb-20">
        {/* Section 1: File a Complaint Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            <span>File a Complaint</span>
          </div>

          {/* Assistant prompt box */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950 leading-snug">
                কী সমস্যা হয়েছে বলুন, লিখে বা বলে।
              </div>
              <div className="text-[11px] text-indigo-900/70 font-medium">
                (Tell us what happened, by typing or speaking.)
              </div>
            </div>
          </div>

          {/* Textarea container with Mic icon */}
          <div className="relative">
            <textarea
              id="complaint-input-textarea"
              rows={4}
              value={complaintInput}
              onChange={(e) => setComplaintInput(e.target.value)}
              placeholder="Type your complaint here..."
              className="w-full p-3.5 pr-12 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-inner resize-none leading-relaxed"
            />
            <button
              id="btn-complaint-mic"
              type="button"
              onClick={handleToggleVoice}
              className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-2 ring-red-300"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              }`}
              title="Speak complaint"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Generate button */}
          <button
            id="btn-generate-formal-draft"
            onClick={handleGenerateDraft}
            disabled={isGenerating || !complaintInput.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating Legal DPI Draft...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Formal Draft</span>
              </>
            )}
          </button>
        </div>

        {/* Section 2: Draft Your Complaint */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Draft Your Complaint
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600 bg-slate-50">
              <Edit className="w-3 h-3 text-slate-500" />
              <span>Editable</span>
            </span>
          </div>

          {/* Draft letter box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-inner">
            <textarea
              id="draft-content-textarea"
              rows={10}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 leading-relaxed font-sans focus:outline-none resize-none border-none"
            />
          </div>

          {/* Submit Info link */}
          <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-600">
            <span>📮</span>
            <span>Submit this at:</span>
            <a
              href="https://pgportal.gov.in"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
            >
              <span>CPGRAMS (pgportal.gov.in)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Go to CPGRAMS */}
            <button
              id="btn-go-to-cpgrams"
              onClick={() => setShowCPGRAMSModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Go to CPGRAMS</span>
              <span>→</span>
            </button>

            {/* Copy draft text */}
            <button
              id="btn-copy-draft-text"
              onClick={handleCopyDraft}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Draft Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy draft text</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* CPGRAMS Handoff Modal */}
      {showCPGRAMSModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ready to Submit on CPGRAMS
                </h3>
                <p className="text-[11px] text-slate-500">
                  pgportal.gov.in Central Redressal
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              We have copied your formal grievance letter. On the CPGRAMS portal:
              <br />
              <strong>1.</strong> Click 'Lodge Public Grievance'
              <br />
              <strong>2.</strong> Select Ministry: <em>Agriculture & Farmers Welfare</em>
              <br />
              <strong>3.</strong> Paste this generated text in the grievance description box.
            </p>

            <div className="flex gap-2 pt-1">
              <a
                href="https://pgportal.gov.in"
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  handleCopyDraft();
                  setShowCPGRAMSModal(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Launch CPGRAMS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowCPGRAMSModal(false)}
                className="px-3 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav currentTab="help" onSelectTab={onSelectNavTab} />
    </div>
  );
};
