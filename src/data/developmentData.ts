import {
  DevelopmentCategory,
  CategoryMetadata,
  DemandHotspot,
  CitizenDevelopmentRequest,
  BRICSRegionOption,
} from "../types";

export const DEVELOPMENT_CATEGORIES: CategoryMetadata[] = [
  {
    id: "healthcare",
    name: "Healthcare Access & Hospitals",
    nameBn: "স্বাস্থ্য পরিষেবা ও হাসপাতাল",
    nameHi: "स्वास्थ्य सेवा और अस्पताल",
    icon: "HeartPulse",
    color: "rose",
    description: "Primary health centres, emergency care, medical staff, diagnostic labs, and ambulances.",
  },
  {
    id: "roads",
    name: "Roads & Bridges",
    nameBn: "রাস্তাঘাট ও সেতু",
    nameHi: "सड़कें और पुल",
    icon: "Route",
    color: "amber",
    description: "Paved all-weather roads, bridge repairs, village connectivity, and potholes.",
  },
  {
    id: "drinking_water",
    name: "Clean Drinking Water",
    nameBn: "বিশুদ্ধ পানীয় জল",
    nameHi: "स्वच्छ पेयजल",
    icon: "Droplets",
    color: "cyan",
    description: "Piped water supply, filtration units, arsenic/fluoride treatment, and deep borewells.",
  },
  {
    id: "schools_education",
    name: "Schools & Education Infrastructure",
    nameBn: "বিদ্যালয় ও শিক্ষা পরিকাঠামো",
    nameHi: "स्कूल और शिक्षा बुनियादी ढांचा",
    icon: "GraduationCap",
    color: "indigo",
    description: "Classrooms, digital labs, sanitation blocks in schools, and secondary education access.",
  },
  {
    id: "electricity",
    name: "Electricity & Power Grid",
    nameBn: "বিদ্যুৎ পরিষেবা ও গ্রিড",
    nameHi: "बिजली और पावर ग्रिड",
    icon: "Zap",
    color: "yellow",
    description: "Transformer stability, uninterrupted agricultural power, streetlights, and solar mini-grids.",
  },
  {
    id: "public_transport",
    name: "Public Transport & Connectivity",
    nameBn: "গণপরিবহন ও যাতায়াত",
    nameHi: "सार्वजनिक परिवहन",
    icon: "Bus",
    color: "blue",
    description: "Bus routes, rural feeder services, stops, and frequency of connectivity.",
  },
  {
    id: "sanitation",
    name: "Sanitation & Community Toilets",
    nameBn: "নিকাশি ও গণশৌচাগার",
    nameHi: "स्वच्छता और सार्वजनिक शौचालय",
    icon: "Sparkles",
    color: "teal",
    description: "Household sanitation coverage, public toilet hygiene, and sewage treatment.",
  },
  {
    id: "drainage_flood",
    name: "Drainage & Flood Management",
    nameBn: "ড্রেনেজ ও বন্যা নিয়ন্ত্রণ",
    nameHi: "जल निकासी और बाढ़ प्रबंधन",
    icon: "Waves",
    color: "sky",
    description: "Monsoon stormwater canals, embankment protection, and urban waterlogging prevention.",
  },
  {
    id: "agriculture_infrastructure",
    name: "Agriculture & Mandi Infrastructure",
    nameBn: "কৃষি ও মান্ডি পরিকাঠামো",
    nameHi: "कृषि और मंडी बुनियादी ढांचा",
    icon: "Wheat",
    color: "emerald",
    description: "Cold storage, grain drying yards, APMC mandi sheds, and warehouse facilities.",
  },
  {
    id: "irrigation",
    name: "Irrigation & Canals",
    nameBn: "সেচ ও খাল খনন",
    nameHi: "सिंचाई और नहरें",
    icon: "GitBranch",
    color: "teal",
    description: "Canal desiltation, solar check dams, lift irrigation, and rainwater harvesting.",
  },
  {
    id: "internet_connectivity",
    name: "Internet & Digital Public Infrastructure",
    nameBn: "ইন্টারনেট ও ডিজিটাল সংযোগ",
    nameHi: "इंटरनेट और डिजिटल कनेक्टिविटी",
    icon: "Wifi",
    color: "violet",
    description: "BharatNet optical fiber, CSC digital service kiosks, and 4G/5G mobile towers.",
  },
  {
    id: "waste_management",
    name: "Waste Management",
    nameBn: "বর্জ্য ব্যবস্থাপনা ও সাফাই",
    nameHi: "कचरा प्रबंधन",
    icon: "Trash2",
    color: "slate",
    description: "Door-to-door collection, solid waste segregation, and compost processing plants.",
  },
  {
    id: "public_safety",
    name: "Public Safety & Street Lighting",
    nameBn: "জননিরাপত্তা ও রাস্তার আলো",
    nameHi: "सार्वजनिक सुरक्षा और स्ट्रीट लाइट",
    icon: "ShieldAlert",
    color: "orange",
    description: "Night security lighting, police beat posts, and safe pedestrian pathways.",
  },
  {
    id: "housing",
    name: "Affordable Housing & Slum Upgrading",
    nameBn: "আবাসন ও বস্তি উন্নয়ন",
    nameHi: "किफायती आवास और बस्ती सुधार",
    icon: "Home",
    color: "lime",
    description: "Disaster-resilient housing, slum redevelopment, and municipal land titling.",
  },
  {
    id: "employment_infrastructure",
    name: "Employment & Skill Training Centers",
    nameBn: "কর্মসংস্থান ও দক্ষতা কেন্দ্র",
    nameHi: "रोजगार और कौशल केंद्र",
    icon: "Briefcase",
    color: "purple",
    description: "Rural skill training hubs, artisan tool sheds, and cottage industry co-working spaces.",
  },
  {
    id: "government_services",
    name: "Government Service Access & CSCs",
    nameBn: "সরকারি পরিষেবা কেন্দ্র",
    nameHi: "सरकारी सेवा केंद्र और सीएससी",
    icon: "Building2",
    color: "stone",
    description: "Panchayat bhavan access, Aadhaar update counters, and single-window citizen desks.",
  },
  {
    id: "other",
    name: "Other Civic & Community Need",
    nameBn: "অন্যান্য নাগরিক প্রয়োজন",
    nameHi: "अन्य नागरिक आवश्यकता",
    icon: "HelpCircle",
    color: "gray",
    description: "Preserved original citizen request description for unclassified or emerging civic topics.",
  },
];

