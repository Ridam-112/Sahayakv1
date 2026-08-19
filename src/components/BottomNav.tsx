import React from "react";
import { Home, Mic, BarChart3, Landmark, Newspaper, Shield } from "lucide-react";
import { NavTab } from "../types";

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const tabs = [
    {
      id: "home" as NavTab,
      label: "Home",
      icon: Home,
    },
    {
      id: "voice_report" as NavTab,
      label: "Report Need",
      icon: Mic,
      isSpecial: true,
    },
    {
      id: "intelligence" as NavTab,
      label: "Intelligence",
      icon: BarChart3,
    },
    {
      id: "schemes" as NavTab,
      label: "Schemes",
      icon: Landmark,
    },
    {
      id: "civic_feed" as NavTab,
      label: "Feed",
      icon: Newspaper,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg max-w-lg mx-auto"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        if (tab.isSpecial) {
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center -mt-5 group cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${
                  isActive
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white"
                }`}
              >
                <Mic className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-1 font-bold text-indigo-700 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              isActive
                ? "text-indigo-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
