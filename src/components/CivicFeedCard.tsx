import React from "react";
import { CivicFeedItem, LanguageCode, Scheme } from "../types";
import { FeedBadge } from "./FeedBadge";
import {
  Calendar,
  Building2,
  ArrowRight,
  ExternalLink,
  Clock,
} from "lucide-react";

interface CivicFeedCardProps {
  item: CivicFeedItem;
  currentLanguage: LanguageCode;
  matchedScheme?: Scheme;
  onOpenDetail: (item: CivicFeedItem) => void;
  onDirectAction?: (item: CivicFeedItem) => void;
}

export const CivicFeedCard: React.FC<CivicFeedCardProps> = ({
  item,
  currentLanguage,
  onOpenDetail,
}) => {
  // Translations
  const trans = item.translations?.[currentLanguage];
  const title = trans?.title || item.title;
  const summary = trans?.summary || item.summary;
  const ctaLabel = trans?.cta_label || item.cta_label;

  // Calculate closing days for deadlines
  const getClosingNotice = () => {
    if (item.type !== "deadline" || !item.effective_date) return null;
    const target = new Date(item.effective_date);
    const now = new Date("2026-08-17");
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      if (currentLanguage === "bn") return `${diffDays} দিন বাকি`;
      if (currentLanguage === "hi") return `${diffDays} दिन शेष`;
      return `Closes in ${diffDays} days`;
    }
    if (diffDays === 0) {
      if (currentLanguage === "bn") return "আজই শেষ দিন";
      if (currentLanguage === "hi") return "आज अंतिम दिन";
      return "Closes today";
    }
    return null;
  };

  const closingNotice = getClosingNotice();

  return (
    <div
      id={`feed-card-${item.id}`}
      onClick={() => onOpenDetail(item)}
      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between gap-3.5 cursor-pointer group"
    >
      {/* Top Row: Category Badge & Dates */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <FeedBadge type={item.type} currentLanguage={currentLanguage} />

        {closingNotice && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50/90 border border-amber-200/80 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{closingNotice}</span>
          </div>
        )}

        {!closingNotice && item.effective_date && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{item.effective_date}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-1.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {summary}
        </p>
      </div>

      {/* Bottom Row: Official Source & CTA */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 max-w-[60%]">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{item.source_name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`btn-cta-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(item);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
