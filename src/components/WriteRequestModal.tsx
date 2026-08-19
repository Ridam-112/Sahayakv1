import React, { useState } from "react";
import {
  X,
  Send,
  Sparkles,
  MapPin,
  AlertCircle,
  Building2,
  CheckCircle2,
  HelpCircle,
  Check,
} from "lucide-react";
import {
  CitizenDevelopmentRequest,
  LanguageCode,
  DevelopmentCategory,
} from "../types";
import { DEVELOPMENT_CATEGORIES, classifyCitizenTextLocally } from "../data/developmentData";

interface WriteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CitizenDevelopmentRequest) => void;
  currentLanguage: LanguageCode;
}

export const WriteRequestModal: React.FC<WriteRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentLanguage,
}) => {
  const [text, setText] = useState("");
  const [city, setCity] = useState("Balurghat");
  const [district, setDistrict] = useState("Dakshin Dinajpur");
  const [state, setState] = useState("West Bengal");
  const [category, setCategory] = useState<DevelopmentCategory>("healthcare");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("high");
  const [affectedPopulation, setAffectedPopulation] = useState<
    "individual" | "neighborhood" | "community" | "entire_region"
  >("community");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);

    try {
      // Call AI classifier or fallback
      const response = await fetch("/api/process-development-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: currentLanguage,
          location: { state, district, city },
          source: "text",
        }),
      });

      let data: any = null;
      if (response.ok) {
        data = await response.json();
      }

      if (!data || !data.requestId) {
        const local = classifyCitizenTextLocally(text);
        data = {
          requestId: `REQ-${Date.now().toString().slice(-5)}`,
          language: currentLanguage,
          originalText: text,
          category: category || local.category,
          subCategory: `${category || local.category}_need`,
          location: {
            country: "India",
            state,
            district,
            city,
          },
          problem: text,
          urgency,
          affectedPopulation,
          citizenSuggestedSolution: null,
          timestamp: "Just now",
          source: "text",
          verifiedStatus: "verified",
          priorityScoreEstimate: 88,
        };
      }

      onSubmit(data);
      onClose();
    } catch (err) {
      console.warn("Submit error:", err);
      // Fallback submit
      const local = classifyCitizenTextLocally(text);
      onSubmit({
        requestId: `REQ-${Date.now().toString().slice(-5)}`,
        language: currentLanguage,
        originalText: text,
        category: category || local.category,
        subCategory: `${category || local.category}_need`,
        location: {
          country: "India",
          state,
          district,
          city,
        },
        problem: text,
        urgency,
        affectedPopulation,
        citizenSuggestedSolution: null,
        timestamp: "Just now",
        source: "text",
        verifiedStatus: "verified",
        priorityScoreEstimate: 88,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              ✍️
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentLanguage === "bn"
                  ? "উন্নয়ন সংক্রান্ত প্রয়োজন জানান"
                  : currentLanguage === "hi"
                  ? "विकास संबंधी आवश्यकता दर्ज करें"
                  : "Submit a Development Need"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Digital Public Infrastructure Request Aggregator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
          {/* Main Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              {currentLanguage === "bn"
                ? "আপনার এলাকার সমস্যা বা প্রয়োজনীয়তা বর্ণনা করুন *"
                : currentLanguage === "hi"
                ? "अपनी समस्या या विकास की आवश्यकता का विवरण लिखें *"
                : "Describe the issue or development need *"}
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              placeholder={
                currentLanguage === "bn"
                  ? "যেমন: বালুরঘাট হাসপাতালে বিশেষজ্ঞ ডাক্তার ও জরুরি বিভাগ নেই..."
                  : currentLanguage === "hi"
                  ? "जैसे: बालुरघाट अस्पताल में विशेषज्ञ डॉक्टर व इमरजेंसी वार्ड की कमी है..."
                  : "e.g., Balurghat hospital lacks specialist doctors and emergency trauma ward..."
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEVELOPMENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">City / Block / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Urgency & Affected Population */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High (Urgent)</option>
                <option value="critical">Critical / Emergency</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Impact Scale</label>
              <select
                value={affectedPopulation}
                onChange={(e) => setAffectedPopulation(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="neighborhood">Neighborhood (Ward)</option>
                <option value="community">Entire Town / Community</option>
                <option value="entire_region">District / Region</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting ? "Analyzing & Submitting..." : "Submit to DPI Aggregation Engine"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
