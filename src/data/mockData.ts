import {
  LanguageOption,
  StateOption,
  Scheme,
  CitizenProfile,
  VaultDocument,
} from "../types";

export const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "Default Language",
    symbol: "A",
    isDefault: true,
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    symbol: "অ",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिंदी",
    symbol: "अ",
  },
];

export const ALL_LANGUAGES: LanguageOption[] = [
  ...LANGUAGES,
  { code: "te", name: "Telugu", nativeName: "తెలుగు", symbol: "అ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", symbol: "அ" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", symbol: "अ" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", symbol: "અ" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", symbol: "ಅ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", symbol: "ଅ" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", symbol: "ਅ" },
];

export const STATES: StateOption[] = [
  { code: "WB", name: "West Bengal", nativeName: "পশ্চিমবঙ্গ", iconType: "map" },
  { code: "UP", name: "Uttar Pradesh", nativeName: "उत्तर प्रदेश", iconType: "map" },
  { code: "BR", name: "Bihar", nativeName: "बिहार", iconType: "map" },
  { code: "MH", name: "Maharashtra", nativeName: "महाराष्ट्र", iconType: "map" },
  { code: "KA", name: "Karnataka", nativeName: "ಕರ್ನಾಟಕ", iconType: "map" },
  { code: "TN", name: "Tamil Nadu", nativeName: "தமிழ்நாடு", iconType: "map" },
  {
    code: "OTHER",
    name: "Other States",
    subtitle: "View all 28 states",
    iconType: "pin",
  },
];

export const ALL_INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi (NCT)",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

export const INITIAL_CITIZEN_PROFILE: CitizenProfile = {
  name: "Bikash Mondal",
  age: "45",
  income: "45,000",
  state: "West Bengal",
  occupation: "Farmer",
  socialCategory: "OBC",
  gender: "Male",
  hasDisability: false,
  ownsLand: true,
  landSizeAcres: "1.2",
  hasPuccaHouse: false,
  hasRationCard: false,
  rationCardNumber: "",
  aadhaarNumber: "",
  bankAccountLinked: true,
  bankAccountNumber: "SBIN00481923891",
  landParcelId: "",
};

export const VOICE_STEPS = [
  {
    id: "age",
    questionBn: "আপনার বয়স কত?",
    questionEn: "Your Age?",
    questionHi: "आपकी उम्र क्या है?",
    fieldKey: "age" as keyof CitizenProfile,
    defaultValue: "45",
    type: "number",
  },
  {
    id: "income",
    questionBn: "আপনার বার্ষিক আয় কত?",
    questionEn: "Your Annual Income?",
    questionHi: "आपकी वार्षिक आय कितनी है?",
    fieldKey: "income" as keyof CitizenProfile,
    defaultValue: "45,000",
    type: "number",
  },
  {
    id: "occupation",
    questionBn: "আপনার পেশা কি?",
    questionEn: "Your Occupation?",
    questionHi: "आपका व्यवसाय क्या है?",
    fieldKey: "occupation" as keyof CitizenProfile,
    defaultValue: "Farmer",
    type: "text",
  },
  {
    id: "land",
    questionBn: "আপনার কি নিজস্ব চাষের জমি আছে?",
    questionEn: "Do you own cultivable land?",
    questionHi: "क्या आपके पास अपनी खेती योग्य भूमि है?",
    fieldKey: "ownsLand" as keyof CitizenProfile,
    defaultValue: "Yes",
    type: "boolean",
  },
  {
    id: "category",
    questionBn: "আপনার সামাজিক ক্যাটাগরি কি?",
    questionEn: "Your Social Category?",
    questionHi: "आपकी सामाजिक श्रेणी क्या है?",
    fieldKey: "socialCategory" as keyof CitizenProfile,
    defaultValue: "OBC",
    type: "text",
  },
  {
    id: "disability",
    questionBn: "আপনার কি কোনো শারীরিক প্রতিবন্ধকতা আছে?",
    questionEn: "Do you have any physical disability?",
    questionHi: "क्या आपको कोई शारीरिक दिव्यांगता है?",
    fieldKey: "hasDisability" as keyof CitizenProfile,
    defaultValue: "No",
    type: "boolean",
  },
];

