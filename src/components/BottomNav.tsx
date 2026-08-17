import React from "react";
import { Home, Landmark, LayoutGrid, LifeBuoy } from "lucide-react";
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
      id: "schemes" as NavTab,
      label: "Schemes",
      icon: Landmark,
    },
    {
      id: "my_vault" as NavTab,
      label: "My Vault",
      icon: LayoutGrid,
    },
    {
      id: "help" as NavTab,
      label: "Help",
      icon: LifeBuoy,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg max-w-lg mx-auto"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
              isActive
                ? "bg-indigo-50 text-indigo-600 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
