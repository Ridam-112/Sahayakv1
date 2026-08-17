import React, { useState, useMemo } from "react";
import {
  LanguageCode,
  CitizenProfile,
  Scheme,
  CivicFeedItem,
  CivicFeedCategory,
  NavTab,
} from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { CivicFeedCard } from "./CivicFeedCard";
import { CivicFeedDetailModal } from "./CivicFeedDetailModal";
import feedDataJson from "../data/feed.json";
import {
  Search,
  Edit3,
  Mic,
  HelpCircle,
  Bell,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

interface CivicFeedProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  profile: CitizenProfile;
  schemes: Scheme[];
  onSelectTypeMode: () => void;
  onSelectVoiceMode: () => void;
  onNeedHelp: () => void;
  onSelectScheme: (scheme: Scheme) => void;
  onSelectNavTab: (tab: NavTab) => void;
  onOpenAssistant: (query?: string) => void;
}

export const CivicFeed: React.FC<CivicFeedProps> = ({
  currentLanguage,
  onSelectLanguage,
  profile,
  schemes,
  onSelectTypeMode,
  onSelectVoiceMode,
  onNeedHelp,
  onSelectScheme,
  onSelectNavTab,
  onOpenAssistant,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeFeedDetail, setActiveFeedDetail] = useState<CivicFeedItem | null>(null);
  const [feedError, setFeedError] = useState(false);
  const [feedItems, setFeedItems] = useState<CivicFeedItem[]>(
    feedDataJson as CivicFeedItem[]
  );

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      if (currentLanguage === "bn") return "শুভ সকাল 👋";
      if (currentLanguage === "hi") return "शुभ प्रभात 👋";
      return "Good morning 👋";
    } else if (hour < 17) {
      if (currentLanguage === "bn") return "শুভ দুপুর 👋";
      if (currentLanguage === "hi") return "शुभ दोपहर 👋";
      return "Good afternoon 👋";
    } else {
      if (currentLanguage === "bn") return "শুভ সন্ধ্যা 👋";
      if (currentLanguage === "hi") return "शुभ संध्या 👋";
      return "Good evening 👋";
    }
  };

  const getSubtext = () => {
    if (currentLanguage === "bn") {
      return "সরকারি পরিষেবা, প্রকল্প ও গুরুত্বপূর্ণ আপডেট আবিষ্কার করুন।";
    }
    if (currentLanguage === "hi") {
      return "सरकारी सेवाएं, योजनाएं और महत्वपूर्ण अपडेट जानें।";
    }
    return "Discover government services, schemes and important updates.";
  };

  // Filter & Personalization Ranking
  const rankedFeedItems = useMemo(() => {
    if (feedError) return [];

    let items = [...feedItems];

    // Filter by category
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.type === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const trans = item.translations?.[currentLanguage];
        const title = (trans?.title || item.title).toLowerCase();
        const summary = (trans?.summary || item.summary).toLowerCase();
        const source = item.source_name.toLowerCase();
        const tag = (item.category_tag || "").toLowerCase();
        return (
          title.includes(q) ||
          summary.includes(q) ||
          source.includes(q) ||
          tag.includes(q)
        );
      });
    }

    // Relevance Ranking with Citizen Profile
    return items.sort((a, b) => {
      const occupation = (profile.occupation || "").toLowerCase();
      const ageNum = parseInt(profile.age || "0", 10);

      const scoreItem = (item: CivicFeedItem) => {
        let score = 0;
        const text = `${item.title} ${item.summary} ${item.target_audience || ""} ${item.category_tag || ""}`.toLowerCase();

        // Profile match
        if (occupation.includes("farmer") && (text.includes("kisan") || text.includes("farmer") || text.includes("কৃষক") || text.includes("किसान"))) {
          score += 15;
        }
        if (ageNum >= 60 && (text.includes("senior") || text.includes("vay vandana") || text.includes("pension") || text.includes("প্রবীণ") || text.includes("वृद्ध"))) {
          score += 15;
        }
        if (profile.hasRationCard || text.includes("ration") || text.includes("onorc")) {
          score += 8;
        }

        // Deadline urgency
        if (item.type === "deadline") score += 10;
        if (item.type === "new_launch") score += 6;
        if (item.type === "government_update") score += 4;

        return score;
      };

      return scoreItem(b) - scoreItem(a);
    });
  }, [feedItems, selectedCategory, searchQuery, profile, currentLanguage, feedError]);

  // Search matches from existing schemes
  const matchingSchemes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return schemes.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.benefitShort.toLowerCase().includes(q)
    );
  }, [searchQuery, schemes]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenAssistant(`Tell me about ${searchQuery.trim()} schemes and criteria`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      {/* Top Header */}
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={false}
      />

      <main className="max-w-md mx-auto w-full px-4 sm:px-5 py-5 space-y-6 flex-1">
        {/* Greeting Section */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {getGreeting()}
            </h1>
            {profile.name && (
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
                👤 {profile.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {getSubtext()}
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="civic-search-bar"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLanguage === "bn"
                  ? "স্কিম ও পরিষেবা অনুসন্ধান করুন..."
                  : currentLanguage === "hi"
                  ? "योजनाएं एवं सेवाएं खोजें..."
                  : "Search schemes & services..."
              }
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick matching schemes dropdown when searching */}
          {matchingSchemes.length > 0 && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-20 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                {currentLanguage === "bn"
                  ? "সংশ্লিষ্ট সরকারি প্রকল্প"
                  : "Matching Verified Schemes"}
              </div>
              {matchingSchemes.map((sch) => (
                <button
                  key={sch.id}
                  type="button"
                  onClick={() => onSelectScheme(sch)}
                  className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600">
                      {sch.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {sch.benefitShort}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {currentLanguage === "bn"
              ? "সব আপডেট"
              : currentLanguage === "hi"
              ? "सभी अपडेट"
              : "All Updates"}
          </button>
          <button
            onClick={() => setSelectedCategory("deadline")}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === "deadline"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>⏰</span>
            <span>
              {currentLanguage === "bn"
                ? "শেষ সময়সীমা"
                : currentLanguage === "hi"
                ? "अंतिम तिथि"
                : "Deadlines"}
            </span>
          </button>
          <button
            onClick={() => setSelectedCategory("new_launch")}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === "new_launch"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>🆕</span>
            <span>
              {currentLanguage === "bn"
                ? "নতুন সূচনা"
                : currentLanguage === "hi"
                ? "नई योजनाएं"
                : "New Launches"}
            </span>
          </button>
          <button
            onClick={() => setSelectedCategory("government_update")}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === "government_update"
                ? "bg-sky-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>📢</span>
            <span>
              {currentLanguage === "bn"
                ? "সরকারি নির্দেশ"
                : currentLanguage === "hi"
                ? "सरकारी निर्देश"
                : "Govt Updates"}
            </span>
          </button>
          <button
            onClick={() => setSelectedCategory("impact")}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === "impact"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>📊</span>
            <span>
              {currentLanguage === "bn"
                ? "অগ্রগতি"
                : currentLanguage === "hi"
                ? "प्रगति"
                : "Impact"}
            </span>
          </button>
        </div>

        {/* Section: Civic Updates Feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {currentLanguage === "bn"
                  ? "নাগরিক আপডেট (Civic Updates)"
                  : currentLanguage === "hi"
                  ? "नागरिक अपडेट (Civic Updates)"
                  : "Civic Updates"}
              </h2>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                {rankedFeedItems.length}
              </span>
            </div>
            <button
              onClick={() => {
                setFeedError(false);
                setFeedItems(feedDataJson as CivicFeedItem[]);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              title="Refresh updates"
            >
              <RefreshCw className="w-3 h-3" />
              <span>
                {currentLanguage === "bn"
                  ? "রিফ্রেশ"
                  : currentLanguage === "hi"
                  ? "रिफ्रेश"
                  : "Refresh"}
              </span>
            </button>
          </div>

          {/* Feed List */}
          {rankedFeedItems.length > 0 && (
            <div className="space-y-3">
              {rankedFeedItems.map((item) => {
                const matched = schemes.find((s) => s.id === item.scheme_id);
                return (
                  <CivicFeedCard
                    key={item.id}
                    item={item}
                    currentLanguage={currentLanguage}
                    matchedScheme={matched}
                    onOpenDetail={(it) => setActiveFeedDetail(it)}
                  />
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!feedError && rankedFeedItems.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  {currentLanguage === "bn"
                    ? "এই মুহূর্তে কোনো নতুন নাগরিক আপডেট নেই।"
                    : currentLanguage === "hi"
                    ? "फिलहाल कोई नया नागरिक अपडेट नहीं है।"
                    : "No new civic updates right now."}
                </h3>
                <p className="text-xs text-slate-500">
                  {currentLanguage === "bn"
                    ? "সব সরকারি স্কিম দেখতে নিচে যান বা স্কিম ডিরেক্টরি খুলুন।"
                    : "Explore all available schemes using the button below."}
                </p>
              </div>
              <button
                onClick={() => onSelectNavTab("schemes")}
                className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer transition-all shadow-xs"
              >
                {currentLanguage === "bn"
                  ? "সরকারি সেবা খুঁজুন"
                  : currentLanguage === "hi"
                  ? "सरकारी सेवाएं खोजें"
                  : "Find government services"}
              </button>
            </div>
          )}

          {/* Error State */}
          {feedError && (
            <div className="bg-white rounded-2xl border border-rose-200 p-6 text-center space-y-3 shadow-2xs">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-800">
                  {currentLanguage === "bn"
                    ? "নাগরিক আপডেট লোড করা যায়নি।"
                    : currentLanguage === "hi"
                    ? "नागरिक अपडेट लोड नहीं हो सके।"
                    : "Unable to load civic updates."}
                </h3>
                <p className="text-xs text-slate-500">
                  {currentLanguage === "bn"
                    ? "অনুগ্রহ করে আবার চেষ্টা করুন।"
                    : "Please try reloading the curated feed."}
                </p>
              </div>
              <button
                onClick={() => {
                  setFeedError(false);
                  setFeedItems(feedDataJson as CivicFeedItem[]);
                }}
                className="py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer transition-all"
              >
                {currentLanguage === "bn"
                  ? "আবার চেষ্টা করুন"
                  : currentLanguage === "hi"
                  ? "पुनः प्रयास करें"
                  : "Try again"}
              </button>
            </div>
          )}
        </section>

        {/* CORE USER ACTION AREA: Find benefits for me */}
        <section
          id="find-benefits-action-section"
          className="pt-2 border-t border-slate-200/80 space-y-3.5"
        >
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>
                {currentLanguage === "bn"
                  ? "আমার জন্য সুযোগ-সুবিধা খুঁজুন"
                  : currentLanguage === "hi"
                  ? "मेरे लिए योजनाएं खोजें"
                  : "Find benefits for me"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {currentLanguage === "bn"
                ? "সহজ প্রশ্নের উত্তর দিন বা নিজের ভাষায় কথা বলে যোগ্যতা যাচাই করুন।"
                : currentLanguage === "hi"
                ? "सरल प्रश्नों के उत्तर दें या अपनी भाषा में बोलकर पात्रता जांचें।"
                : "Check personalized scheme eligibility via guided questions or voice interview."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type Mode Card */}
            <button
              id="civic-feed-btn-type"
              onClick={onSelectTypeMode}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-600 hover:ring-4 hover:ring-indigo-50 transition-all shadow-xs flex flex-col items-center justify-center text-center space-y-2.5 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <Edit3 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
                  <span>✍️</span>
                  <span>
                    {currentLanguage === "bn"
                      ? "লিখব"
                      : currentLanguage === "hi"
                      ? "लिखूंगा"
                      : "I'll type"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {currentLanguage === "bn"
                    ? "(Type form)"
                    : "(Guided form)"}
                </div>
              </div>
            </button>

            {/* Voice Mode Card */}
            <button
              id="civic-feed-btn-voice"
              onClick={onSelectVoiceMode}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-600 hover:ring-4 hover:ring-indigo-50 transition-all shadow-xs flex flex-col items-center justify-center text-center space-y-2.5 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
                  <span>🎤</span>
                  <span>
                    {currentLanguage === "bn"
                      ? "বলব"
                      : currentLanguage === "hi"
                      ? "बोलूंगा"
                      : "I'll speak"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {currentLanguage === "bn"
                    ? "(Voice interview)"
                    : "(Voice wizard)"}
                </div>
              </div>
            </button>
          </div>

          {/* Need Help / Grievance Button */}
          <button
            id="civic-feed-btn-help"
            onClick={onNeedHelp}
            className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>
              {currentLanguage === "bn"
                ? "সাহায্য দরকার (Need Help / Grievance)"
                : currentLanguage === "hi"
                ? "सहायता चाहिए (Need Help / Grievance)"
                : "Need Help / File Grievance"}
            </span>
          </button>
        </section>
      </main>

      {/* Bottom Nav Bar */}
      <BottomNav currentTab="home" onSelectTab={onSelectNavTab} />

      {/* Feed Detail Modal */}
      {activeFeedDetail && (
        <CivicFeedDetailModal
          item={activeFeedDetail}
          currentLanguage={currentLanguage}
          profile={profile}
          schemes={schemes}
          onClose={() => setActiveFeedDetail(null)}
          onSelectScheme={(sch) => {
            setActiveFeedDetail(null);
            onSelectScheme(sch);
          }}
          onOpenGrievance={onNeedHelp}
        />
      )}
    </div>
  );
};