export const BRICS_REGIONS: BRICSRegionOption[] = [
  {
    code: "IN",
    name: "India (Demonstration Pilot)",
    flag: "🇮🇳",
    currency: "INR (₹)",
    pilotDistrict: "Dakshin Dinajpur & Purulia",
    activeDemonstration: true,
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    currency: "BRL (R$)",
    pilotDistrict: "Bahia & Minas Gerais",
    activeDemonstration: false,
  },
  {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR (R)",
    pilotDistrict: "Limpopo & Eastern Cape",
    activeDemonstration: false,
  },
  {
    code: "RU",
    name: "Russia",
    flag: "🇷🇺",
    currency: "RUB (₽)",
    pilotDistrict: "Siberian Federal District",
    activeDemonstration: false,
  },
  {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    currency: "CNY (¥)",
    pilotDistrict: "Guizhou & Sichuan Rural Hubs",
    activeDemonstration: false,
  },
];

export const INITIAL_DEMAND_HOTSPOTS: DemandHotspot[] = [
  {
    id: "hotspot-balurghat-health",
    category: "healthcare",
    title: "Secondary Healthcare & Emergency Care Shortage",
    titleBn: "জরুরি স্বাস্থ্য পরিষেবা ও বিশেষজ্ঞ চিকিৎসকের সংকট",
    titleHi: "माध्यमिक स्वास्थ्य सेवा और आपातकालीन देखभाल की कमी",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Dakshin Dinajpur",
      city: "Balurghat",
      coordinates: [25.2215, 88.7649],
    },
    requestCount: 2430,
    uniqueCitizens: 2430,
    severity: "high",
    estimatedAffectedPopulation: 180000,
    infrastructureIndicator: {
      name: "Hospital Bed & Specialist Ratio",
      currentValue: "0.42 beds / 1,000",
      benchmarkValue: "1.5 beds / 1,000",
      gapDescription: "72% deficit in hospital beds and critical trauma response units.",
      status: "critical",
    },
    demographics: {
      population: 265000,
      densityPerKm2: 780,
      vulnerableHouseholdsPct: 64,
      ruralPct: 78,
      bplCardHoldersPct: 52,
    },
    priorityScore: 92,
    priorityRank: 1,
    trend7Days: 14.2,
    status: "escalated",
    sampleCitizenQuotes: [
      {
        text: "আমাদের এলাকায় ভালো হাসপাতাল নেই এবং হাসপাতালে যেতে অনেক দূর মালদা যেতে হয়। জরুরি চিকিৎসার জন্য কোনো আইসিইউ নেই।",
        lang: "bn",
        timestamp: "10 mins ago",
        locationText: "Balurghat Rural Block",
        audioAvailable: true,
      },
      {
        text: "রাত হলে কোনো ডাক্তার পাওয়া যায় না। প্রসূতি মা ও শিশুদের চিকিৎসার জন্য ৪০ কিমি দূরে ছুটতে হয়।",
        lang: "bn",
        timestamp: "32 mins ago",
        locationText: "Tapan Road, Balurghat",
        audioAvailable: true,
      },
      {
        text: "There are no emergency trauma facilities in our subdivision. Patients must travel 3 hours to Malda.",
        lang: "en",
        timestamp: "2 hours ago",
        locationText: "Balurghat Municipality",
      },
    ],
    aiRecommendation: {
      title: "Immediate Upgradation of Sub-Divisional Hospital & 2 PHCs",
      summary:
        "Prioritize expansion of Balurghat Sub-Divisional Hospital with a dedicated 50-bed Mother & Child Care wing, emergency 24x7 trauma care, and 4 GPS-tracked Advanced Life Support ambulances.",
      suggestedAction:
        "Sanction ₹14.8 Cr under National Health Mission (NHM) Infrastructure Head and establish an e-Sanjeevani Telemedicine cluster hub.",
      estimatedBudget: "₹14.80 Crore",
      targetTimeline: "6–9 Months",
      whyJustification: [
        "Unusually high citizen request density (2,430 verified citizen reports within 45 days)",
        "Over 180,000 semi-urban & tribal catchment population currently travels >90 km for emergency care",
        "Hospital bed indicator is 72% below the national healthcare benchmark (0.42 vs 1.5 per 1,000)",
        "84% of surveyed households fall under BPL/Marginal farmer economic brackets",
      ],
      sdgAlignment: ["SDG 3: Good Health & Well-being", "SDG 10: Reduced Inequalities"],
    },
  },
  {
    id: "hotspot-purulia-roads",
    category: "roads",
    title: "Rural Road Connectivity & Monsoon Bridge Vulnerability",
    titleBn: "গ্রামীণ পাকা রাস্তা ও কালভার্ট সংযোগের করুণ দশা",
    titleHi: "ग्रामीण पक्की सड़क और पुलिया संपर्क की गंभीर समस्या",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Purulia",
      city: "Jhalda / Baghmundi",
      coordinates: [23.3672, 85.9922],
    },
    requestCount: 1870,
    uniqueCitizens: 1870,
    severity: "high",
    estimatedAffectedPopulation: 142000,
    infrastructureIndicator: {
      name: "All-Weather Paved Road Ratio",
      currentValue: "42% coverage",
      benchmarkValue: "85% coverage",
      gapDescription: "58% of connecting village arteries remain unpaved or washed out in monsoons.",
      status: "critical",
    },
    demographics: {
      population: 195000,
      densityPerKm2: 468,
      vulnerableHouseholdsPct: 71,
      ruralPct: 89,
      bplCardHoldersPct: 61,
    },
    priorityScore: 86,
    priorityRank: 2,
    trend7Days: 8.7,
    status: "under_review",
    sampleCitizenQuotes: [
      {
        text: "বর্ষাকালে আমাদের গ্রামে কোনো অ্যাম্বুলেন্স বা গাড়ি ঢুকতে পারে না। রাস্তা পুরো কাদা আর খানাখন্দে ভরা।",
        lang: "bn",
        timestamp: "1 hour ago",
        locationText: "Baghmundi Sector",
        audioAvailable: true,
      },
      {
        text: "স্কুল ছাত্রছাত্রীদের ৩ কিমি কাদা ভেঙে হেঁটে যেতে হয়। পঞ্চায়েতে জানিয়েও রাস্তা সংস্কার হয়নি।",
        lang: "bn",
        timestamp: "3 hours ago",
        locationText: "Jhalda Block II",
      },
      {
        text: "Monsoon floods wash away the wooden bridge every year, cutting off 14 tribal hamlets.",
        lang: "en",
        timestamp: "5 hours ago",
        locationText: "Ayodhya Hills Foothills",
      },
    ],
    aiRecommendation: {
      title: "PMGSY Priority Corridor & 3 Reinforced Concrete Culverts",
      summary:
        "Fast-track 28.4 km of all-weather bituminous road under PMGSY Phase-III connecting 14 cutoff tribal hamlets to the state highway with 3 concrete bridges.",
      suggestedAction:
        "Include in District Infrastructure Masterplan Q3 priority allocation with decentralized panchayat monitoring.",
      estimatedBudget: "₹18.20 Crore",
      targetTimeline: "8–12 Months",
      whyJustification: [
        "1,870 citizen reports indicating recurring monsoon isolation",
        "42% paved road coverage vs 85% state target",
        "Directly benefits 142,000 agricultural workers and school-going youth",
        "Reduces farm-to-mandi transit time by 65%",
      ],
      sdgAlignment: ["SDG 9: Industry, Innovation & Infrastructure", "SDG 11: Sustainable Communities"],
    },
  },
  {
    id: "hotspot-malda-water",
    category: "drinking_water",
    title: "Arsenic Contamination & Piped Drinking Water Deficit",
    titleBn: "ভূগর্ভস্থ জলে আর্সেনিক ও পাইপলাইনের পানীয় জলের সংকট",
    titleHi: "भूजल में आर्सेनिक और पाइप से पीने के पानी का संकट",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Malda",
      city: "Kaliachak / Manikchak",
      coordinates: [24.8637, 88.0249],
    },
    requestCount: 1250,
    uniqueCitizens: 1250,
    severity: "high",
    estimatedAffectedPopulation: 210000,
    infrastructureIndicator: {
      name: "Functional Household Tap Connection (FHTC)",
      currentValue: "38% coverage",
      benchmarkValue: "80% coverage",
      gapDescription: "Groundwater testing shows arsenic levels 3.8x above WHO safety threshold.",
      status: "critical",
    },
    demographics: {
      population: 340000,
      densityPerKm2: 1040,
      vulnerableHouseholdsPct: 58,
      ruralPct: 82,
      bplCardHoldersPct: 49,
    },
    priorityScore: 81,
    priorityRank: 3,
    trend7Days: 11.4,
    status: "emerging",
    sampleCitizenQuotes: [
      {
        text: "আমাদের টিউবওয়েলের জলে আর্সেনিক রয়েছে, অনেকের চামড়ার রোগ হচ্ছে। সরকারি পানীয় জলের পাইপলাইন দরকার।",
        lang: "bn",
        timestamp: "45 mins ago",
        locationText: "Kaliachak Block I",
        audioAvailable: true,
      },
      {
        text: "पीने का साफ पानी 2 किमी दूर से लाना पड़ता है। स्कूल और आंगनवाड़ी में भी फिल्टर नहीं है।",
        lang: "hi",
        timestamp: "4 hours ago",
        locationText: "Manikchak Ghat",
      },
    ],
    aiRecommendation: {
      title: "Jal Jeevan Mission Surface Water Treatment & Community RO Hubs",
      summary:
        "Deploy 6 Community Water Purification Plants with solar-powered reverse osmosis and expedite 45 km trunk pipeline from Ganga surface water intake.",
      suggestedAction:
        "Issue administrative sanction under Jal Jeevan Mission Special Arsenic Mitigation Fund.",
      estimatedBudget: "₹22.50 Crore",
      targetTimeline: "12 Months",
      whyJustification: [
        "Severe public health hazard with 3.8x arsenic contamination above safety limits",
        "1,250 citizen complaints citing skin ailments and school absenteeism",
        "Only 38% functional tap connections in densely populated rural blocks",
      ],
      sdgAlignment: ["SDG 6: Clean Water & Sanitation", "SDG 3: Good Health & Well-being"],
    },
  },
  {
    id: "hotspot-siliguri-schools",
    category: "schools_education",
    title: "Digital Connectivity & Secondary School Infrastructure Deficit",
    titleBn: "ডিজিটাল ক্লাসরুম ও মাধ্যমিক বিদ্যালয়ের পরিকাঠামো ঘাটতি",
    titleHi: "डिजिटल क्लासरूम और माध्यमिक स्कूल बुनियादी ढांचे की कमी",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Darjeeling / Jalpaiguri",
      city: "Siliguri Rural & Tea Belt",
      coordinates: [26.7271, 88.3953],
    },
    requestCount: 980,
    uniqueCitizens: 980,
    severity: "medium",
    estimatedAffectedPopulation: 95000,
    infrastructureIndicator: {
      name: "High School Lab & Fiber Broadband Ratio",
      currentValue: "28% schools connected",
      benchmarkValue: "75% schools connected",
      gapDescription: "22 rural tea-garden schools lack broadband and STEM labs.",
      status: "warning",
    },
    demographics: {
      population: 175000,
      densityPerKm2: 620,
      vulnerableHouseholdsPct: 68,
      ruralPct: 65,
      bplCardHoldersPct: 55,
    },
    priorityScore: 78,
    priorityRank: 4,
    trend7Days: 5.2,
    status: "emerging",
    sampleCitizenQuotes: [
      {
        text: "চা বাগান এলাকার স্কুলে কোনো কম্পিউটার বা ইন্টারনেট নেই। ছাত্রছাত্রীরা অনলাইনে কোনো ফর্ম ভরতে পারে না।",
        lang: "bn",
        timestamp: "6 hours ago",
        locationText: "Matigara Tea Belt",
      },
      {
        text: "There are no science labs in 3 adjoining panchayats. Higher secondary students have to travel 18 km.",
        lang: "en",
        timestamp: "1 day ago",
        locationText: "Phansidewa Block",
      },
    ],
    aiRecommendation: {
      title: "PM-SHRI Tea-Belt School Upgrade & BharatNet Kiosk Hubs",
      summary:
        "Provision 18 smart classrooms, solar backup systems, and high-speed BharatNet connectivity across 22 tea-garden schools.",
      suggestedAction:
        "Allocate budget under Samagra Shiksha Abhiyan & Universal Service Obligation Fund (USOF).",
      estimatedBudget: "₹7.40 Crore",
      targetTimeline: "4–6 Months",
      whyJustification: [
        "980 citizen and youth submissions requesting educational equity",
        "Large drop-out rate among tea-garden worker children after Class 8",
        "BharatNet fiber points exist within 1.5 km but lack last-mile school drops",
      ],
      sdgAlignment: ["SDG 4: Quality Education", "SDG 9: Innovation & Infrastructure"],
    },
  },
  {
    id: "hotspot-gaya-irrigation",
    category: "irrigation",
    title: "Solar Lift Irrigation & Siltation in Farm Canals",
    titleBn: "সৌর সেচ ব্যবস্থা ও খালের পলি অপসারণের দাবি",
    titleHi: "सोलर लिफ्ट सिंचाई और नहरों की गाद सफाई की मांग",
    location: {
      country: "India",
      state: "Bihar",
      district: "Gaya",
      city: "Bodh Gaya / Sherghati",
      coordinates: [24.7914, 85.0002],
    },
    requestCount: 890,
    uniqueCitizens: 890,
    severity: "medium",
    estimatedAffectedPopulation: 118000,
    infrastructureIndicator: {
      name: "Assured Agricultural Irrigation Coverage",
      currentValue: "34% arable land",
      benchmarkValue: "70% arable land",
      gapDescription: "Siltation in feeder channels leaves 12,000 hectares dry during Rabi sowing.",
      status: "warning",
    },
    demographics: {
      population: 220000,
      densityPerKm2: 740,
      vulnerableHouseholdsPct: 62,
      ruralPct: 91,
      bplCardHoldersPct: 58,
    },
    priorityScore: 74,
    priorityRank: 5,
    trend7Days: 6.9,
    status: "under_review",
    sampleCitizenQuotes: [
      {
        text: "नहरों में पानी नहीं आता, गाद भर चुकी है। डीजल पंप बहुत महंगा पड़ता है, सोलर बोरवेल चाहिए।",
        lang: "hi",
        timestamp: "5 hours ago",
        locationText: "Sherghati Rural",
      },
      {
        text: "खेतों तक पानी पहुंचाने के लिए पक्की नाली और बिजली का अलग फीडर जरूरी है।",
        lang: "hi",
        timestamp: "8 hours ago",
        locationText: "Dobhi Block",
      },
    ],
    aiRecommendation: {
      title: "PM-KUSUM Solar Feeder & MGNREGS Canal Desiltation",
      summary:
        "Execute 32 km canal desiltation and install 45 community solar micro-lift irrigation pumps.",
      suggestedAction:
        "Convergence project combining PM Krishi Sinchayee Yojana (PMKSY) with MGNREGS labor.",
      estimatedBudget: "₹9.60 Crore",
      targetTimeline: "5 Months (before sowing)",
      whyJustification: [
        "890 smallholder farmers submitted geo-tagged water requirement requests",
        "Directly prevents distress migration by securing double-crop cycle on 12,000 ha",
      ],
      sdgAlignment: ["SDG 2: Zero Hunger", "SDG 8: Decent Work & Economic Growth"],
    },
  },
  {
    id: "hotspot-varanasi-waste",
    category: "drainage_flood",
    title: "Peri-Urban Drainage & Solid Waste Bottlenecks",
    titleBn: "শহরতলির নিকাশি ও কঠিন বর্জ্য ব্যবস্থাপনার সমস্যা",
    titleHi: "पेरी-अर्बन जल निकासी और ठोस कचरा प्रबंधन की समस्या",
    location: {
      country: "India",
      state: "Uttar Pradesh",
      district: "Varanasi",
      city: "Rohania / Pindra",
      coordinates: [25.3176, 82.9739],
    },
    requestCount: 1120,
    uniqueCitizens: 1120,
    severity: "medium",
    estimatedAffectedPopulation: 165000,
    infrastructureIndicator: {
      name: "Covered Stormwater Drain Coverage",
      currentValue: "31% peri-urban area",
      benchmarkValue: "75% peri-urban area",
      gapDescription: "Recurring waterlogging across 18 colonies causing vector-borne health risks.",
      status: "warning",
    },
    demographics: {
      population: 290000,
      densityPerKm2: 1250,
      vulnerableHouseholdsPct: 44,
      ruralPct: 45,
      bplCardHoldersPct: 38,
    },
    priorityScore: 76,
    priorityRank: 6,
    trend7Days: 9.1,
    status: "emerging",
    sampleCitizenQuotes: [
      {
        text: "हल्की बारिश में भी कॉलोनियों में 2 फीट पानी भर जाता है। मुख्य नाला कचरे से जाम पड़ा है।",
        lang: "hi",
        timestamp: "2 hours ago",
        locationText: "Rohania Ward 14",
      },
    ],
    aiRecommendation: {
      title: "SBM 2.0 Peri-Urban Trunk Drain & Solid Waste Segregation",
      summary:
        "Construct 14 km covered RCC stormwater trunk drain with decentralized compacting station.",
      suggestedAction: "Sanction under Swachh Bharat Mission (Urban) 2.0 Infrastructure Head.",
      estimatedBudget: "₹11.20 Crore",
      targetTimeline: "6 Months",
      whyJustification: [
        "1,120 citizen complaints concerning waterborne diseases and road blockage",
        "Protects 165,000 residents from recurring seasonal stagnation",
      ],
      sdgAlignment: ["SDG 11: Sustainable Cities & Communities", "SDG 6: Clean Water & Sanitation"],
    },
  },
];

