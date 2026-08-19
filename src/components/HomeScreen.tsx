import React from "react";
import {
  Mic,
  Keyboard,
  BarChart3,
  Landmark,
  Newspaper,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Activity,
  Globe2,
  Volume2,
  ChevronRight,
  Compass,
} from "lucide-react";
import { LanguageCode, NavTab, ScreenState } from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { INITIAL_DEMAND_HOTSPOTS, INITIAL_CITIZEN_REQUESTS } from "../data/developmentData";
import { speakText, stopSpeaking } from "../utils/speech";

interface HomeScreenProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onStartVoiceReport: () => void;
  onStartTextReport: () => void;
  onOpenDashboard: () => void;
  onOpenSchemes: () => void;
  onOpenFeed: () => void;
  onOpenHelp: () => void;
  onSelectNavTab: (tab: NavTab) => void;
  totalRequestsCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentLanguage,
  onSelectLanguage,
  onStartVoiceReport,
  onStartTextReport,
  onOpenDashboard,
  onOpenSchemes,
  onOpenFeed,
  onOpenHelp,
  onSelectNavTab,
  totalRequestsCount = 12480,
}) => {
  const getHeroContent = () => {
    switch (currentLanguage) {
      case "bn":
        return {
          title: "সহায়ক",
          tagline: "আপনার কণ্ঠস্বর আপনার অঞ্চলের উন্নয়নে ভূমিকা রাখতে পারে।",
          subtext:
            "হাসপাতাল, রাস্তাঘাট, পানীয় জল, স্কুল বা বিদ্যুৎ সংক্রান্ত সমস্যা আপনার নিজের ভাষায় বলুন। এআই এই তথ্য বিশ্লেষণ করে নীতিনির্ধারকদের কাছে অগ্রাধিকার হিসেবে তুলে ধরবে।",
          voiceCta: "উন্নয়ন প্রয়োজন জানান",
          textCta: "লিখে অনুরোধ জানান",
          howItWorks: "কীভাবে কাজ করে?",
          dashboardLabel: "উন্নয়ন গোয়েন্দা ড্যাশবোর্ড",
          schemesLabel: "সরকারি প্রকল্প খুঁজুন",
          feedLabel: "নাগরিক বিজ্ঞপ্তি ফিড",
          recentReports: "সাম্প্রতিক নাগরিক মতামত",
        };
      case "hi":
        return {
          title: "सहायक",
          tagline: "आपकी आवाज़ आपके समुदाय का विकास कर सकती है।",
          subtext:
            "अस्पताल, सड़कें, पीने का पानी, स्कूल या बिजली जैसी समस्याओं को अपनी भाषा में बताएं। एआई इसका विश्लेषण कर नीति निर्माताओं तक प्राथमिकताएं पहुँचाएगा।",
          voiceCta: "विकास की आवश्यकता बताएं",
          textCta: "लिखकर अनुरोध भेजें",
          howItWorks: "यह कैसे काम करता है?",
          dashboardLabel: "डेवलपमेंट इंटेलिजेंस डैशबोर्ड",
          schemesLabel: "सरकारी योजनाएं खोजें",
          feedLabel: "नागरिक समाचार और अपडेट",
          recentReports: "हालिया नागरिक प्रतिक्रिया",
        };
      default:
        return {
          title: "Sahayak",
          tagline: "Your voice can shape your community.",
          subtext:
            "Report local development needs—hospitals, roads, drinking water, schools, or electricity—in your own language. AI aggregates citizen voices into explainable infrastructure priorities for policymakers.",
          voiceCta: "Report a Development Need",
          textCta: "Write a Request",
          howItWorks: "Citizen to Policy Pipeline",
          dashboardLabel: "Development Intelligence",
          schemesLabel: "Find Government Schemes",
          feedLabel: "Civic Announcement Feed",
          recentReports: "Recent Citizen Voices",
        };
    }
  };

  const content = getHeroContent();
  const topHotspot = INITIAL_DEMAND_HOTSPOTS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
      />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-3 pb-8 space-y-4">
        {/* Track 1 BRICS Innovation Header Pill */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-slate-200 rounded-full px-3 py-1 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-indigo-700 font-bold">Track 1:</span> AI for Digital Public Infrastructure
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
            BRICS Innovation
          </span>
        </div>

        {/* Primary Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xl border border-indigo-800/50">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
            <Globe2 className="w-32 h-32" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Multilingual Digital Public Good</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {content.title}
              </h1>
              <p className="text-base font-semibold text-indigo-200 italic">
                "{content.tagline}"
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {content.subtext}
            </p>

            {/* Primary Action Button - Voice Report */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                id="home-primary-voice-cta"
                onClick={onStartVoiceReport}
                className="w-full group bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-3.5 px-5 rounded-2xl shadow-lg flex items-center justify-between transition-all transform active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center text-slate-950">
                    <Mic className="w-5 h-5 animate-pulse stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-extrabold tracking-tight">
                      {content.voiceCta}
                    </div>
                    <div className="text-[11px] font-medium text-slate-900/80">
                      Bengali • Hindi • English • Voice AI
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-950 transform group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary Action - Write a Request */}
              <button
                id="home-secondary-text-cta"
                onClick={onStartTextReport}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/20 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer active:scale-98"
              >
                <Keyboard className="w-4 h-4 text-indigo-300" />
                <span>{content.textCta}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Aggregation Ticker & Key Stats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live DPI Aggregation Stream
              </span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-lg sm:text-xl font-black text-indigo-700">
                {totalRequestsCount.toLocaleString()}+
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                Citizen Requests
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-lg sm:text-xl font-black text-rose-600">
                #1 Health
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                Top Priority Need
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-lg sm:text-xl font-black text-amber-600">
                14 Hubs
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                Active Hotspots
              </div>
            </div>
          </div>
        </div>

        {/* Flagship Policymaker Dashboard Banner */}
        <div
          id="home-policymaker-banner"
          onClick={onOpenDashboard}
          className="group relative overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-slate-800 hover:border-indigo-500 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <BarChart3 className="w-4 h-4" />
                <span>{content.dashboardLabel}</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                Demand Hotspots & AI Policy Recommendations
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                Interactive spatial map, demographic gap scoring, and explainable priorities for government officials.
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Top Hotspot: <strong className="text-white">Balurghat (92/100)</strong></span>
            </div>
            <span className="text-amber-300 font-semibold flex items-center gap-1">
              View Map & Intel →
            </span>
          </div>
        </div>

        {/* 4-Step Citizen-to-Policy Pipeline Visual Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>{content.howItWorks}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              End-to-End DPI Flow
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-indigo-50/60 p-2 rounded-xl border border-indigo-100 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black mb-1">
                1
              </div>
              <span className="text-[10px] font-bold text-slate-800 leading-tight">
                Citizen Voice / Text
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">
                Local language
              </span>
            </div>

            <div className="bg-indigo-50/60 p-2 rounded-xl border border-indigo-100 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black mb-1">
                2
              </div>
              <span className="text-[10px] font-bold text-slate-800 leading-tight">
                AI Extract & Geocode
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">
                Classify need
              </span>
            </div>

            <div className="bg-indigo-50/60 p-2 rounded-xl border border-indigo-100 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black mb-1">
                3
              </div>
              <span className="text-[10px] font-bold text-slate-800 leading-tight">
                Hotspot Clustering
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">
                12k+ reports
              </span>
            </div>

            <div className="bg-indigo-50/60 p-2 rounded-xl border border-indigo-100 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black mb-1">
                4
              </div>
              <span className="text-[10px] font-bold text-slate-800 leading-tight">
                Policy Priority
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">
                Action brief
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Access Navigation Grid (Schemes, Civic Feed, Grievances) */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Citizen Services & Governance
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Government Scheme Finder */}
            <button
              id="home-schemes-card"
              onClick={onOpenSchemes}
              className="bg-white border border-slate-200 hover:border-indigo-400 p-3.5 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                {content.schemesLabel}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                PM-KISAN, PMAY, Swasthya
              </div>
            </button>

            {/* Civic Announcement Feed */}
            <button
              id="home-feed-card"
              onClick={onOpenFeed}
              className="bg-white border border-slate-200 hover:border-indigo-400 p-3.5 rounded-2xl text-left shadow-xs transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Newspaper className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                {content.feedLabel}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                Government circulars & news
              </div>
            </button>
          </div>
        </div>

        {/* Recent Citizen Voices Stream */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-600" />
              <span>{content.recentReports}</span>
            </h3>
            <button
              onClick={onOpenDashboard}
              className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              See All Hotspots →
            </button>
          </div>

          <div className="space-y-2.5">
            {INITIAL_CITIZEN_REQUESTS.slice(0, 3).map((req) => (
              <div
                key={req.requestId}
                className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    <span className="font-bold text-slate-800">
                      {req.location.city}, {req.location.district}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {req.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic">
                  "{req.originalText}"
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-white font-semibold text-indigo-700 border border-slate-200">
                    {req.category.toUpperCase().replace("_", " ")}
                  </span>
                  <button
                    onClick={() => speakText(req.originalText, req.language as any)}
                    className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 cursor-pointer font-medium"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Listen</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav currentTab="home" onSelectTab={onSelectNavTab} />
    </div>
  );
};
