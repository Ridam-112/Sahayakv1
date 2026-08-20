import React, { useState, useEffect } from "react";
import {
  ScreenState,
  LanguageCode,
  NavTab,
  CitizenProfile,
  Scheme,
  ActiveVaultApplication,
  VaultDocument,
  CitizenDevelopmentRequest,
} from "./types";
import {
  INITIAL_CITIZEN_PROFILE,
  INITIAL_SCHEMES,
  evaluateSchemesForProfile,
} from "./data/mockData";
import {
  INITIAL_CITIZEN_REQUESTS,
} from "./data/developmentData";
import {
  loadStoredProfile,
  saveStoredProfile,
  loadStoredWishlist,
  saveStoredWishlist,
  loadStoredApplications,
  saveStoredApplications,
  loadStoredDocuments,
  saveStoredDocuments,
  loadStoredRequests,
  saveStoredRequests,
  loadStoredLanguage,
  saveStoredLanguage,
  clearAllStoredData,
  STORAGE_KEYS,
} from "./utils/storage";
import { LanguageSelect } from "./components/LanguageSelect";
import { StateSelect } from "./components/StateSelect";
import { HomeScreen } from "./components/HomeScreen";
import { DevelopmentVoiceAgent } from "./components/DevelopmentVoiceAgent";
import { PolicymakerDashboard } from "./components/PolicymakerDashboard";
import { WriteRequestModal } from "./components/WriteRequestModal";
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
import { TtsDebugIndicator } from "./components/TtsDebugIndicator";