export const INITIAL_CITIZEN_REQUESTS: CitizenDevelopmentRequest[] = [
  {
    requestId: "REQ-2026-08912",
    language: "bn",
    originalText: "আমাদের এলাকায় ভালো হাসপাতাল নেই এবং হাসপাতালে যেতে অনেক দূর মালদা যেতে হয়।",
    category: "healthcare",
    subCategory: "healthcare_access",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Dakshin Dinajpur",
      city: "Balurghat",
      locality: "Rampur Gram Panchayat",
      coordinates: [25.2215, 88.7649],
    },
    problem: "Severe deficit in emergency secondary healthcare and lack of specialized doctors within 40 km radius.",
    urgency: "high",
    affectedPopulation: "community",
    citizenSuggestedSolution: "Upgradation of local Rural Health Center to a 50-bed Sub-Divisional Hospital with 24x7 ambulance.",
    timestamp: "10 mins ago",
    source: "voice",
    verifiedStatus: "verified",
    citizenName: "Subhashis Roy",
    priorityScoreEstimate: 92,
  },
  {
    requestId: "REQ-2026-08911",
    language: "bn",
    originalText: "বর্ষাকালে আমাদের গ্রামে কোনো অ্যাম্বুলেন্স ঢুকতে পারে না। রাস্তা পুরো কাদা আর খানাখন্দে ভরা।",
    category: "roads",
    subCategory: "all_weather_road",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Purulia",
      city: "Baghmundi",
      locality: "Matha Forest Village",
      coordinates: [23.1972, 86.0422],
    },
    problem: "Unpaved dirt road becomes completely impassable during monsoons, disconnecting 800+ households.",
    urgency: "high",
    affectedPopulation: "entire_region",
    citizenSuggestedSolution: "Concrete PMGSY road and 2 culverts across the seasonal stream.",
    timestamp: "25 mins ago",
    source: "voice",
    verifiedStatus: "verified",
    citizenName: "Ananya Soren",
    priorityScoreEstimate: 86,
  },
  {
    requestId: "REQ-2026-08910",
    language: "hi",
    originalText: "हमारे गांव में ट्यूबवेल से जो पानी निकलता है उसमें पीलापन और गंध है। पीने का साफ पानी नहीं है।",
    category: "drinking_water",
    subCategory: "water_quality",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Malda",
      city: "Kaliachak",
      locality: "Alinagar",
      coordinates: [24.8637, 88.0249],
    },
    problem: "High arsenic and iron contamination in shallow groundwater affecting school children.",
    urgency: "high",
    affectedPopulation: "community",
    citizenSuggestedSolution: "JJM overhead tank and pipeline connection.",
    timestamp: "42 mins ago",
    source: "voice",
    verifiedStatus: "verified",
    citizenName: "Rameshwar Prasad",
    priorityScoreEstimate: 81,
  },
  {
    requestId: "REQ-2026-08909",
    language: "en",
    originalText: "The higher secondary school in our tea garden has zero broadband connectivity or science labs.",
    category: "schools_education",
    subCategory: "digital_labs",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Darjeeling",
      city: "Matigara",
      locality: "Hansqua Tea Estate",
      coordinates: [26.7171, 88.3553],
    },
    problem: "Educational disparity for 450+ first-generation learners without computer labs.",
    urgency: "medium",
    affectedPopulation: "community",
    citizenSuggestedSolution: "PM-SHRI digital lab and fiber line.",
    timestamp: "1 hour ago",
    source: "text",
    verifiedStatus: "verified",
    citizenName: "Pooja Gurung",
    priorityScoreEstimate: 78,
  },
  {
    requestId: "REQ-2026-08908",
    language: "hi",
    originalText: "नहर की सफाई 5 साल से नहीं हुई है। सिंचाई के समय पानी खेतों तक नहीं पहुंच पाता।",
    category: "irrigation",
    subCategory: "canal_desiltation",
    location: {
      country: "India",
      state: "Bihar",
      district: "Gaya",
      city: "Sherghati",
      locality: "Karmauni",
      coordinates: [24.7914, 85.0002],
    },
    problem: "Canal siltation causing crop failure on 400 acres of paddy land.",
    urgency: "medium",
    affectedPopulation: "community",
    citizenSuggestedSolution: "MGNREGA canal desilting and solar lift pump.",
    timestamp: "2 hours ago",
    source: "messaging",
    verifiedStatus: "verified",
    citizenName: "Mahesh Yadav",
    priorityScoreEstimate: 74,
  },
  {
    requestId: "REQ-2026-08907",
    language: "bn",
    originalText: "আমাদের বাজারে সন্ধ্যার পর আলো থাকে না। মহিলাদের যাতায়াতের জন্য সোলার স্ট্রিট লাইট দরকার।",
    category: "public_safety",
    subCategory: "street_lighting",
    location: {
      country: "India",
      state: "West Bengal",
      district: "Murshidabad",
      city: "Berhampore",
      locality: "Balarampur Hat",
      coordinates: [24.0984, 88.2685],
    },
    problem: "Lack of street lighting around busy village weekly market causing safety concerns.",
    urgency: "medium",
    affectedPopulation: "neighborhood",
    citizenSuggestedSolution: "20 solar high-mast lights around the market.",
    timestamp: "3 hours ago",
    source: "text",
    verifiedStatus: "verified",
    citizenName: "Ruma Das",
    priorityScoreEstimate: 68,
  },
  {
    requestId: "REQ-2026-08906",
    language: "hi",
    originalText: "मुख्य सड़क के किनारे खुला कूड़ा डंप है जिससे बदबू और बीमारियां फैल रही हैं।",
    category: "waste_management",
    subCategory: "solid_waste",
    location: {
      country: "India",
      state: "Uttar Pradesh",
      district: "Varanasi",
      city: "Rohania",
      locality: "GT Road Junction",
      coordinates: [25.3176, 82.9739],
    },
    problem: "Unregulated municipal garbage dumping near residential schools and water body.",
    urgency: "medium",
    affectedPopulation: "neighborhood",
    citizenSuggestedSolution: "Covered collection bins and daily truck pickup.",
    timestamp: "4 hours ago",
    source: "text",
    verifiedStatus: "verified",
    citizenName: "Satish Mishra",
    priorityScoreEstimate: 76,
  },
];

