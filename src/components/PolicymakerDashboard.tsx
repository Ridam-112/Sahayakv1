import React, { useState, useMemo } from "react";
import {
  BarChart3,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Users,
  Building,
  CheckCircle2,
  Sparkles,
  Sliders,
  Filter,
  ArrowUpRight,
  Globe2,
  Volume2,
  Share2,
  FileText,
  Layers,
  Search,
  RefreshCw,
  Info,
  ChevronDown,
} from "lucide-react";
import {
  DemandHotspot,
  CitizenDevelopmentRequest,
  LanguageCode,
  NavTab,
  DevelopmentCategory,
} from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import {
  INITIAL_DEMAND_HOTSPOTS,
  INITIAL_CITIZEN_REQUESTS,
  DEVELOPMENT_CATEGORIES,
  BRICS_REGIONS,
  calculatePriorityScore,
  getCategoryMeta,
} from "../data/developmentData";
import { speakText } from "../utils/speech";

interface PolicymakerDashboardProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectNavTab: (tab: NavTab) => void;
  onBack?: () => void;
  citizenRequests?: CitizenDevelopmentRequest[];
}

export const PolicymakerDashboard: React.FC<PolicymakerDashboardProps> = ({
  currentLanguage,
  onSelectLanguage,
  onSelectNavTab,
  onBack,
  citizenRequests = INITIAL_CITIZEN_REQUESTS,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    INITIAL_DEMAND_HOTSPOTS[0]?.id || "hotspot-balurghat-health"
  );
  const [activeTab, setActiveTab] = useState<"hotspots" | "map" | "sim" | "feed">("hotspots");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Configurable Weights for Explainable AI Engine
  const [weights, setWeights] = useState({
    requestVolume: 0.35,
    severity: 0.20,
    populationImpact: 0.15,
    infrastructureGap: 0.20,
    underservedFactor: 0.10,
  });

  // Calculate live dynamic priority scores based on current sliders
  const scoredHotspots = useMemo(() => {
    return INITIAL_DEMAND_HOTSPOTS.map((hotspot) => {
      const dynamicScore = calculatePriorityScore(hotspot, weights);
      return {
        ...hotspot,
        computedScore: dynamicScore,
      };
    }).sort((a, b) => b.computedScore - a.computedScore);
  }, [weights]);

  // Filtered list
  const filteredHotspots = useMemo(() => {
    return scoredHotspots.filter((h) => {
      const matchesCountry = selectedCountry === "IN" ? h.location.country === "India" : true;
      const matchesCat = selectedCategory === "all" || h.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        h.location.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCountry && matchesCat && matchesSearch;
    });
  }, [scoredHotspots, selectedCountry, selectedCategory, searchQuery]);

  const activeHotspot = useMemo(() => {
    return (
      scoredHotspots.find((h) => h.id === selectedHotspotId) ||
      scoredHotspots[0] ||
      INITIAL_DEMAND_HOTSPOTS[0]
    );
  }, [scoredHotspots, selectedHotspotId]);

  const totalRequestsAggregated = useMemo(() => {
    return scoredHotspots.reduce((acc, h) => acc + h.requestCount, 0);
  }, [scoredHotspots]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={true}
        onBack={onBack}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-3 pb-8 space-y-4">
        {/* Top Intelligence Header Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                    Development Intelligence
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    AI-Driven Citizen Feedback & Infrastructure Prioritization Engine
                  </p>
                </div>
              </div>
            </div>

            {/* BRICS Nation Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                BRICS Scope:
              </span>
              <select
                id="brics-country-selector"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                {BRICS_REGIONS.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.flag} {region.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Aggregated Requests
              </div>
              <div className="text-xl font-black text-indigo-700 mt-0.5">
                {totalRequestsAggregated.toLocaleString()}+
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+18.4% this month</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Active Hotspots
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {scoredHotspots.length} Hubs
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Spatial clusters
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Top AI Priority
              </div>
              <div className="text-xl font-black text-rose-600 mt-0.5">
                Balurghat (92)
              </div>
              <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                Hospital Deficit
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Budget Alignment
              </div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">
                ₹84.2 Cr
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Mapped to NHM / PMGSY
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 border-t border-slate-100 pt-2 overflow-x-auto scrollbar-none">
            {[
              { id: "hotspots", label: "Priority Projects & Hotspots", icon: BarChart3 },
              { id: "map", label: "Spatial Map Visualizer", icon: MapPin },
              { id: "sim", label: "Explainable AI Weights", icon: Sliders },
              { id: "feed", label: "Live Citizen Feed", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Priority Projects & Hotspots */}
        {activeTab === "hotspots" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Filterable Hotspots List */}
            <div className="lg:col-span-5 space-y-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  All Needs
                </button>
                {DEVELOPMENT_CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Hotspots Card List */}
              <div className="space-y-2.5">
                {filteredHotspots.map((hotspot, index) => {
                  const isSelected = hotspot.id === selectedHotspotId;
                  const catMeta = getCategoryMeta(hotspot.category);

                  return (
                    <div
                      key={hotspot.id}
                      onClick={() => setSelectedHotspotId(hotspot.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? "bg-white border-indigo-600 ring-2 ring-indigo-100"
                          : "bg-white border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                            #{index + 1}
                          </span>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900">
                              {hotspot.title}
                            </h3>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{hotspot.location.district}, {hotspot.location.state}</span>
                            </div>
                          </div>
                        </div>

                        {/* Priority Score Badge */}
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <span>Score: {hotspot.computedScore}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-indigo-700 font-semibold flex items-center gap-1">
                          {hotspot.requestCount.toLocaleString()} citizen voices
                        </span>
                        <span className="text-slate-500 font-medium">
                          {hotspot.aiRecommendation.estimatedBudget || "Plan Mapped"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: In-Depth Explainable Recommendation View */}
            <div className="lg:col-span-7 space-y-3">
              {activeHotspot && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                  {/* Header Title & Priority Label */}
                  <div className="space-y-2 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs">
                        {activeHotspot.category.toUpperCase().replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        AI-Assisted Priority Estimate
                      </span>
                    </div>

                    <h2 className="text-lg font-black text-slate-900">
                      {activeHotspot.title}
                    </h2>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-semibold">{activeHotspot.location.district}, {activeHotspot.location.state}</span>
                      <span>•</span>
                      <span className="text-slate-500">{activeHotspot.demographics.population.toLocaleString()} catchment population</span>
                    </div>
                  </div>

                  {/* Recommendation Card */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended Policy Action</span>
                    </div>
                    <p className="text-sm font-bold leading-snug">
                      {activeHotspot.aiRecommendation.title}
                    </p>
                    <p className="text-xs text-slate-300">
                      {activeHotspot.aiRecommendation.summary}
                    </p>
                    <p className="text-xs text-amber-200 font-medium pt-1">
                      Action: {activeHotspot.aiRecommendation.suggestedAction}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Estimated Cost</div>
                        <div className="font-bold text-amber-300">
                          {activeHotspot.aiRecommendation.estimatedBudget || "₹14.80 Cr"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Target Timeline</div>
                        <div className="font-bold text-emerald-300">
                          {activeHotspot.aiRecommendation.targetTimeline || "6-9 Months"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explainable Why Breakdown */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Why is this recommended? (Explainable AI Logic)</span>
                    </h3>

                    <div className="space-y-2 text-xs">
                      {activeHotspot.aiRecommendation.whyJustification.map((reason, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2 text-slate-700"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export / Action Bar */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 italic">
                      Disclaimer: AI-assisted priority estimate, requires administrative sign-off.
                    </span>
                    <button
                      onClick={() => {
                        const blob = new Blob(
                          [
                            JSON.stringify(
                              {
                                project: activeHotspot.aiRecommendation,
                                hotspot: activeHotspot,
                                score: activeHotspot.computedScore,
                                generatedAt: new Date().toISOString(),
                              },
                              null,
                              2
                            ),
                          ],
                          { type: "application/json" }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `sahayak-policy-brief-${activeHotspot.id}.json`;
                        a.click();
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-300" />
                      <span>Export Policy Brief</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Spatial Map Visualizer */}
        {activeTab === "map" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Spatial Demand Hotspots Map
                </h3>
                <p className="text-xs text-slate-500">
                  Visual aggregation of citizen requests across Indian districts
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> High Priority
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low
                </span>
              </div>
            </div>

            {/* Interactive Grid Map representation */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white min-h-[360px] relative overflow-hidden flex flex-col justify-between border border-slate-800">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {scoredHotspots.map((hotspot) => {
                  const isSelected = hotspot.id === selectedHotspotId;
                  const isHigh = hotspot.computedScore >= 80;
                  const isMed = hotspot.computedScore >= 60 && hotspot.computedScore < 80;

                  return (
                    <div
                      key={hotspot.id}
                      onClick={() => setSelectedHotspotId(hotspot.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-400"
                          : "bg-slate-800/80 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white">
                          {hotspot.location.district}
                        </span>
                        <span
                          className={`w-3 h-3 rounded-full animate-ping ${
                            isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        ></span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {hotspot.location.state}
                      </div>
                      <div className="text-[10px] text-amber-300 font-bold mt-1">
                        {hotspot.requestCount.toLocaleString()} reports • Score: {hotspot.computedScore}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative z-10 pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Selected: <strong className="text-white">{activeHotspot.title}</strong></span>
                <button
                  onClick={() => setActiveTab("hotspots")}
                  className="text-indigo-300 hover:underline font-semibold"
                >
                  View Full Detail & Actions →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Explainable AI Weight Tuning */}
        {activeTab === "sim" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Explainable Multi-Criteria Priority Weights</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Customize how citizen demand, severity, population scale, infrastructure deficit, and demographic vulnerability affect project prioritization scores.
                </p>
              </div>
              <button
                onClick={() =>
                  setWeights({
                    requestVolume: 0.35,
                    severity: 0.20,
                    populationImpact: 0.15,
                    infrastructureGap: 0.20,
                    underservedFactor: 0.10,
                  })
                }
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Slider 1: Citizen Demand Volume */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">1. Citizen Voice & Request Volume</span>
                  <span className="text-indigo-600 font-black">
                    {Math.round(weights.requestVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.60"
                  step="0.05"
                  value={weights.requestVolume}
                  onChange={(e) =>
                    setWeights({ ...weights, requestVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Weight assigned to volume and density of citizen voice & text submissions.
                </p>
              </div>

              {/* Slider 2: Severity */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">2. Issue Severity & Urgency</span>
                  <span className="text-rose-600 font-black">
                    {Math.round(weights.severity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={weights.severity}
                  onChange={(e) =>
                    setWeights({ ...weights, severity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Weight assigned to urgent / critical community impact levels.
                </p>
              </div>

              {/* Slider 3: Infrastructure Gap */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">3. Infrastructure Deficit</span>
                  <span className="text-amber-600 font-black">
                    {Math.round(weights.infrastructureGap * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={weights.infrastructureGap}
                  onChange={(e) =>
                    setWeights({ ...weights, infrastructureGap: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Weight assigned to official deficit data (hospital beds, roads, water index).
                </p>
              </div>

              {/* Slider 4: Underserved & Vulnerability Factor */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">4. Underserved & Rural Catchment</span>
                  <span className="text-emerald-600 font-black">
                    {Math.round(weights.underservedFactor * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.40"
                  step="0.05"
                  value={weights.underservedFactor}
                  onChange={(e) =>
                    setWeights({ ...weights, underservedFactor: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Weight assigned to BPL population percentage and rural remoteness.
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
              <span className="text-indigo-900 font-semibold">
                Rankings dynamically re-calculated in real time across {scoredHotspots.length} district hubs.
              </span>
              <button
                onClick={() => setActiveTab("hotspots")}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
              >
                View Updated Priorities →
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Live Citizen Feed */}
        {activeTab === "feed" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Live Citizen Voice & Text Submissions
                </h3>
                <p className="text-xs text-slate-500">
                  Original multilingual input stream from citizens across India
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {citizenRequests.length} submissions
              </span>
            </div>

            <div className="space-y-2.5">
              {citizenRequests.map((req) => (
                <div
                  key={req.requestId}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                        {req.category.toUpperCase().replace("_", " ")}
                      </span>
                      <span className="font-bold text-slate-800">
                        {req.location.city || req.location.district}, {req.location.district}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {req.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-100">
                    "{req.originalText}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-3">
                      <span>Source: <strong className="text-slate-800 uppercase">{req.source}</strong></span>
                      <span>Language: <strong className="text-slate-800 uppercase">{req.language}</strong></span>
                    </div>
                    <button
                      onClick={() => speakText(req.originalText, req.language as any)}
                      className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Replay Audio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav currentTab="intelligence" onSelectTab={onSelectNavTab} />
    </div>
  );
};
