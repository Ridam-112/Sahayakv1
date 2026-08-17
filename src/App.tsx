import React, { useState, useEffect } from "react";
import {
  ScreenState,
  LanguageCode,
  NavTab,
  CitizenProfile,
  Scheme,
} from "./types";
import {
  INITIAL_CITIZEN_PROFILE,
  INITIAL_SCHEMES,
} from "./data/mockData";
import { LanguageSelect } from "./components/LanguageSelect";
import { StateSelect } from "./components/StateSelect";
import { CivicFeed } from "./components/CivicFeed";
import { ModeChoice } from "./components/ModeChoice";
import { ProfileForm } from "./components/ProfileForm";
import { VoiceWizard } from "./components/VoiceWizard";
import { SchemesList } from "./components/SchemesList";
import { SchemeDetail } from "./components/SchemeDetail";
import { SchemeApply } from "./components/SchemeApply";
import { HelpGrievance } from "./components/HelpGrievance";
import { MyVault } from "./components/MyVault";
import { ApplicationSummaryModal } from "./components/ApplicationSummaryModal";
import { AssistantChatModal } from "./components/AssistantChatModal";

export default function App() {
  // Screen and navigation state
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("language_select");
  const [screenHistory, setScreenHistory] = useState<ScreenState[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("bn"); // Default to Bengali as seen in screens
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>(INITIAL_CITIZEN_PROFILE);
  const [schemes, setSchemes] = useState<Scheme[]>(INITIAL_SCHEMES);
  const [selectedScheme, setSelectedScheme] = useState<Scheme>(INITIAL_SCHEMES[0]);

  // Modals state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);

  // Load saved state if available
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("sahayak_citizen_profile");
      if (savedProfile) {
        setCitizenProfile(JSON.parse(savedProfile));
      }
      const savedLang = localStorage.getItem("sahayak_lang");
      if (savedLang) {
        setCurrentLanguage(savedLang as LanguageCode);
      }
    } catch {}
  }, []);

  // Save profile changes
  const handleUpdateProfile = (updated: Partial<CitizenProfile>) => {
    setCitizenProfile((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem("sahayak_citizen_profile", JSON.stringify(next));
      } catch {}
      return next;
    });

    // Dynamically update schemes status if key criteria change
    if (updated.rationCardNumber) {
      setSchemes((prevSchemes) =>
        prevSchemes.map((s) =>
          s.id === "ayushman-bharat"
            ? { ...s, status: "eligible", statusText: "ELIGIBLE" }
            : s
        )
      );
    }
  };

  const handleSelectLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    try {
      localStorage.setItem("sahayak_lang", lang);
    } catch {}
  };

  const navigateTo = (nextScreen: ScreenState) => {
    setScreenHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory((prevHist) => prevHist.slice(0, -1));
      setCurrentScreen(prev);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCurrentScreen("language_select");
    }
  };

  const handleNavTabSelect = (tab: NavTab) => {
    switch (tab) {
      case "home":
        navigateTo("civic_feed");
        break;
      case "schemes":
        navigateTo("schemes_list");
        break;
      case "my_vault":
        navigateTo("my_vault");
        break;
      case "help":
        navigateTo("help_grievance");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex-1 flex flex-col">
        {/* Screen 1: Language Select */}
        {currentScreen === "language_select" && (
          <LanguageSelect
            selectedLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onContinue={() => navigateTo("state_select")}
          />
        )}

        {/* Screen 2: State Select */}
        {currentScreen === "state_select" && (
          <StateSelect
            selectedState={citizenProfile.state}
            onSelectState={(stateName) => {
              handleUpdateProfile({ state: stateName });
              navigateTo("civic_feed");
            }}
          />
        )}

        {/* Screen 3: Civic Feed & Home Discovery */}
        {(currentScreen === "civic_feed" || currentScreen === "mode_choice") && (
          <CivicFeed
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            profile={citizenProfile}
            schemes={schemes}
            onSelectTypeMode={() => navigateTo("profile_form")}
            onSelectVoiceMode={() => navigateTo("voice_wizard")}
            onNeedHelp={() => navigateTo("help_grievance")}
            onSelectScheme={(sch) => {
              setSelectedScheme(sch);
              navigateTo("scheme_detail");
            }}
            onSelectNavTab={handleNavTabSelect}
            onOpenAssistant={(query) => {
              setShowAssistantModal(true);
            }}
          />
        )}

        {/* Screen 4: Profile Form (Type Mode) */}
        {currentScreen === "profile_form" && (
          <ProfileForm
            profile={citizenProfile}
            onChangeProfile={handleUpdateProfile}
            onSubmit={() => navigateTo("schemes_list")}
            onSwitchToVoice={() => navigateTo("voice_wizard")}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={handleBack}
          />
        )}

        {/* Screen 5: Voice Wizard (Voice Mode) */}
        {currentScreen === "voice_wizard" && (
          <VoiceWizard
            profile={citizenProfile}
            onChangeProfile={handleUpdateProfile}
            onComplete={() => navigateTo("schemes_list")}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={handleBack}
            onSelectNavTab={handleNavTabSelect}
          />
        )}

        {/* Screen 6: Schemes List */}
        {currentScreen === "schemes_list" && (
          <SchemesList
            schemes={schemes}
            onSelectScheme={(sch) => {
              setSelectedScheme(sch);
              navigateTo("scheme_detail");
            }}
            onUpdateSchemeInfo={(sch) => {
              setSelectedScheme(sch);
              navigateTo("scheme_apply");
            }}
            onAskQuestion={() => setShowAssistantModal(true)}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={handleBack}
          />
        )}

        {/* Screen 7: Scheme Detail (PM-KISAN) */}
        {currentScreen === "scheme_detail" && (
          <SchemeDetail
            scheme={selectedScheme}
            onApply={(sch) => {
              setSelectedScheme(sch);
              navigateTo("scheme_apply");
            }}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={handleBack}
          />
        )}

        {/* Screen 8: Scheme Apply */}
        {currentScreen === "scheme_apply" && (
          <SchemeApply
            scheme={selectedScheme}
            profile={citizenProfile}
            onUpdateProfile={handleUpdateProfile}
            onGetSummary={() => setShowSummaryModal(true)}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={handleBack}
          />
        )}

        {/* Screen 9: Help & Grievance Redressal */}
        {currentScreen === "help_grievance" && (
          <HelpGrievance
            profile={citizenProfile}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={handleBack}
          />
        )}

        {/* Vault Tab: My Documents */}
        {currentScreen === "my_vault" && (
          <MyVault
            profile={citizenProfile}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
          />
        )}
      </div>

      {/* Application Summary Modal */}
      {showSummaryModal && (
        <ApplicationSummaryModal
          scheme={selectedScheme}
          profile={citizenProfile}
          onClose={() => setShowSummaryModal(false)}
        />
      )}

      {/* Assistant Chat Modal */}
      {showAssistantModal && (
        <AssistantChatModal
          profile={citizenProfile}
          currentLanguage={currentLanguage}
          onClose={() => setShowAssistantModal(false)}
        />
      )}
    </div>
  );
}