export interface PriorityWeights {
  requestVolume: number; // 0.0 - 1.0 (default 0.30)
  severity: number; // 0.0 - 1.0 (default 0.25)
  populationImpact: number; // 0.0 - 1.0 (default 0.20)
  infrastructureGap: number; // 0.0 - 1.0 (default 0.15)
  underservedFactor: number; // 0.0 - 1.0 (default 0.10)
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  requestVolume: 0.30,
  severity: 0.25,
  populationImpact: 0.20,
  infrastructureGap: 0.15,
  underservedFactor: 0.10,
};

export function calculatePriorityScore(
  hotspot: DemandHotspot,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): number {
  // Volume score: normalized to 0-100 based on scale (2500 max baseline)
  const volumeScore = Math.min(100, (hotspot.requestCount / 2500) * 100);

  // Severity score
  const severityScore =
    hotspot.severity === "high" ? 100 : hotspot.severity === "medium" ? 65 : 35;

  // Population impact: normalized (300,000 max baseline)
  const popScore = Math.min(100, (hotspot.estimatedAffectedPopulation / 300000) * 100);

  // Infrastructure gap status
  const gapScore =
    hotspot.infrastructureIndicator.status === "critical"
      ? 100
      : hotspot.infrastructureIndicator.status === "warning"
      ? 65
      : 30;

  // Underserved factor (based on vulnerable / rural %)
  const underservedScore =
    (hotspot.demographics.vulnerableHouseholdsPct * 0.5) +
    (hotspot.demographics.ruralPct * 0.5);

  const total =
    volumeScore * weights.requestVolume +
    severityScore * weights.severity +
    popScore * weights.populationImpact +
    gapScore * weights.infrastructureGap +
    underservedScore * weights.underservedFactor;

  return Math.round(Math.min(99, Math.max(20, total)));
}

