export type LanguageCode = "en" | "bn" | "hi" | "te" | "ta" | "mr" | "gu" | "kn" | "or" | "pa";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  symbol: string;
  isDefault?: boolean;
}

export type StateCode =
  | "WB"
  | "UP"
  | "BR"
  | "MH"
  | "KA"
  | "TN"
  | "OTHER";

export interface StateOption {
  code: StateCode;
  name: string;
  nativeName?: string;
  iconType: "map" | "pin";
  subtitle?: string;
}

export type ScreenView =
  | "language_select"
  | "state_select"
  | "mode_choice"
  | "profile_form"
  | "voice_wizard"
  | "schemes_list"
  | "scheme_detail"
  | "scheme_apply"
  | "help_grievance"
  | "my_vault";

export type ScreenState = ScreenView;

export type NavTab = "home" | "schemes" | "my_vault" | "help";

export interface CitizenProfile {
  name: string;
  age: string;
  income: string;
  state: string;
  occupation: string;
  socialCategory: string;
  gender: string;
  hasDisability: boolean;
  ownsLand: boolean;
  landSizeAcres?: string;
  hasPuccaHouse: boolean;
  hasRationCard: boolean;
  rationCardNumber?: string;
  aadhaarNumber?: string;
  bankAccountLinked: boolean;
  bankAccountNumber?: string;
  landParcelId?: string;
}

export type EligibilityStatus = "eligible" | "needs_info" | "not_eligible";

export interface Scheme {
  id: string;
  code: string;
  name: string;
  fullName: string;
  benefitShort: string;
  description: string;
  status: EligibilityStatus;
  statusText?: string;
  officialUrl: string;
  infoRequiredPrompt?: string;
  whyEligibleReason?: string;
  whyNotEligibleReason?: string;
  documents: {
    name: string;
    description: string;
    icon: "id" | "land" | "bank" | "ration" | "income" | "certificate";
  }[];
  howToApplySteps: {
    stepNumber: number;
    title: string;
    description: string;
  }[];
  fullCriteria: string[];
  requiredDetailsChecklist: {
    id: string;
    label: string;
    sublabel: string;
    status: "have_it" | "missing";
    fieldKey?: keyof CitizenProfile;
  }[];
}

export interface VaultDocument {
  id: string;
  type: string;
  title: string;
  issuer: string;
  documentNumber: string;
  verified: boolean;
  updatedAt: string;
  category: "identity" | "land" | "banking" | "welfare";
}