export default function App() {
  // Initialize persistent profile directly from localStorage
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>(() => {
    return loadStoredProfile();
  });

  // Screen and navigation state (restore home if language or profile already set)
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => {
    try {
      const storedScreen = localStorage.getItem(STORAGE_KEYS.SCREEN);
      if (
        storedScreen &&
        storedScreen !== "language_select" &&
        storedScreen !== "state_select"
      ) {
        return storedScreen as ScreenState;
      }
      const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const storedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (storedProfile || storedLang) {
        return "home";
      }
    } catch (e) {
      console.warn("[STORAGE] Failed to determine initial screen:", e);
    }
    return "language_select";
  });

  const [screenHistory, setScreenHistory] = useState<ScreenState[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    return loadStoredLanguage();
  });

  // Schemes evaluated against loaded profile
  const [schemes, setSchemes] = useState<Scheme[]>(() => {
    return evaluateSchemesForProfile(loadStoredProfile(), INITIAL_SCHEMES);
  });

  const [selectedScheme, setSelectedScheme] = useState<Scheme>(INITIAL_SCHEMES[0]);

  // Track 1 Citizen Requests State
  const [citizenRequests, setCitizenRequests] = useState<CitizenDevelopmentRequest[]>(() => {
    return loadStoredRequests();
  });

  // Modals state
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);

  // Wishlist and Active Applications in Vault
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    return loadStoredWishlist();
  });

  const [activeApplications, setActiveApplications] = useState<ActiveVaultApplication[]>(() => {
    return loadStoredApplications();
  });

  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>(() => {
    return loadStoredDocuments();
  });

  // Save new citizen development request
  const handleSaveDevelopmentRequest = (newReq: CitizenDevelopmentRequest) => {
    setCitizenRequests((prev) => {
      const next = [newReq, ...prev];
      saveStoredRequests(next);
      return next;
    });
  };

  // Save profile changes & re-evaluate schemes with persistence
  const handleUpdateProfile = (updated: Partial<CitizenProfile>) => {
    setCitizenProfile((prev) => {
      const next = { ...prev, ...updated };
      saveStoredProfile(next);
      setSchemes(evaluateSchemesForProfile(next, INITIAL_SCHEMES));
      return next;
    });
  };

  // Reset profile / start fresh
  const handleResetProfile = () => {
    const cleanProfile: CitizenProfile = {
      ...INITIAL_CITIZEN_PROFILE,
      state: citizenProfile.state || "West Bengal",
    };
    setCitizenProfile(cleanProfile);
    saveStoredProfile(cleanProfile);
    setSchemes(evaluateSchemesForProfile(cleanProfile, INITIAL_SCHEMES));
  };

  // Full reset of all user data in localStorage
  const handleResetAllData = () => {
    clearAllStoredData();
    const cleanProfile = { ...INITIAL_CITIZEN_PROFILE };
    setCitizenProfile(cleanProfile);
    setSchemes(evaluateSchemesForProfile(cleanProfile, INITIAL_SCHEMES));
    setWishlistIds(["pm-kisan"]);
    setActiveApplications(loadStoredApplications());
    setVaultDocuments(loadStoredDocuments());
    setCitizenRequests(INITIAL_CITIZEN_REQUESTS);
    navigateTo("home");
  };

  // Toggle wishlist
  const handleToggleWishlist = (schemeId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(schemeId);
      const next = exists ? prev.filter((id) => id !== schemeId) : [...prev, schemeId];
      saveStoredWishlist(next);
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
      saveStoredApplications(nextList);
      return nextList;
    });

    navigateTo("scheme_apply");
  };

  const handleSelectLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    saveStoredLanguage(lang);
  };

  const navigateTo = (nextScreen: ScreenState) => {
    setScreenHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(nextScreen);
    try {
      localStorage.setItem(STORAGE_KEYS.SCREEN, nextScreen);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory((prevHist) => prevHist.slice(0, -1));
      setCurrentScreen(prev);
      try {
        localStorage.setItem(STORAGE_KEYS.SCREEN, prev);
      } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCurrentScreen("home");
      try {
        localStorage.setItem(STORAGE_KEYS.SCREEN, "home");
      } catch {}
    }
  };

  const handleOpenSchemes = () => {
    const isFilled = Boolean(
      citizenProfile.name ||
      citizenProfile.age ||
      citizenProfile.income ||
      (citizenProfile.occupation && citizenProfile.occupation.trim().length > 0)
    );
    if (isFilled) {
      navigateTo("schemes_list");
    } else {
      navigateTo("find_schemes_voice");
    }
  };

  const handleNavTabSelect = (tab: NavTab) => {
    switch (tab) {
      case "home":
        navigateTo("home");
        break;
      case "voice_report":
        navigateTo("development_voice");
        break;
      case "intelligence":
        navigateTo("policymaker_dashboard");
        break;
      case "schemes":
        handleOpenSchemes();
        break;
      case "civic_feed":
        navigateTo("civic_feed");
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
              navigateTo("home");
            }}
          />
        )}

        {/* Screen 3: Primary Track 1 Home Experience */}
        {currentScreen === "home" && (
          <HomeScreen
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onStartVoiceReport={() => navigateTo("development_voice")}
            onStartTextReport={() => setShowWriteModal(true)}
            onOpenDashboard={() => navigateTo("policymaker_dashboard")}
            onOpenSchemes={handleOpenSchemes}
            onOpenFeed={() => navigateTo("civic_feed")}
            onOpenHelp={() => navigateTo("help_grievance")}
            onSelectNavTab={handleNavTabSelect}
            totalRequestsCount={12480 + citizenRequests.length - 6}
          />
        )}

        {/* Screen 4: Dynamic Development Need Voice Agent */}
        {currentScreen === "development_voice" && (
          <DevelopmentVoiceAgent
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSaveRequest={handleSaveDevelopmentRequest}
            onViewDashboard={() => navigateTo("policymaker_dashboard")}
            onSelectNavTab={handleNavTabSelect}
            onBack={() => navigateTo("home")}
          />
        )}

        {/* Screen 5: Flagship Policymaker Dashboard (Development Intelligence) */}
        {currentScreen === "policymaker_dashboard" && (
          <PolicymakerDashboard
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={() => navigateTo("home")}
            citizenRequests={citizenRequests}
          />
        )}

        {/* Screen 6: Civic Feed & Announcements */}
        {currentScreen === "civic_feed" && (
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

        {/* Screen 7: Voice Agent - Conversational Scheme Finder */}
        {currentScreen === "find_schemes_voice" && (
          <SchemeVoiceAgent
            profile={citizenProfile}
            onUpdateProfile={handleUpdateProfile}
            onComplete={() => navigateTo("schemes_list")}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={() => navigateTo("home")}
          />
        )}

        {/* Screen 8: Profile Form (Type Mode) */}
        {currentScreen === "profile_form" && (
          <ProfileForm
            profile={citizenProfile}
            onChangeProfile={handleUpdateProfile}
            onSubmit={() => navigateTo("schemes_list")}
            onSwitchToVoice={() => navigateTo("find_schemes_voice")}
            onResetProfile={handleResetAllData}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={handleBack}
          />
        )}

        {/* Screen 9: Legacy Voice Wizard */}
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

        {/* Screen 10: Schemes Results (Personalized AI Matches) */}
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
            onResetData={handleResetAllData}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={handleBack}
          />
        )}

        {/* Screen 11: Scheme Detail */}
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

        {/* Screen 12: Scheme Apply (Guided Application Assistant) */}
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

        {/* Screen 13: Help & Grievance Redressal */}
        {currentScreen === "help_grievance" && (
          <HelpGrievance
            profile={citizenProfile}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
            onBack={handleBack}
          />
        )}

        {/* Screen 14: Vault Tab: Active Applications & Document Locker */}
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
            onExploreSchemes={handleOpenSchemes}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onSelectNavTab={handleNavTabSelect}
          />
        )}
      </div>

      {/* Write / Text Development Request Modal */}
      {showWriteModal && (
        <WriteRequestModal
          isOpen={showWriteModal}
          onClose={() => setShowWriteModal(false)}
          onSubmit={(req) => {
            handleSaveDevelopmentRequest(req);
            navigateTo("policymaker_dashboard");
          }}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Application Summary Export / Share Modal */}
      {showSummaryModal && (
        <ApplicationSummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          scheme={selectedScheme}
          profile={citizenProfile}
          currentLanguage={currentLanguage}
        />
      )}

      {/* AI Assistant Chat Modal */}
      {showAssistantModal && (
        <AssistantChatModal
          isOpen={showAssistantModal}
          onClose={() => setShowAssistantModal(false)}
          profile={citizenProfile}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Global Bottom-Right TTS Indicator */}
      <TtsDebugIndicator currentLanguage={currentLanguage} />
    </div>
  );
}
