import React, { useState } from "react";
import { BookOpen, MapPin, Shield, Check } from "lucide-react";
import { StateCode } from "../types";
import { STATES, ALL_INDIAN_STATES } from "../data/mockData";
import { Footer } from "./Footer";

interface StateSelectProps {
  selectedState: string;
  onSelectState: (stateName: string, stateCode?: StateCode) => void;
}

export const StateSelect: React.FC<StateSelectProps> = ({
  selectedState,
  onSelectState,
}) => {
  const [showAllStatesModal, setShowAllStatesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleStateClick = (state: (typeof STATES)[0]) => {
    if (state.code === "OTHER") {
      setShowAllStatesModal(true);
    } else {
      onSelectState(state.name, state.code);
    }
  };

  const filteredAllStates = ALL_INDIAN_STATES.filter((st) =>
    st.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      {/* Top Header Bar */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Sahayak
          </span>
        </div>
      </div>

      <main className="max-w-md mx-auto w-full px-5 py-6 space-y-6 flex-1">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official DPI Gateway</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Select Your State
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Please select your state to access localized civic services, schemes,
            and relevant administrative information tailored to your region.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-2">
          {STATES.map((st) => {
            const isSelected = selectedState === st.name;
            const isOther = st.code === "OTHER";
            return (
              <button
                key={st.code}
                id={`state-card-${st.code.toLowerCase()}`}
                onClick={() => handleStateClick(st)}
                className={`p-4 rounded-xl text-center flex flex-col items-center justify-center min-h-[135px] border transition-all shadow-xs cursor-pointer ${
                  isSelected
                    ? "bg-white border-indigo-600 ring-4 ring-indigo-50"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Icon box */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-700"
                }`}>
                  {isOther ? (
                    <MapPin className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>

                <div className="text-sm font-bold text-slate-900 leading-tight">
                  {st.name}
                </div>

                {st.subtitle && (
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    {st.subtitle}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Modal for all 28 states & UTs */}
      {showAllStatesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Select Your State / UT
              </h3>
              <button
                onClick={() => setShowAllStatesModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search state..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="overflow-y-auto p-2 divide-y divide-slate-100">
              {filteredAllStates.map((stateName) => (
                <button
                  key={stateName}
                  onClick={() => {
                    onSelectState(stateName);
                    setShowAllStatesModal(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    selectedState === stateName
                      ? "font-bold text-indigo-600 bg-indigo-50/70"
                      : "text-slate-700"
                  }`}
                >
                  <span>{stateName}</span>
                  {selectedState === stateName && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
