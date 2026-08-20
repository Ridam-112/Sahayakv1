import {
  CitizenProfile,
  ActiveVaultApplication,
  VaultDocument,
  CitizenDevelopmentRequest,
  LanguageCode,
  ScreenState,
} from "../types";
import { INITIAL_CITIZEN_PROFILE, INITIAL_VAULT_DOCS } from "../data/mockData";
import { INITIAL_CITIZEN_REQUESTS } from "../data/developmentData";

export const STORAGE_KEYS = {
  PROFILE: "sahayak_citizen_profile",
  WISHLIST: "sahayak_wishlist",
  ACTIVE_APPS: "sahayak_active_apps",
  VAULT_DOCS: "sahayak_vault_docs",
  CITIZEN_REQUESTS: "sahayak_citizen_requests",
  LANGUAGE: "sahayak_lang",
  SCREEN: "sahayak_current_screen",
} as const;

/**
 * Load citizen profile from localStorage safely
 */
export function loadStoredProfile(): CitizenProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          ...INITIAL_CITIZEN_PROFILE,
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn("[STORAGE] Failed to read citizen profile from localStorage:", err);
  }
  return { ...INITIAL_CITIZEN_PROFILE };
}

/**
 * Save citizen profile to localStorage safely
 */
export function saveStoredProfile(profile: CitizenProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    console.log("[STORAGE] Citizen profile saved to localStorage:", {
      name: profile.name,
      age: profile.age,
      income: profile.income,
      occupation: profile.occupation,
      state: profile.state,
      gender: profile.gender,
      socialCategory: profile.socialCategory,
      hasDisability: profile.hasDisability,
      ownsLand: profile.ownsLand,
    });
  } catch (err) {
    console.warn("[STORAGE] Failed to write citizen profile to localStorage:", err);
  }
}

/**
 * Load wishlist scheme IDs from localStorage
 */
export function loadStoredWishlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("[STORAGE] Failed to read wishlist from localStorage:", err);
  }
  return ["pm-kisan"];
}

/**
 * Save wishlist scheme IDs to localStorage
 */
export function saveStoredWishlist(wishlist: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  } catch (err) {
    console.warn("[STORAGE] Failed to save wishlist to localStorage:", err);
  }
}

/**
 * Load active vault applications from localStorage
 */
export function loadStoredApplications(): ActiveVaultApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_APPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("[STORAGE] Failed to read active applications from localStorage:", err);
  }
  return [
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
  ];
}

/**
 * Save active vault applications to localStorage
 */
export function saveStoredApplications(apps: ActiveVaultApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_APPS, JSON.stringify(apps));
  } catch (err) {
    console.warn("[STORAGE] Failed to save active applications to localStorage:", err);
  }
}

/**
 * Load vault documents / checklist from localStorage
 */
export function loadStoredDocuments(): VaultDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VAULT_DOCS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("[STORAGE] Failed to read vault documents from localStorage:", err);
  }
  return INITIAL_VAULT_DOCS;
}

/**
 * Save vault documents / checklist to localStorage
 */
export function saveStoredDocuments(docs: VaultDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VAULT_DOCS, JSON.stringify(docs));
  } catch (err) {
    console.warn("[STORAGE] Failed to save vault documents to localStorage:", err);
  }
}

/**
 * Load citizen development requests from localStorage
 */
export function loadStoredRequests(): CitizenDevelopmentRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CITIZEN_REQUESTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("[STORAGE] Failed to read citizen requests from localStorage:", err);
  }
  return INITIAL_CITIZEN_REQUESTS;
}

/**
 * Save citizen development requests to localStorage
 */
export function saveStoredRequests(reqs: CitizenDevelopmentRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CITIZEN_REQUESTS, JSON.stringify(reqs));
  } catch (err) {
    console.warn("[STORAGE] Failed to save citizen requests to localStorage:", err);
  }
}

/**
 * Load language from localStorage
 */
export function loadStoredLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (raw === "en" || raw === "bn" || raw === "hi" || raw === "te" || raw === "ta") {
      return raw as LanguageCode;
    }
  } catch (err) {
    console.warn("[STORAGE] Failed to read language from localStorage:", err);
  }
  return "bn";
}

/**
 * Save language to localStorage
 */
export function saveStoredLanguage(lang: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch (err) {
    console.warn("[STORAGE] Failed to save language to localStorage:", err);
  }
}

/**
 * Reset all citizen data stored in localStorage
 */
export function clearAllStoredData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_APPS);
    localStorage.removeItem(STORAGE_KEYS.VAULT_DOCS);
    localStorage.removeItem(STORAGE_KEYS.CITIZEN_REQUESTS);
    console.log("[STORAGE] All citizen profile and application data cleared successfully.");
  } catch (err) {
    console.warn("[STORAGE] Failed to clear stored data:", err);
  }
}