export const INITIAL_SCHEMES: Scheme[] = [
  {
    id: "pm-kisan",
    code: "PM-KISAN",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    benefitShort: "₹6,000/year direct income support.",
    description: "₹6,000/year income support for landholding farmer families in three equal quarterly installments of ₹2,000 directly via DBT.",
    status: "eligible",
    statusText: "ELIGIBLE",
    officialUrl: "https://pmkisan.gov.in",
    whyEligibleReason:
      "Based on your Sahayak profile, you own cultivable land and hold a valid Aadhaar card linked to your bank account. As a small/marginal farmer, you meet the core criteria for the Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) benefit scheme.",
    documents: [
      {
        name: "Aadhaar Card",
        description: "Must be linked to your mobile number.",
        icon: "id",
      },
      {
        name: "Land Ownership Papers",
        description: "Khatauni / Patta / Title Deed proving land holding.",
        icon: "land",
      },
      {
        name: "Bank Passbook",
        description: "Account must be active and linked to Aadhaar for Direct Benefit Transfer (DBT).",
        icon: "bank",
      },
    ],
    howToApplySteps: [
      {
        stepNumber: 1,
        title: "Gather Documents",
        description: "Ensure you have soft copies of your Aadhaar, Land records, and Bank passbook.",
      },
      {
        stepNumber: 2,
        title: "Click Apply",
        description: "Use the 'Apply for this scheme' button to start the Sahayak guided form.",
      },
      {
        stepNumber: 3,
        title: "Verification",
        description: "Your details will be verified by the State Nodal Officer.",
      },
      {
        stepNumber: 4,
        title: "Receive Funds",
        description: "Installments are credited directly to your Aadhaar-linked bank account.",
      },
    ],
    fullCriteria: [
      "Must be a small and marginal farmer family.",
      "Combined landholding up to 2 hectares (subject to state variations).",
      "Must hold valid cultivable land as per land records.",
      "Excludes institutional landholders and certain professional categories.",
    ],
    requiredDetailsChecklist: [
      {
        id: "full_name",
        label: "Full Name",
        sublabel: "Matches Aadhaar",
        status: "have_it",
        fieldKey: "name",
      },
      {
        id: "aadhaar",
        label: "Aadhaar Number",
        sublabel: "Required for verification",
        status: "missing",
        fieldKey: "aadhaarNumber",
      },
      {
        id: "bank_acc",
        label: "Bank Account",
        sublabel: "Linked to Aadhaar",
        status: "have_it",
        fieldKey: "bankAccountNumber",
      },
      {
        id: "land_id",
        label: "Land Parcel ID",
        sublabel: "Proof of ownership",
        status: "missing",
        fieldKey: "landParcelId",
      },
    ],
  },
  {
    id: "ayushman-bharat",
    code: "AB-PMJAY",
    name: "Ayushman Bharat",
    fullName: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana",
    benefitShort: "Health coverage up to ₹5 lakhs per family per year.",
    description: "Health coverage up to ₹5 lakhs per family per year for secondary and tertiary care hospitalization across all empaneled public and private hospitals.",
    status: "needs_info",
    statusText: "NEEDS MORE INFO",
    infoRequiredPrompt: "Please provide your Ration Card number to confirm eligibility.",
    officialUrl: "https://pmjay.gov.in",
    whyEligibleReason:
      "Families listed in the SECC 2011 database or possessing verified NFSA/State Ration Cards are entitled to cashless hospitalization up to ₹5 Lakhs per annum.",
    documents: [
      {
        name: "Ration Card (NFSA / State)",
        description: "Proof of socio-economic category & household listing.",
        icon: "ration",
      },
      {
        name: "Aadhaar Card",
        description: "For biometric e-KYC authentication.",
        icon: "id",
      },
      {
        name: "Mobile Number",
        description: "To receive PMJAY golden card updates.",
        icon: "certificate",
      },
    ],
    howToApplySteps: [
      {
        stepNumber: 1,
        title: "Check Ration Card / SECC",
        description: "Enter your Ration Card or HHID to verify your household record.",
      },
      {
        stepNumber: 2,
        title: "Complete e-KYC",
        description: "Perform Aadhaar OTP or Biometric authentication at any CSC or Ayushman Kendra.",
      },
      {
        stepNumber: 3,
        title: "Get Ayushman Card",
        description: "Download PVC Ayushman Card with PMJAY QR code.",
      },
    ],
    fullCriteria: [
      "Deprivation and occupational criteria based on Socio-Economic Caste Census (SECC) 2011.",
      "Valid Ration Card registered under National Food Security Act (NFSA).",
      "No cap on family size or age of members.",
    ],
    requiredDetailsChecklist: [
      {
        id: "full_name",
        label: "Full Name",
        sublabel: "Matches Ration Card",
        status: "have_it",
        fieldKey: "name",
      },
      {
        id: "ration_card",
        label: "Ration Card Number",
        sublabel: "NFSA / State Priority Card",
        status: "missing",
        fieldKey: "rationCardNumber",
      },
      {
        id: "aadhaar",
        label: "Aadhaar Number",
        sublabel: "For e-KYC verification",
        status: "missing",
        fieldKey: "aadhaarNumber",
      },
    ],
  },
  {
    id: "pmay-g",
    code: "PMAY-G",
    name: "PMAY-G (Housing Scheme)",
    fullName: "Pradhan Mantri Awas Yojana - Gramin",
    benefitShort: "Financial assistance for construction of a pucca house.",
    description: "Financial assistance of ₹1,20,000 to ₹1,30,000 for construction of a permanent pucca house with basic amenities.",
    status: "not_eligible",
    statusText: "NOT ELIGIBLE",
    whyNotEligibleReason:
      "Applicant is not currently flagged as homeless or living in a dilapidated kutcha house in the Awaas+ socio-economic priority list for the current village GP panchayat quota.",
    officialUrl: "https://pmayg.nic.in",
    documents: [
      {
        name: "Gram Panchayat Certificate",
        description: "Verification of current housing condition by Pradhan/Secretary.",
        icon: "certificate",
      },
      {
        name: "Aadhaar Card",
        description: "Required for all adult family members.",
        icon: "id",
      },
      {
        name: "Bank Passbook",
        description: "DBT account for 3-stage construction transfers.",
        icon: "bank",
      },
    ],
    howToApplySteps: [
      {
        stepNumber: 1,
        title: "Panchayat Verification",
        description: "Apply during Awaas+ gram sabha enrollment drive.",
      },
      {
        stepNumber: 2,
        title: "Geo-tagging",
        description: "Field officer inspects current kutcha home with GPS tagging.",
      },
      {
        stepNumber: 3,
        title: "Sanction Letter",
        description: "Receive first installment directly into DBT bank account.",
      },
    ],
    fullCriteria: [
      "Houseless families or families living in zero, one or two-room houses with kutcha walls and kutcha roof.",
      "Excludes households with 2/3/4 wheeler, motorized boat, or agricultural equipment over 50k value.",
      "Excludes any household member who is a government employee.",
    ],
    requiredDetailsChecklist: [
      {
        id: "full_name",
        label: "Full Name",
        sublabel: "Head of Household",
        status: "have_it",
        fieldKey: "name",
      },
      {
        id: "aadhaar",
        label: "Aadhaar Number",
        sublabel: "Required for geo-tagging",
        status: "missing",
        fieldKey: "aadhaarNumber",
      },
    ],
  },
  {
    id: "nsap",
    code: "NSAP",
    name: "National Social Assistance Programme (NSAP)",
    fullName: "Indira Gandhi National Old Age / Disability Pension Scheme",
    benefitShort: "Monthly pension for elderly, widows, and disabled persons.",
    description: "Pension for elderly (60+ years), widows, and disabled persons belonging to Below Poverty Line (BPL) households.",
    status: "not_eligible",
    statusText: "NOT ELIGIBLE",
    whyNotEligibleReason:
      "Age is under 60 years and no severe 80%+ physical disability certificate is on record. NSAP Old Age Pension requires minimum age of 60.",
    officialUrl: "https://nsap.nic.in",
    documents: [
      {
        name: "Age Proof / Birth Certificate",
        description: "To verify age of 60 years or above.",
        icon: "certificate",
      },
      {
        name: "BPL Certificate / Ration Card",
        description: "Proof of Below Poverty Line status.",
        icon: "income",
      },
      {
        name: "Bank Passbook",
        description: "Monthly pension DBT account.",
        icon: "bank",
      },
    ],
    howToApplySteps: [
      {
        stepNumber: 1,
        title: "Submit Form to BDO / Municipality",
        description: "Fill pension application with age & income proof.",
      },
      {
        stepNumber: 2,
        title: "Sanction Order",
        description: "Social Welfare department issues pension ID.",
      },
      {
        stepNumber: 3,
        title: "Monthly Disbursement",
        description: "Receive monthly pension via bank or post office DBT.",
      },
    ],
    fullCriteria: [
      "Applicant must be 60 years or older (for Old Age Pension).",
      "Applicant must belong to a household living Below Poverty Line (BPL).",
      "For disability pension, applicant must have minimum 80% disability.",
    ],
    requiredDetailsChecklist: [
      {
        id: "full_name",
        label: "Full Name",
        sublabel: "Matches Age Proof",
        status: "have_it",
        fieldKey: "name",
      },
    ],
  },
];

