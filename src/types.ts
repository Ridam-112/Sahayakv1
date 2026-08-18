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
  | "civic_feed"
  | "mode_choice"
  | "profile_form"
  | "voice_wizard"
  | "find_schemes_voice"
  | "schemes_list"
  | "scheme_detail"
  | "scheme_apply"
  | "help_grievance"
  | "my_vault";

export type ScreenState = ScreenView;

export type NavTab = "home" | "schemes" | "my_vault" | "help";

export interface ConversationMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  textBn?: string;
  textHi?: string;
  timestamp: string;
  fieldKey?: keyof CitizenProfile | string;
  suggestedAnswers?: string[];
  collectedValuePreview?: string;
}

export interface ActiveVaultApplication {
  schemeId: string;
  schemeName: string;
  schemeCode: string;
  status: "in_progress" | "submitted" | "action_required";
  progressPercentage: number;
  nextStep: string;
  deadline?: string;
  benefitShort?: string;
  startedAt: string;
  completedChecklistIds?: string[];
}

export type CivicFeedCategory =
  | "new_launch"
  | "deadline"
  | "government_update"
  | "impact";

export interface CivicFeedItemTranslation {
  title: string;
  summary: string;
  cta_label: string;
  target_audience?: string;
  action_required?: string;
}

export interface CivicFeedItem {
  id: string;
  type: CivicFeedCategory;
  title: string;
  summary: string;
  published_at: string;
  effective_date?: string;
  scheme_id?: string;
  source_name: string;
  source_url: string;
  cta_type: "check_eligibility" | "understand_update" | "learn_more";
  cta_label: string;
  language: string;
  target_audience?: string;
  action_required?: string;
  category_tag?: string;
  translations?: Record<string, CivicFeedItemTranslation>;
}

export interface EducationProfile {
  level?: "school" | "college" | null;
  class?: number | string | null;
  board?: string | null;
  schoolType?: string | null;
  course?: string | null;
  year?: number | string | null;
  semester?: number | string | null;
  institution?: string | null;
}

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
  education?: EducationProfile;
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
