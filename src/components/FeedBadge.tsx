import React from "react";
import { CivicFeedCategory, LanguageCode } from "../types";

interface FeedBadgeProps {
  type: CivicFeedCategory;
  currentLanguage?: LanguageCode;
}

export const FeedBadge: React.FC<FeedBadgeProps> = ({
  type,
  currentLanguage = "en",
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case "new_launch":
        return {
          icon: "🆕",
          label:
            currentLanguage === "bn"
              ? "নতুন সূচনা"
              : currentLanguage === "hi"
              ? "नई योजना"
              : "NEW LAUNCH",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "deadline":
        return {
          icon: "⏰",
          label:
            currentLanguage === "bn"
              ? "শেষ সময়সীমা"
              : currentLanguage === "hi"
              ? "अंतिम तिथि"
              : "DEADLINE",
          className: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "government_update":
        return {
          icon: "📢",
          label:
            currentLanguage === "bn"
              ? "সরকারি আপডেট"
              : currentLanguage === "hi"
              ? "सरकारी अपडेट"
              : "GOVT UPDATE",
          className: "bg-sky-50 text-sky-800 border-sky-200",
        };
      case "impact":
        return {
          icon: "📊",
          label:
            currentLanguage === "bn"
              ? "অগ্রগতি ও প্রভাব"
              : currentLanguage === "hi"
              ? "प्रगति रिपोर्ट"
              : "IMPACT",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      default:
        return {
          icon: "🏛️",
          label: "CIVIC",
          className: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${config.className}`}
    >
      <span className="text-[12px]">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