export function getCategoryMeta(id: DevelopmentCategory | string): CategoryMetadata {
  const found = DEVELOPMENT_CATEGORIES.find((c) => c.id === id);
  if (found) return found;
  return (
    DEVELOPMENT_CATEGORIES.find((c) => c.id === "other") || {
      id: "other",
      name: "Other Need",
      nameBn: "অন্যান্য প্রয়োজন",
      nameHi: "अन्य आवश्यकता",
      icon: "HelpCircle",
      color: "gray",
      description: "Preserved citizen voice feedback",
    }
  );
}

// Client-side quick classifier & keyword extractor for instant feedback
export function classifyCitizenTextLocally(
  text: string,
  userLocation?: { state?: string; district?: string; city?: string }
): Partial<CitizenDevelopmentRequest> {
  const lower = (text || "").toLowerCase();

  let category: DevelopmentCategory = "other";
  let problem = text || "Citizen reported development need";
  let urgency: "low" | "medium" | "high" | "critical" = "medium";
  let affectedPopulation: "individual" | "neighborhood" | "community" | "entire_region" = "community";

  // Category keyword patterns
  if (
    lower.includes("হাসপাতাল") ||
    lower.includes("ডাক্তার") ||
    lower.includes("চিকিৎসা") ||
    lower.includes("রোগী") ||
    lower.includes("ঔষধ") ||
    lower.includes("hospital") ||
    lower.includes("doctor") ||
    lower.includes("clinic") ||
    lower.includes("ambulance") ||
    lower.includes("स्वास्थ्य") ||
    lower.includes("अस्पताल") ||
    lower.includes("इलाज") ||
    lower.includes("दवा")
  ) {
    category = "healthcare";
    urgency = "high";
    problem = "Access to secondary/emergency healthcare, hospital beds, or specialist medical staff";
  } else if (
    lower.includes("রাস্তা") ||
    lower.includes("সেতু") ||
    lower.includes("কালভার্ট") ||
    lower.includes("কাদা") ||
    lower.includes("road") ||
    lower.includes("bridge") ||
    lower.includes("pothole") ||
    lower.includes("highway") ||
    lower.includes("सड़क") ||
    lower.includes("पुल") ||
    lower.includes("रास्ता")
  ) {
    category = "roads";
    urgency = lower.includes("অ্যাম্বুলেন্স") || lower.includes("বর্ষা") || lower.includes("flood") ? "high" : "medium";
    problem = "Damaged, unpaved or washed-out road and bridge connectivity preventing all-weather travel";
  } else if (
    lower.includes("জল") ||
    lower.includes("পানি") ||
    lower.includes("আর্সেনিক") ||
    lower.includes("টিউবওয়েল") ||
    lower.includes("ট্যাপ") ||
    lower.includes("water") ||
    lower.includes("drinking") ||
    lower.includes("arsenic") ||
    lower.includes("pipe") ||
    lower.includes("नल") ||
    lower.includes("पीने का पानी")
  ) {
    category = "drinking_water";
    urgency = "high";
    problem = "Lack of clean piped drinking water, arsenic/saline contamination, or non-functional borewells";
  } else if (
    lower.includes("স্কুল") ||
    lower.includes("বিদ্যালয়") ||
    lower.includes("শিক্ষক") ||
    lower.includes("পড়া") ||
    lower.includes("school") ||
    lower.includes("college") ||
    lower.includes("teacher") ||
    lower.includes("classroom") ||
    lower.includes("लैब") ||
    lower.includes("स्कूल") ||
    lower.includes("शिक्षा")
  ) {
    category = "schools_education";
    urgency = "medium";
    problem = "Deficit in school infrastructure, classrooms, STEM labs, or digital connectivity";
  } else if (
    lower.includes("বিদ্যুৎ") ||
    lower.includes("কারেন্ট") ||
    lower.includes("ট্রান্সফরমার") ||
    lower.includes("electricity") ||
    lower.includes("power") ||
    lower.includes("transformer") ||
    lower.includes("बिजली") ||
    lower.includes("लोड शेडिंग")
  ) {
    category = "electricity";
    urgency = "medium";
    problem = "Frequent load shedding, low voltage, or burnt agricultural transformers";
  } else if (
    lower.includes("সেচ") ||
    lower.includes("খাল") ||
    lower.includes("বোরওয়েল") ||
    lower.includes("irrigation") ||
    lower.includes("canal") ||
    lower.includes("farm water") ||
    lower.includes("सिंचाई") ||
    lower.includes("नहर")
  ) {
    category = "irrigation";
    urgency = "medium";
    problem = "Inadequate agricultural canal water flow, siltation, or need for solar lift irrigation";
  } else if (
    lower.includes("নিকাশি") ||
    lower.includes("ড্রেন") ||
    lower.includes("বন্যা") ||
    lower.includes("জল জমে") ||
    lower.includes("drain") ||
    lower.includes("flood") ||
    lower.includes("waterlog") ||
    lower.includes("जल निकासी") ||
    lower.includes("जलभराव")
  ) {
    category = "drainage_flood";
    urgency = "high";
    problem = "Severe stormwater drainage blockages and seasonal waterlogging in residential settlements";
  } else if (
    lower.includes("বাস") ||
    lower.includes("যাতায়াত") ||
    lower.includes("পরিবহন") ||
    lower.includes("bus") ||
    lower.includes("transport") ||
    lower.includes("train") ||
    lower.includes("बस") ||
    lower.includes("परिवहन")
  ) {
    category = "public_transport";
    urgency = "medium";
    problem = "Insufficient public bus services, missing rural feeder routes, or disconnected transit";
  } else if (
    lower.includes("ইন্টারনেট") ||
    lower.includes("নেটওয়ার্ক") ||
    lower.includes("টাওয়ার") ||
    lower.includes("internet") ||
    lower.includes("network") ||
    lower.includes("fiber") ||
    lower.includes("mobile tower")
  ) {
    category = "internet_connectivity";
    urgency = "low";
    problem = "Poor cellular coverage, lack of high-speed broadband, or non-functional CSC digital kiosks";
  }

  // Location heuristic extraction from text
  const locationText = text;
  let city = userLocation?.city || "Balurghat";
  let district = userLocation?.district || "Dakshin Dinajpur";
  let state = userLocation?.state || "West Bengal";

  if (locationText.toLowerCase().includes("balurghat") || locationText.includes("বালুরঘাট") || locationText.includes("बालुरघाट")) {
    city = "Balurghat";
    district = "Dakshin Dinajpur";
    state = "West Bengal";
  } else if (locationText.toLowerCase().includes("purulia") || locationText.includes("পুরুলিয়া") || locationText.includes("पुरुलिया") || locationText.toLowerCase().includes("baghmundi") || locationText.toLowerCase().includes("jhalda")) {
    city = "Baghmundi";
    district = "Purulia";
    state = "West Bengal";
  } else if (locationText.toLowerCase().includes("malda") || locationText.includes("মালদা") || locationText.includes("मालदा") || locationText.toLowerCase().includes("kaliachak")) {
    city = "Kaliachak";
    district = "Malda";
    state = "West Bengal";
  } else if (locationText.toLowerCase().includes("siliguri") || locationText.includes("শিলিগুড়ি") || locationText.includes("দার্জিলিং") || locationText.toLowerCase().includes("darjeeling")) {
    city = "Siliguri";
    district = "Darjeeling";
    state = "West Bengal";
  } else if (locationText.toLowerCase().includes("gaya") || locationText.includes("গয়া") || locationText.includes("गया") || locationText.toLowerCase().includes("bihar")) {
    city = "Gaya";
    district = "Gaya";
    state = "Bihar";
  } else if (locationText.toLowerCase().includes("varanasi") || locationText.includes("বেনারস") || locationText.includes("वाराणसी") || locationText.toLowerCase().includes("kashi")) {
    city = "Varanasi";
    district = "Varanasi";
    state = "Uttar Pradesh";
  }

  return {
    category,
    problem,
    urgency,
    affectedPopulation,
    location: {
      country: "India",
      state,
      district,
      city,
    },
  };
}
