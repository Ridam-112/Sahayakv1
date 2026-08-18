import React, { useState, useEffect } from "react";
import {
  ScreenState,
  LanguageCode,
  NavTab,
  CitizenProfile,
  Scheme,
  ActiveVaultApplication,
} from "./types";
import {
  INITIAL_CITIZEN_PROFILE,
  INITIAL_SCHEMES,
  evaluateSchemesForProfile,
} from "./data/mockData";
import { LanguageSelect } from "./components/LanguageSelect";
import { StateSelect } from "./components/StateSelect";
import { CivicFeed } from "./components/CivicFeed";
import { ModeChoice } from "./components/ModeChoice";
import { ProfileForm } from "./components/ProfileForm";
import { VoiceWizard } from "./components/VoiceWizard";
import { SchemesList } from "./components/SchemesList";
import { SchemeVoiceAgent } from "./components/SchemeVoiceAgent";
import { SchemesResults } from "./components/SchemesResults";
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
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("bn"); // Default to Bengali as requested
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>(INITIAL_CITIZEN_PROFILE);
  const [schemes, setSchemes] = useState<Scheme[]>(INITIAL_SCHEMES);
  const [selectedScheme, setSelectedScheme] = useState<Scheme>(INITIAL_SCHEMES[0]);

  // Wishlist and Active Applications in Vault
  const [wishlistIds, setWishlistIds] = useState<string[]>(["pm-kisan"]);
  const [activeApplications, setActiveApplications] = useState<ActiveVaultApplication[]>([
    {
      schemeId: "pm-kisan",
      schemeName: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      schemeCode: "PM-KISAN",
      status: "in_progress",
      progressPercentage: 60,
      nextStep: "Submit Land Record / Patta for 17th Installment",
      startedAt: "Yesterday",
      deadline: "July 31, 2026",
    },
  ]);

  // Modals state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);

  // Load saved state if available
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("sahayak_citizen_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        // Sanitize any corrupted legacy test data
        if (parsed.income === "Bikash Mondal" || (parsed.name === "rhythm" && parsed.age === "85")) {
          localStorage.removeItem("sahayak_citizen_profile");
          setCitizenProfile(INITIAL_CITIZEN_PROFILE);
          setSchemes(evaluateSchemesForProfile(INITIAL_CITIZEN_PROFILE, INITIAL_SCHEMES));
        } else {
          setCitizenProfile(parsed);
          setSchemes(evaluateSchemesForProfile(parsed, INITIAL_SCHEMES));
        }
      }
      const savedLang = localStorage.getItem("sahayak_lang");
      if (savedLang) {
        setCurrentLanguage(savedLang as LanguageCode);
      }
      const savedWishlist = localStorage.getItem("sahayak_wishlist");
      if (savedWishlist) {
        setWishlistIds(JSON.parse(savedWishlist));
      }
      const savedApps = localStorage.getItem("sahayak_active_apps");
      if (savedApps) {
        setActiveApplications(JSON.parse(savedApps));
      }
    } catch {}
  }, []);

  // Save profile changes & re-evaluate schemes
  const handleUpdateProfile = (updated: Partial<CitizenProfile>) => {
    setCitizenProfile((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem("sahayak_citizen_profile", JSON.stringify(next));
      } catch {}
      setSchemes(evaluateSchemesForProfile(next, INITIAL_SCHEMES));
      return next;
    });
  };

  // Reset profile to clean state for a new interview
  const handleResetProfile = () => {
    const cleanProfile: CitizenProfile = {
      ...INITIAL_CITIZEN_PROFILE,
      state: citizenProfile.state || "West Bengal",
    };
    setCitizenProfile(cleanProfile);
    try {
      localStorage.setItem("sahayak_citizen_profile", JSON.stringify(cleanProfile));
    } catch {}
    setSchemes(evaluateSchemesForProfile(cleanProfile, INITIAL_SCHEMES));
  };

  // Toggle wishlist
  const handleToggleWishlist = (schemeId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(schemeId);
      const next = exists ? prev.filter((id) => id !== schemeId) : [...prev, schemeId];
      try {
        localStorage.setItem("sahayak_wishlist", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Start Scheme Application -> Adds to Vault and Opens Application Assistant
  const handleStartScheme = (scheme: Scheme) => {
    setSelectedScheme(scheme);

    setActiveApplications((prev) => {
      const exists = prev.find((a) => a.schemeId === scheme.id);
      if (exists) return prev;

      const newApp: ActiveVaultApplication = {
        schemeId: scheme.id,
        schemeName: scheme.name,
        schemeCode: scheme.code,
        status: "in_progress",
        progressPercentage: 25,
        nextStep: "Complete e-KYC and document checklist",
        startedAt: "Just now",
        deadline: "Next 30 Days",
      };

      const nextList = [newApp, ...prev];
      try {
        localStorage.setItem("sahayak_active_apps", JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    navigateTo("scheme_apply");
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
        navigateTo("find_schemes_voice");
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
            onSelectVoiceMode={() => navigateTo("find_schemes_voice")}
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

        {/* Screen 4: Voice Agent - Conversational Scheme Finder */}
        {currentScreen === "find_schemes_voice" && (
          <SchemeVoiceAgent
            profile={citizenProfile}
            onUpdateProfile={handleUpdateProfile}
            onComplete={() => navigateTo("schemes_list")}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={handleBack}
          />
        )}

        {/* Screen 5: Profile Form (Type Mode) */}
        {currentScreen === "profile_form" && (
          <ProfileForm
            profile={citizenProfile}
            onChangeProfile={handleUpdateProfile}
            onSubmit={() => navigateTo("schemes_list")}
            onSwitchToVoice={() => navigateTo("find_schemes_voice")}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={handleBack}
          />
        )}

        {/* Screen 6: Legacy Voice Wizard */}
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

        {/* Screen 7: Schemes Results (Personalized AI Matches) */}
        {currentScreen === "schemes_list" && (
          <SchemesResults
            schemes={schemes}
            profile={citizenProfile}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onStartScheme={handleStartScheme}
            onSelectScheme={(sch) => {
              setSelectedScheme(sch);
              navigateTo("scheme_detail");
            }}
            onEditProfile={() => navigateTo("profile_form")}
            onRestartVoiceAgent={() => {
              handleResetProfile();
              navigateTo("find_schemes_voice");
            }}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={handleBack}
          />
        )}

        {/* Screen 8: Scheme Detail */}
        {currentScreen === "scheme_detail" && (
          <SchemeDetail
            scheme={selectedScheme}
            onApply={(sch) => {
              handleStartScheme(sch);
            }}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={handleBack}
          />
        )}

        {/* Screen 9: Scheme Apply (Guided Application Assistant) */}
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

        {/* Screen 10: Help & Grievance Redressal */}
        {currentScreen === "help_grievance" && (
          <HelpGrievance
            profile={citizenProfile}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={handleBack}
          />
        )}

        {/* Screen 11: Vault Tab: Active Applications & Document Locker */}
        {currentScreen === "my_vault" && (
          <MyVault
            profile={citizenProfile}
            activeApplications={activeApplications}
            onContinueApplication={(schemeId) => {
              const matched = schemes.find((s) => s.id === schemeId);
              if (matched) {
                setSelectedScheme(matched);
                navigateTo("scheme_apply");
              }
            }}
            onExploreSchemes={() => navigateTo("find_schemes_voice")}
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