export const INITIAL_VAULT_DOCS: VaultDocument[] = [
  {
    id: "doc-1",
    type: "Aadhaar Card",
    title: "Aadhaar Card",
    issuer: "Unique Identification Authority of India (UIDAI)",
    documentNumber: "•••• •••• 8912",
    verified: true,
    updatedAt: "12 May 2024",
    category: "identity",
  },
  {
    id: "doc-2",
    type: "Bank DBT Passbook",
    title: "State Bank of India (DBT Linked)",
    issuer: "State Bank of India - Burdwan Branch",
    documentNumber: "SBIN00481923891",
    verified: true,
    updatedAt: "04 Jan 2024",
    category: "banking",
  },
  {
    id: "doc-3",
    type: "Land Record / Patta",
    title: "Banglarbhumi Land Record (Khatian 412/A)",
    issuer: "Directorate of Land Records and Surveys, West Bengal",
    documentNumber: "LR-WB-2023-994102",
    verified: false,
    updatedAt: "28 Oct 2023",
    category: "land",
  },
];

export const SAMPLE_GRIEVANCE_DRAFT = `Subject: PM-KISAN payment delay

To the Grievance Redressal Officer,

I am writing to formally lodge a complaint regarding the non-receipt of my PM-KISAN installment for the current cycle. My application status shows active, and my e-KYC is complete, yet the payment has not been credited to my registered bank account.

I request you to kindly investigate this matter and expedite the release of the pending funds.

Sincerely,
Bikash Mondal`;
