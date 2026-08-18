import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dedicated High-Fidelity Audio TTS Endpoint (Gemini TTS) with Server Memory Cache
  const ttsAudioCache = new Map<string, string>();

  function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const chunkSize = 36 + dataSize;

    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(chunkSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  let ttsCooldownUntil = 0;

  async function generateAndCacheAudio(text: string, voiceName = "Aoede"): Promise<string | null> {
    const cacheKey = `${voiceName}:${text.trim()}`;
    if (ttsAudioCache.has(cacheKey)) {
      return ttsAudioCache.get(cacheKey)!;
    }

    if (Date.now() < ttsCooldownUntil) {
      return null;
    }

    const ai = getGenAI();
    if (!ai) return null;

    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: text.trim(),
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
        },
      });

      const part = ttsResponse.candidates?.[0]?.content?.parts?.find((p) =>
        p.inlineData?.mimeType?.includes("audio")
      );

      if (!part || !part.inlineData?.data) {
        return null;
      }

      const rawPcm = Buffer.from(part.inlineData.data, "base64");
      const wavBuffer = pcmToWav(rawPcm, 24000);
      const audioBase64 = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
      ttsAudioCache.set(cacheKey, audioBase64);
      return audioBase64;
    } catch (e: any) {
      const errMsg = e?.message || "";
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
        const match = errMsg.match(/retry in ([0-9.]+)s/i) || errMsg.match(/retryDelay":"([0-9]+)s"/i);
        const retrySeconds = match && match[1] ? Math.ceil(parseFloat(match[1])) : 30;
        ttsCooldownUntil = Date.now() + retrySeconds * 1000;
        console.log(`[Sahayak TTS Notice] API rate limit reached. Cooling down Gemini TTS for ${retrySeconds}s.`);
      } else {
        console.warn(`[TTS Notice] ${errMsg.substring(0, 120)}`);
      }
      return null;
    }
  }

  // Note: Background prompt pre-warming is omitted on startup to prevent triggering 429 rate limits on free-tier API keys.

  app.post("/api/tts", async (req, res) => {
    const startTime = Date.now();
    try {
      const { text, language, voice } = req.body || {};
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const voiceName = voice || "Aoede"; // High quality female voice
      const cleanText = text.trim();
      const cacheKey = `${voiceName}:${cleanText}`;

      if (ttsAudioCache.has(cacheKey)) {
        const cachedBase64 = ttsAudioCache.get(cacheKey)!;
        const latencyMs = Date.now() - startTime;
        console.log(`[Sahayak Audio Debug] Cache HIT | Time: ${latencyMs}ms | Text: "${cleanText.substring(0, 50)}..."`);
        return res.json({
          success: true,
          audioBase64: cachedBase64,
          format: "audio/wav",
          voice: voiceName,
          engine: "Gemini TTS (Cache)",
          browserSpeechSynthesisUsed: false,
          cached: true,
          latencyMs,
        });
      }

      console.log(`[Sahayak Audio Debug]
language = ${language || "bn"}
text = "${cleanText.substring(0, 100)}"
engine = "Gemini TTS"
voice = ${voiceName}
browserSpeechSynthesisUsed = false`);

      const audioBase64 = await generateAndCacheAudio(cleanText, voiceName);
      if (!audioBase64) {
        // Return 200 with success: false and friendly reason so client handles smoothly without 500 error
        return res.json({
          success: false,
          error: "TTS_UNAVAILABLE",
          message: "Gemini TTS rate limited or unavailable",
          browserSpeechSynthesisUsed: false,
        });
      }

      const latencyMs = Date.now() - startTime;
      res.json({
        success: true,
        audioBase64,
        format: "audio/wav",
        voice: voiceName,
        engine: "Gemini TTS",
        browserSpeechSynthesisUsed: false,
        cached: false,
        latencyMs,
      });
    } catch (err: any) {
      console.warn("[Sahayak TTS API Handled Warning]:", err?.message || err);
      res.json({
        success: false,
        error: "TTS_ERROR",
        message: err?.message || "Error generating audio",
        browserSpeechSynthesisUsed: false,
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Sahayak DPI" });
  });

  // AI Grievance Draft Endpoint
  app.post("/api/generate-draft", async (req, res) => {
    const { complaintText, schemeName, language, citizenName } = req.body || {};
    const ai = getGenAI();
    const cleanScheme = schemeName || "PM-KISAN";
    const cleanName = citizenName || "[Citizen Name]";
    const cleanLang = language || "English";

    const createFallbackGrievance = () => {
      let subject = `Grievance regarding ${cleanScheme} Benefit Disbursement`;
      let draft = `Subject: ${subject}

To the Grievance Redressal Officer,
Sub-Divisional Administrative Office / CPGRAMS Nodal Cell

Respected Sir/Madam,

I am writing to formally lodge an urgent complaint regarding ${complaintText || "the delay/non-receipt of benefit disbursement under " + cleanScheme}. My registered citizen records, Aadhaar verification, and DBT-enabled bank account are fully up-to-date and compliant with government directives.

Despite timely submission and eligible status on the national portal, the disbursement remains pending. I request your prompt intervention to investigate the portal records, expedite verification, and release the pending entitlement.

Thank you for your assistance.

Sincerely,
${cleanName}
Registered Beneficiary, ${cleanScheme}`;

      if (cleanLang.toLowerCase().includes("bengali") || cleanLang === "bn") {
        subject = `${cleanScheme} প্রকল্পের আর্থিক সুবিধা প্রদান সংক্রান্ত অভিযোগ`;
        draft = `বিষয়: ${subject}

বরাবর,
অভিযোগ নিষ্পত্তি আধিকারিক,
সহকারী প্রশাসনিক দপ্তর / CPGRAMS সেল

মহাশয়/মহাশয়া,

আমি শ্রদ্ধাপূর্বক জানাচ্ছি যে, ${cleanScheme} প্রকল্পের অধীনে আমার প্রাপ্য কিস্তির টাকা এখনও পর্যন্ত আমার ব্যাঙ্ক অ্যাকাউন্টে জমা হয়নি (${complaintText || "টাকা পেতে বিলম্ব হচ্ছে"})। আমার আধার সংযোগ, ব্যাঙ্ক ডিবিটি এবং সংশ্লিষ্ট সমস্ত নথি যাচাইকৃত এবং সক্রিয় রয়েছে।

অতএব, আপনার কাছে বিনীত অনুরোধ, অনুগ্রহ করে আমার আবেদনটি দ্রুত পর্যালোচনা করুন এবং বকেয়া আর্থিক সুবিধা ছাড়ের প্রয়োজনীয় ব্যবস্থা গ্রহণ করুন।

ধন্যবাদান্তে,
${cleanName}
উপভোক্তা, ${cleanScheme}`;
      } else if (cleanLang.toLowerCase().includes("hindi") || cleanLang === "hi") {
        subject = `${cleanScheme} योजना की किस्त / लाभ न मिलने के संबंध में शिकायत`;
        draft = `विषय: ${subject}

सेवा में,
लोक शिकायत निवारण अधिकारी,
प्रशासनिक कार्यालय / CPGRAMS नोडल सेल

महोदय/महोदया,

सविनय निवेदन है कि मुझे ${cleanScheme} योजना के अंतर्गत मिलने वाली सहायता राशि अभी तक प्राप्त नहीं हुई है (${complaintText || "किस्त आने में समस्या हो रही है"})। मेरे आधार कार्ड का सत्यापन और बैंक खाता डीबीटी से विधिवत जुड़ा हुआ है।

अतः आपसे विनम्र अनुरोध है कि इस मामले की जांच कर जल्द से जल्द लंबित धनराशि जारी कराने की कृपा करें।

धन्यवाद,
${cleanName}
लाभार्थी, ${cleanScheme}`;
      }

      return { draft, subject };
    };

    if (!ai) {
      return res.json(createFallbackGrievance());
    }

    try {
      const prompt = `You are a formal civic grievance drafting assistant for the Sahayak Indian Digital Public Infrastructure (DPI) platform.
The citizen provided the following informal issue description: "${complaintText || "PM-KISAN payment not received"}"
Relevant Scheme: ${cleanScheme}
Citizen Name: ${cleanName}
Target Language: ${cleanLang}

Generate a concise, highly professional, polite, and legally standard formal complaint letter suitable for submission to CPGRAMS (Centralized Public Grievance Redress and Monitoring System - pgportal.gov.in) or State Grievance Nodal Officers.
Output format:
Subject: <Formal clear subject line>

To the Grievance Redressal Officer,

<Body paragraphs explaining the facts clearly, citing registered records, asking for verification and resolution>

Sincerely,
${cleanName}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      const draftText = response.text || "";
      const subjectMatch = draftText.match(/Subject:\s*([^\n]+)/i);
      const subject = subjectMatch ? subjectMatch[1] : `Grievance regarding ${cleanScheme}`;

      res.json({ draft: draftText, subject });
    } catch (err: any) {
      const isQuota = err?.status === 429 || String(err?.message || "").includes("429") || String(err?.message || "").includes("RESOURCE_EXHAUSTED");
      if (isQuota) {
        console.warn("Gemini rate quota reached; using localized grievance template.");
      } else {
        console.warn("AI Draft warning, using localized fallback:", err?.message || err);
      }
      res.json(createFallbackGrievance());
    }
  });

  // AI Scheme Advisor / Assistant
  app.post("/api/ask-assistant", async (req, res) => {
    const { question = "", language = "English" } = req.body || {};
    const ai = getGenAI();
    const qLower = question.toLowerCase();

    const createFallbackAssistantAnswer = () => {
      const isBn = language.toLowerCase().includes("bengali") || language === "bn";
      const isHi = language.toLowerCase().includes("hindi") || language === "hi";

      if (qLower.includes("kisan") || qLower.includes("farmer") || qLower.includes("কৃষক") || qLower.includes("किसान")) {
        if (isBn) {
          return "প্রধানমন্ত্রী কিষাণ (PM-KISAN) প্রকল্পের অধীনে কৃষকদের বছরে ₹৬,০০০ টাকা তিনটি কিস্তিতে (প্রতিটিতে ₹২,০০০) সরাসরি ব্যাঙ্ক অ্যাকাউন্টে (DBT) দেওয়া হয়। এর জন্য আধার লিঙ্কযুক্ত জমি ও সক্রিয় ব্যাঙ্ক অ্যাকাউন্ট প্রয়োজন।";
        }
        if (isHi) {
          return "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) योजना के तहत पात्र किसानों को प्रति वर्ष ₹6,000 तीन समान किस्तों में सीधे डीबीटी बैंक खाते में दिए जाते हैं। इसके लिए आधार e-KYC और भूमि रिकॉर्ड जरूरी है।";
        }
        return "Under PM-KISAN, eligible small and marginal farmers receive ₹6,000 per year in three 4-monthly installments of ₹2,000 directly via DBT into their Aadhaar-linked bank accounts.";
      }

      if (qLower.includes("ayushman") || qLower.includes("health") || qLower.includes("স্বাস্থ্য") || qLower.includes("आयुष्मान") || qLower.includes("চিকিৎসা")) {
        if (isBn) {
          return "আয়ুষ্মান ভারত (PM-JAY) প্রকল্পে প্রতি বছর পরিবার প্রতি ₹৫ লক্ষ টাকা পর্যন্ত সম্পূর্ণ বিনামূল্যে ক্যাশলেস হাসপাতালে চিকিৎসার সুবিধা পাওয়া যায়। আপনি নিকটবর্তী সিএসসি সেন্টারে গোল্ডেন কার্ড চেক করতে পারেন।";
        }
        if (isHi) {
          return "आयुष्मान भारत (PM-JAY) योजना के तहत प्रत्येक पात्र परिवार को प्रति वर्ष ₹5 लाख तक का कैशलेस स्वास्थ्य बीमा मिलता है। आप अपने राशन कार्ड या नजदीकी CSC केंद्र से आयुष्मान कार्ड बना सकते हैं।";
        }
        return "Ayushman Bharat (PM-JAY) offers up to ₹5 Lakh per family per year for secondary and tertiary cashless hospitalization across empaneled public and private hospitals.";
      }

      if (qLower.includes("pmay") || qLower.includes("house") || qLower.includes("আবাস") || qLower.includes("ঘর") || qLower.includes("आवास") || qLower.includes("मकान")) {
        if (isBn) {
          return "প্রধানমন্ত্রী আবাস যোজনা (PMAY-G) গ্রামীণ এলাকায় পাকা বাড়ি তৈরির জন্য ₹১.২০ লক্ষ থেকে ₹১.৩০ লক্ষ টাকা আর্থিক অনুদান সরাসরি ব্যাঙ্ক অ্যাকাউন্টে কিস্তিতে প্রদান করে।";
        }
        if (isHi) {
          return "प्रधानमंत्री आवास योजना (PMAY-G) के तहत ग्रामीण क्षेत्रों में पक्का मकान बनाने के लिए ₹1.20 लाख से ₹1.30 लाख तक की वित्तीय सहायता सीधे बैंक खाते में दी जाती है।";
        }
        return "PMAY-G provides direct financial assistance of ₹1.20 to ₹1.30 Lakh to eligible homeless and kutcha-house rural households to construct a pucca house.";
      }

      if (qLower.includes("scholarship") || qLower.includes("student") || qLower.includes("ছাত্র") || qLower.includes("छात्रवृत्ति") || qLower.includes("পড়াশোনা")) {
        if (isBn) {
          return "ন্যাশনাল স্কলারশিপ পোর্টাল (NSP) এবং পোস্ট-ম্যাট্রিক স্কলারশিপে বার্ষিক ₹১০,০০০ থেকে ₹২০,০০০ টাকা পর্যন্ত শিক্ষা অনুদান দেওয়া হয়। পারিবারিক বার্ষিক আয় ২.৫ লক্ষ টাকার নিচে থাকা আবশ্যক।";
        }
        if (isHi) {
          return "राष्ट्रीय छात्रवृत्ति (NSP) और पोस्ट-मैट्रिक स्कॉलरशिप के माध्यम से उच्च शिक्षा के लिए ₹10,000 से ₹20,000 तक की वित्तीय सहायता मिलती है। इसके लिए परिवार की आय ₹2.5 लाख से कम होनी चाहिए।";
        }
        return "National Scholarships provide up to ₹20,000 annually for eligible students pursuing post-matric studies with family income below ₹2.5 Lakh.";
      }

      if (isBn) {
        return "সহায়ক পোর্টালে আপনি আপনার যোগ্যতা অনুযায়ী কেন্দ্রীয় ও রাজ্য সরকারের সমস্ত জনকল্যাণমূলক প্রকল্প দেখতে পারবেন। আধার কার্ড, রেশন কার্ড ও ব্যাঙ্ক অ্যাকাউন্ট যুক্ত থাকলে আপনি সরাসরি আবেদন করতে পারেন।";
      }
      if (isHi) {
        return "सहायक पोर्टल पर आप अपनी पात्रता के अनुसार सभी केंद्र और राज्य सरकार की योजनाओं की जानकारी प्राप्त कर सकते हैं। आधार, राशन कार्ड और डीबीटी बैंक खाते के जरिए सीधे आवेदन किया जा सकता है।";
      }
      return "Sahayak helps you discover and apply for verified government welfare schemes matching your age, occupation, and income profile with direct DBT verification.";
    };

    if (!ai) {
      return res.json({ answer: createFallbackAssistantAnswer() });
    }

    try {
      const prompt = `You are Sahayak, an official Indian Digital Public Infrastructure (DPI) conversational citizen guide.
Citizen query: "${question}"
Language preference: ${language}

Provide an empathetic, plain-language, accurate answer about Indian central & state welfare schemes, required documents (Aadhaar, Land records, Bank passbook, Ration card), grievance filing on CPGRAMS, or eligibility steps. Keep it under 3-4 concise sentences.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      res.json({ answer: response.text });
    } catch (err: any) {
      const isQuota = err?.status === 429 || String(err?.message || "").includes("429") || String(err?.message || "").includes("RESOURCE_EXHAUSTED");
      if (isQuota) {
        console.warn("Gemini rate quota reached; using localized assistant response.");
      } else {
        console.warn("AI Assist warning, using fallback:", err?.message || err);
      }
      res.json({ answer: createFallbackAssistantAnswer() });
    }
  });

  // AI Civic Feed Update Explainer
  app.post("/api/explain-update", async (req, res) => {
    const { title = "", summary = "", language = "English", userProfile } = req.body || {};
    const ai = getGenAI();

    const createFallbackExplanation = () => {
      const isBn = language.toLowerCase().includes("bengali") || language === "bn";
      const isHi = language.toLowerCase().includes("hindi") || language === "hi";

      if (isBn) {
        return {
          plainSummary: summary || title || "সরকারি পোর্টাল থেকে নতুন নির্দেশিকা প্রকাশিত হয়েছে।",
          whatChanged: "অফিসিয়াল নীতি ও আবেদন যাচাইকরণ প্রক্রিয়ার হালনাগাদ ঘোষণা করা হয়েছে।",
          whoIsAffected: "সমস্ত যোগ্য নাগরিক ও সংশ্লিষ্ট প্রকল্পের উপভোক্তারা।",
          whatShouldDo: "আপনার আধার ও ব্যাঙ্ক ডিবিটি স্থিতি পরীক্ষা করুন এবং সময়সীমার মধ্যে নথি যাচাই সম্পন্ন করুন।",
        };
      }
      if (isHi) {
        return {
          plainSummary: summary || title || "सरकारी पोर्टल से नई अधिसूचना जारी की गई है।",
          whatChanged: "आधिकारिक प्रक्रिया एवं सत्यापन के नए नियम लागू किए गए हैं।",
          whoIsAffected: "सभी पात्र नागरिक एवं योजना के मौजूदा लाभार्थी।",
          whatShouldDo: "अपने आधार और डीबीटी बैंक खाते की स्थिति जांचें तथा समय पर ई-केवाईसी पूर्ण करें।",
        };
      }
      return {
        plainSummary: summary || title || "An official government circular has been announced.",
        whatChanged: "New guidelines and deadlines for verification have taken effect.",
        whoIsAffected: "Registered applicants, beneficiaries, and eligible citizens.",
        whatShouldDo: "Check your Aadhaar & DBT bank status and complete pending e-KYC before the deadline.",
      };
    };

    if (!ai) {
      return res.json(createFallbackExplanation());
    }

    try {
      const prompt = `You are the Sahayak Civic Feed assistant for Indian public welfare schemes.
Explain this official government announcement clearly to a rural/semi-urban citizen:
Title: "${title}"
Summary: "${summary}"
Citizen profile: ${JSON.stringify(userProfile || {})}
Target Language: ${language}

Respond in valid JSON with these 4 keys:
{
  "plainSummary": "<1-2 sentence simplified breakdown in target language>",
  "whatChanged": "<What officially changed or what was launched>",
  "whoIsAffected": "<Exact groups of citizens affected>",
  "whatShouldDo": "<Direct actionable steps the citizen must take>"
}
Only output the JSON object without markdown fences if possible.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      const raw = response.text || "{}";
      const cleanJson = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      let parsed = JSON.parse(cleanJson);
      if (!parsed.plainSummary) {
        parsed = createFallbackExplanation();
      }
      res.json(parsed);
    } catch (err: any) {
      const isQuota = err?.status === 429 || String(err?.message || "").includes("429") || String(err?.message || "").includes("RESOURCE_EXHAUSTED");
      if (isQuota) {
        console.warn("Gemini rate quota reached; using localized update explanation.");
      } else {
        console.warn("AI Explainer warning, using fallback:", err?.message || err);
      }
      res.json(createFallbackExplanation());
    }
  });

  // AI Voice Agent Conversational Profile Extraction & Dynamic Questioning
  app.post("/api/voice-agent-turn", async (req, res) => {
    try {
      const {
        userMessage,
        currentProfile,
        currentLanguage = "bn",
        pendingQuestionKey,
        conversationHistory,
      } = req.body;
      const ai = getGenAI();

      const langMap: Record<string, string> = {
        bn: "Bengali (বাংলা)",
        hi: "Hindi (हिंदी)",
        en: "English",
        te: "Telugu (తెలుగు)",
        ta: "Tamil (தமிழ்)",
      };
      const selectedLanguageName = langMap[currentLanguage] || "Bengali (বাংলা)";

      const prompt = `You are Sahayak, a civic assistance voice agent interviewing a citizen in India to find matching government schemes.

The citizen's selected language is: ${selectedLanguageName}.

CRITICAL ANTI-HALLUCINATION & CONVERSATION RULES:
1. You are ONLY the interviewer. The citizen is a real person answering one question at a time.
2. EXTRACT ONLY what the user explicitly said in their latest response: "${userMessage}".
3. For the question asked ("${pendingQuestionKey || "name"}"), extract ONLY that specific attribute into "extractedFields".
4. NEVER invent, assume, or auto-fill other attributes that the user has not mentioned.
5. If the user only said their name (e.g. "Rahul"), extractedFields MUST ONLY be { "name": "Rahul" }.

DYNAMIC QUESTION TREE:
- Step 1: "name" -> Next: "age"
- Step 2: "age" -> Next: "occupation"
- Step 3: "occupation":
  * If occupation is "Student":
    - DO NOT immediately ask class. First ask whether they are in School or College/University: "education_level"
    - If user says School: ask "school_class" ("আপনি কোন ক্লাসে পড়েন?"). Do NOT ask college questions.
    - If user says College / University: ask "college_course" ("আপনি কোন কোর্স বা ডিগ্রি করছেন?"). Then ask "college_year" ("আপনি এখন কোন বর্ষ বা সেমিস্টারে পড়ছেন?"). Never ask school class.
    - If user switches (School <-> College), clear conflicting fields and ask the relevant question.
  * If occupation is "Farmer": ask "income", then "ownsLand".
  * If other occupation: ask "income".
- After education/occupation: ask "income", then complete.

Current verified profile so far:
${JSON.stringify(currentProfile, null, 2)}

User's latest message: "${userMessage}"
Current question just answered: "${pendingQuestionKey || "name"}"

Respond ONLY with a valid JSON object matching this schema:
{
  "extractedFields": {
    "name"?: string,
    "age"?: string,
    "occupation"?: string,
    "income"?: string,
    "ownsLand"?: boolean,
    "state"?: string,
    "education"?: {
      "level"?: "school" | "college",
      "class"?: number | string,
      "board"?: string | null,
      "course"?: string,
      "year"?: number | string,
      "semester"?: number | string
    }
  },
  "acknowledgment": {
    "en": "Got it.",
    "bn": "বুঝেছি।",
    "hi": "समझ गया।"
  },
  "nextQuestion": {
    "key": "age" | "occupation" | "education_level" | "school_class" | "college_course" | "college_year" | "income" | "ownsLand" | "completed",
    "textEn": "...",
    "textBn": "...",
    "textHi": "...",
    "suggestedAnswers": ["Option 1", "Option 2"]
  },
  "isReadyForResults": false
}`;

      let parsed: any = null;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          const raw = response.text || "{}";
          parsed = JSON.parse(raw);
        } catch (genErr: any) {
          const isQuota = genErr?.status === 429 || String(genErr?.message || "").includes("429") || String(genErr?.message || "").includes("RESOURCE_EXHAUSTED");
          if (isQuota) {
            console.warn("Gemini rate quota reached; using deterministic voice interview state machine.");
          } else {
            console.warn("Gemini voice turn warning, using state machine fallback:", genErr?.message || genErr);
          }
          parsed = null;
        }
      }

      // If Gemini returned or if fallback is needed, run server-side deterministic verification
      const fallbackResult = createFallbackAgentTurn(userMessage, currentProfile, pendingQuestionKey, currentLanguage);

      if (!parsed || !parsed.nextQuestion) {
        parsed = fallbackResult;
      } else {
        // Strict Server-Side Sanitization of AI output
        const safeExtracted: Record<string, any> = {};

        if (pendingQuestionKey === "name" || pendingQuestionKey === "initial" || !currentProfile?.name) {
          if (parsed.extractedFields?.name) safeExtracted.name = parsed.extractedFields.name;
          else if (fallbackResult.extractedFields.name) safeExtracted.name = fallbackResult.extractedFields.name;
        } else if (pendingQuestionKey === "age") {
          if (parsed.extractedFields?.age) safeExtracted.age = parsed.extractedFields.age;
          else if (fallbackResult.extractedFields.age) safeExtracted.age = fallbackResult.extractedFields.age;
        } else if (pendingQuestionKey === "occupation") {
          if (parsed.extractedFields?.occupation) safeExtracted.occupation = parsed.extractedFields.occupation;
          else if (fallbackResult.extractedFields.occupation) safeExtracted.occupation = fallbackResult.extractedFields.occupation;
          if (fallbackResult.extractedFields.education) safeExtracted.education = fallbackResult.extractedFields.education;
        } else if (pendingQuestionKey === "education_level" || pendingQuestionKey === "school_class" || pendingQuestionKey === "college_course" || pendingQuestionKey === "college_year") {
          if (fallbackResult.extractedFields.education) {
            safeExtracted.education = fallbackResult.extractedFields.education;
          } else if (parsed.extractedFields?.education) {
            safeExtracted.education = parsed.extractedFields.education;
          }
        } else if (pendingQuestionKey === "income") {
          if (parsed.extractedFields?.income) safeExtracted.income = parsed.extractedFields.income;
          else if (fallbackResult.extractedFields.income) safeExtracted.income = fallbackResult.extractedFields.income;
        } else if (pendingQuestionKey === "ownsLand") {
          if (parsed.extractedFields?.ownsLand !== undefined) safeExtracted.ownsLand = parsed.extractedFields.ownsLand;
          else if (fallbackResult.extractedFields.ownsLand !== undefined) safeExtracted.ownsLand = fallbackResult.extractedFields.ownsLand;
        }

        parsed.extractedFields = safeExtracted;

        // Force deterministic next question step to strictly honor required tree
        parsed.nextQuestion = fallbackResult.nextQuestion;
        parsed.isReadyForResults = fallbackResult.isReadyForResults;
      }

      res.json(parsed);
    } catch (err: any) {
      console.error("AI Voice Agent Turn Error:", err);
      res.json(createFallbackAgentTurn(req.body?.userMessage, req.body?.currentProfile, req.body?.pendingQuestionKey, req.body?.currentLanguage));
    }
  });

  // Client / Server fallback rule engine
  function createFallbackAgentTurn(
    userMessage: string = "",
    profile: any = {},
    pendingKey: string = "name",
    lang: string = "bn"
  ) {
    const cleanMsg = (userMessage || "").trim();
    const newlyExtracted: Record<string, any> = {};

    // Helper to extract education details
    const extractClass = (text: string): number | string | null => {
      // Numbers
      const numMatch = text.match(/\b(class|শ্রেণি|ক্লাস|कक्षा)?\s*([1-9]|1[0-2])(?:th|st|nd|rd)?\b/i);
      if (numMatch && numMatch[2]) return parseInt(numMatch[2], 10);
      const pureNum = text.match(/\b([1-9]|1[0-2])\b/);
      if (pureNum) return parseInt(pureNum[1], 10);

      // Bengali ordinal/word classes
      if (/দশম|ten|10/i.test(text)) return 10;
      if (/একাদশ|eleven|11/i.test(text)) return 11;
      if (/দ্বাদশ|twelve|12/i.test(text)) return 12;
      if (/নবম|nine|9/i.test(text)) return 9;
      if (/অষ্টম|eight|8/i.test(text)) return 8;
      if (/সপ্তম|seven|7/i.test(text)) return 7;
      if (/ষষ্ঠ|six|6/i.test(text)) return 6;
      if (/পঞ্চম|five|5/i.test(text)) return 5;

      // Hindi
      if (/दसवीं/i.test(text)) return 10;
      if (/ग्यारहवीं/i.test(text)) return 11;
      if (/बारहवीं/i.test(text)) return 12;
      if (/नौवीं/i.test(text)) return 9;
      if (/आठवीं/i.test(text)) return 8;

      if (text.length > 0 && text.length <= 15) return text;
      return null;
    };

    const extractCourse = (text: string): string => {
      if (/b\.?sc|bsc|বিএসসি/i.test(text)) return "B.Sc.";
      if (/b\.?a\b|ba\b|বিএ\b/i.test(text)) return "B.A.";
      if (/b\.?tech|btech|b\.?e\b|engineering|ইঞ্জিনিয়ারিং/i.test(text)) return "B.Tech";
      if (/b\.?com|bcom|বিকম/i.test(text)) return "B.Com";
      if (/diploma|iti|polytechnic|ডিপ্লোমা|আইটিআই/i.test(text)) return "Diploma / ITI";
      if (/m\.?sc|msc|এমএসসি/i.test(text)) return "M.Sc.";
      if (/m\.?a\b|ma\b|এমএ/i.test(text)) return "M.A.";
      if (/mbbs|bds|medical|মেডিকেল|doctor/i.test(text)) return "MBBS";
      if (/bba|mba/i.test(text)) return "BBA / MBA";
      if (/bed|b\.ed/i.test(text)) return "B.Ed";
      if (/llb|law/i.test(text)) return "LLB (Law)";

      // Remove conversational prefix
      const cleaned = text
        .replace(/^(i am doing|i study|ami|amar|main|mai|kar raha hu|korchi|আমি|করছি|হচ্ছে)\s*/i, "")
        .replace(/(korchi|kori|kar raha hu|padh raha hu|করছি|পড়ি|পড়ছি|হচ্ছে)$/i, "")
        .trim();
      return cleaned || "B.A.";
    };

    const extractYear = (text: string): number | string => {
      if (/1st|first|প্রথম|১ম|पहला|1/i.test(text)) return 1;
      if (/2nd|second|দ্বিতীয়|২য়|दूसरा|2/i.test(text)) return 2;
      if (/3rd|third|তৃতীয়|৩য়|तीसरा|3/i.test(text)) return 3;
      if (/4th|fourth|final|চতুর্থ|৪র্থ|चौथा|अंतिम|4/i.test(text)) return 4;
      return text || 1;
    };

    // 1. Name extraction
    if (pendingKey === "name" || pendingKey === "initial" || !profile?.name) {
      const nameMatch = cleanMsg
        .replace(/^(my name is|i am|amar naam|mera naam|naam|আমার নাম|मेरा नाम|নাম|नाम)\s*:?/i, "")
        .replace(/[,।\n].*$/, "")
        .trim();
      if (nameMatch) {
        newlyExtracted.name = nameMatch;
      }
      const volunteeredAge = cleanMsg.match(/(?:বয়স|उम्र|age|years old|yr|বছর|साल)?\s*(\b\d{1,2}\b)\s*(?:years old|yr|বছর|साल)?/i);
      if (volunteeredAge && volunteeredAge[1] && cleanMsg.length > 5 && !/^\d+$/.test(nameMatch)) {
        newlyExtracted.age = volunteeredAge[1];
      }
    } else if (pendingKey === "age") {
      const num = cleanMsg.match(/\b\d{1,2}\b/);
      if (num) {
        newlyExtracted.age = num[0];
      } else {
        if (/কুড়ি|বিস|twenty|20/i.test(cleanMsg)) newlyExtracted.age = "20";
        else if (/পঁচিশ|पच्चीस|twenty five|25/i.test(cleanMsg)) newlyExtracted.age = "25";
        else if (/তিরিশ|तीस|thirty|30/i.test(cleanMsg)) newlyExtracted.age = "30";
        else if (/চল্লিশ|चालीस|forty|40/i.test(cleanMsg)) newlyExtracted.age = "40";
        else if (/পঁয়তাল্লিশ|पैंतालीस|forty five|45/i.test(cleanMsg)) newlyExtracted.age = "45";
        else if (/ষাট|साठ|sixty|60/i.test(cleanMsg)) newlyExtracted.age = "60";
        else if (cleanMsg) newlyExtracted.age = cleanMsg;
      }
    } else if (pendingKey === "occupation") {
      if (/student|study|college|school|porashona|ছাত্র|ছাত্রী|छात्र|पढाई/i.test(cleanMsg)) {
        newlyExtracted.occupation = "Student";

        // Check if user already specified school or college in the same breath
        if (/স্কুল|school|स्कूल/i.test(cleanMsg) && !/college|university|কলেজ|विश्वविद्यालय|कॉलेज/i.test(cleanMsg)) {
          const cls = extractClass(cleanMsg);
          newlyExtracted.education = {
            level: "school",
            class: cls || null,
            board: null,
          };
        } else if (/college|university|varsity|কলেজ|विश्वविद्यालय|कॉलेज|b\.?sc|b\.?a|b\.?tech/i.test(cleanMsg)) {
          const crs = /b\.?sc|b\.?a|b\.?tech|b\.?com|diploma|iti|m\.?a|m\.?sc/i.test(cleanMsg) ? extractCourse(cleanMsg) : null;
          newlyExtracted.education = {
            level: "college",
            course: crs || null,
            year: null,
            semester: null,
            institution: null,
          };
        }
      } else if (/farmer|krishi|chash|kisan|কৃষক|কৃষি|किसान|खेती/i.test(cleanMsg)) {
        newlyExtracted.occupation = "Farmer";
      } else if (/business|shop|dokandar|byabsa|ব্যবসা|व्यापार|दुकान/i.test(cleanMsg)) {
        newlyExtracted.occupation = "Self-Employed / Business";
      } else if (/artisan|craftsman|karigar|tailor|carpenter|কারিগর|कारीगर/i.test(cleanMsg)) {
        newlyExtracted.occupation = "Artisan / Craftsman";
      } else if (cleanMsg) {
        newlyExtracted.occupation = cleanMsg;
      }
    } else if (pendingKey === "education_level") {
      const isCollege = /college|university|varsity|কলেজ|বিশ্ববিদ্যালয়|कॉलेज|यूनिवर्सिटी|b\.?a|b\.?sc|b\.?tech|b\.?com|diploma|iti|m\.?a|m\.?sc|degree/i.test(cleanMsg);
      const isSchool = /school|স্কুল|স্কুলে|স্কুলে পড়ি|स्कूल|class|শ্রেণি|দশম|একাদশ|দ্বাদশ/i.test(cleanMsg) && !isCollege;

      if (isCollege) {
        const crs = /b\.?sc|b\.?a|b\.?tech|b\.?com|diploma|iti|m\.?a|m\.?sc|mbbs|degree|কোর্স|বিএসসি|বিএ/i.test(cleanMsg) ? extractCourse(cleanMsg) : null;
        newlyExtracted.education = {
          level: "college",
          course: crs,
          year: null,
          semester: null,
          institution: null,
        };
      } else {
        // Defaults to School
        const cls = extractClass(cleanMsg);
        newlyExtracted.education = {
          level: "school",
          class: cls || null,
          board: null,
        };
      }
    } else if (pendingKey === "school_class") {
      // Check if user changed their mind / corrected to college
      if (/college|university|varsity|কলেজ|বিশ্ববিদ্যালয়|कॉलेज|यूनिवर्सिटी|actually.*college|না.*কলেজ/i.test(cleanMsg)) {
        newlyExtracted.education = {
          level: "college",
          course: null,
          year: null,
          semester: null,
          institution: null,
        };
      } else {
        const cls = extractClass(cleanMsg);
        newlyExtracted.education = {
          level: "school",
          class: cls || cleanMsg,
          board: null,
        };
      }
    } else if (pendingKey === "college_course") {
      // Check if user changed their mind / corrected to school
      if (/school|স্কুল|স্কুলে|স্কুলে পড়ি|स्कूल|actually.*school|না.*স্কুল/i.test(cleanMsg)) {
        newlyExtracted.education = {
          level: "school",
          class: null,
          board: null,
        };
      } else {
        const crs = extractCourse(cleanMsg);
        newlyExtracted.education = {
          ...(profile.education || {}),
          level: "college",
          course: crs,
        };
      }
    } else if (pendingKey === "college_year") {
      // Check if user corrected to school
      if (/school|স্কুল|স্কুলে|স্কুলে পড়ি|स्कूल/i.test(cleanMsg)) {
        newlyExtracted.education = {
          level: "school",
          class: null,
          board: null,
        };
      } else {
        const yr = extractYear(cleanMsg);
        newlyExtracted.education = {
          ...(profile.education || {}),
          level: "college",
          year: yr,
        };
      }
    } else if (pendingKey === "income") {
      if (cleanMsg) newlyExtracted.income = cleanMsg;
    } else if (pendingKey === "ownsLand") {
      const lower = cleanMsg.toLowerCase();
      if (lower.includes("yes") || lower.includes("হ্যাঁ") || lower.includes("हाँ") || lower.includes("ache") || lower.includes("আছে")) {
        newlyExtracted.ownsLand = true;
      } else {
        newlyExtracted.ownsLand = false;
      }
    }

    const merged = { ...(profile || {}), ...newlyExtracted };
    if (newlyExtracted.education) {
      merged.education = newlyExtracted.education;
    }

    const isStudent =
      (merged.occupation || "").toLowerCase().includes("student") ||
      (merged.occupation || "").toLowerCase().includes("study") ||
      (merged.occupation || "").toLowerCase().includes("college") ||
      (merged.occupation || "").toLowerCase().includes("school") ||
      (merged.occupation || "").toLowerCase().includes("ছাত্র");

    // Strict sequential state evaluation
    let nextKey = "name";
    let isReady = false;

    if (!merged.name || String(merged.name).trim().length === 0) {
      nextKey = "name";
    } else if (!merged.age || String(merged.age).trim().length === 0) {
      nextKey = "age";
    } else if (!merged.occupation || String(merged.occupation).trim().length === 0) {
      nextKey = "occupation";
    } else if (isStudent && !merged.education?.level) {
      nextKey = "education_level";
    } else if (isStudent && merged.education?.level === "school" && (!merged.education.class || String(merged.education.class).trim().length === 0)) {
      nextKey = "school_class";
    } else if (isStudent && merged.education?.level === "college" && (!merged.education.course || String(merged.education.course).trim().length === 0)) {
      nextKey = "college_course";
    } else if (isStudent && merged.education?.level === "college" && merged.education.course && !merged.education.year && !merged.education.semester) {
      nextKey = "college_year";
    } else if (!merged.income || String(merged.income).trim().length === 0) {
      nextKey = "income";
    } else if (merged.occupation === "Farmer" && merged.ownsLand === undefined) {
      nextKey = "ownsLand";
    } else {
      isReady = true;
      nextKey = "completed";
    }

    const userName = merged.name || "";

    const questionMap: Record<string, any> = {
      name: {
        key: "name",
        textEn: "What is your name? What should I call you?",
        textBn: "আপনার নাম কী? প্রথমে আপনার নামটা বলুন।",
        textHi: "आपका नाम क्या है? पहले अपना नाम बताएँ।",
        suggestedAnswers: ["Rahul", "Priya", "Amit"],
      },
      age: {
        key: "age",
        textEn: userName ? `Nice to meet you, ${userName}! How old are you?` : "How old are you?",
        textBn: userName ? `ধন্যবাদ ${userName}। আপনার বয়স কত?` : "আপনার বয়স কত?",
        textHi: userName ? `धन्यवाद ${userName}। आपकी उम्र कितनी है?` : "आपकी उम्र कितनी है?",
        suggestedAnswers: ["20", "25", "35", "45", "60"],
      },
      occupation: {
        key: "occupation",
        textEn: "What do you currently do — student, farmer, business, artisan, or job?",
        textBn: "আপনি বর্তমানে কী করেন — পড়াশোনা, চাষাবাদ, ব্যবসা, কারিগরি কাজ, নাকি চাকরি?",
        textHi: "आप वर्तमान में क्या करते हैं — पढ़ाई, खेती, व्यापार, कारीगरी, या नौकरी?",
        suggestedAnswers: ["Student (ছাত্র)", "Farmer (কৃষক)", "Business (ব্যবসা)", "Artisan (কারিগর)"],
      },
      education_level: {
        key: "education_level",
        textEn: "Are you currently in school or college/university?",
        textBn: "আপনি স্কুলে পড়েন, নাকি কলেজ/বিশ্ববিদ্যালয়ে?",
        textHi: "आप स्कूल में पढ़ते हैं या कॉलेज/यूनिवर्सिटी में?",
        suggestedAnswers: ["স্কুলে পড়ি (School)", "কলেজে পড়ি (College/Univ)"],
      },
      school_class: {
        key: "school_class",
        textEn: "Which class are you in?",
        textBn: "আপনি কোন ক্লাসে পড়েন?",
        textHi: "आप किस कक्षा में पढ़ते हैं?",
        suggestedAnswers: ["Class 9 (নবম শ্রেণি)", "Class 10 (দশম শ্রেণি)", "Class 11 (একাদশ)", "Class 12 (দ্বাদশ)"],
      },
      college_course: {
        key: "college_course",
        textEn: "Which course or degree are you pursuing?",
        textBn: "আপনি কোন কোর্স বা ডিগ্রি করছেন?",
        textHi: "आप कौन सा कोर्स या डिग्री कर रहे हैं?",
        suggestedAnswers: ["B.A.", "B.Sc.", "B.Tech", "B.Com", "Diploma / ITI", "M.A. / M.Sc."],
      },
      college_year: {
        key: "college_year",
        textEn: "Which year or semester are you in?",
        textBn: "আপনি এখন কোন বর্ষ বা সেমিস্টারে পড়ছেন?",
        textHi: "आप अभी किस वर्ष या सेमेस्टर में हैं?",
        suggestedAnswers: ["১ম বর্ষ (1st Year)", "২য় বর্ষ (2nd Year)", "৩য় বর্ষ (3rd Year)", "৪র্থ বর্ষ (4th Year)"],
      },
      income: {
        key: "income",
        textEn: "What is your approximate annual family income?",
        textBn: "আপনার পরিবারের আনুমানিক বার্ষিক আয় কত?",
        textHi: "आपके परिवार की अनुमानित वार्षिक आय कितनी है?",
        suggestedAnswers: ["Under ₹50,000", "₹1.5 Lakh", "₹2.5 Lakhs+", "BPL (দারিদ্র্যসীমার নিচে)"],
      },
      ownsLand: {
        key: "ownsLand",
        textEn: "Do you own cultivable agricultural land?",
        textBn: "আপনার কি নিজস্ব চাষযোগ্য কৃষিজমি আছে?",
        textHi: "क्या आपके पास अपनी खेती योग्य कृषि भूमि है?",
        suggestedAnswers: ["Yes (হ্যাঁ, আছে)", "No (না, নেই)"],
      },
      completed: {
        key: "completed",
        textEn: "Thank you! Based on your details, I have found relevant government schemes for you.",
        textBn: "ধন্যবাদ। আপনার দেওয়া তথ্যের ভিত্তিতে আমি কিছু প্রাসঙ্গিক সরকারি প্রকল্প খুঁজে পেয়েছি।",
        textHi: "धन्यवाद। आपके द्वारा दी गई जानकारी के आधार पर मुझे कुछ उपयुक्त सरकारी योजनाएँ मिली हैं।",
        suggestedAnswers: ["View Matching Schemes"],
      },
    };

    return {
      extractedFields: newlyExtracted,
      acknowledgment: {
        en: userName ? `Thanks, ${userName}.` : "Understood.",
        bn: userName ? `ধন্যবাদ, ${userName}।` : "বুঝতে পেরেছি।",
        hi: userName ? `धन्यवाद, ${userName}।` : "समझ गया।",
      },
      nextQuestion: questionMap[nextKey] || questionMap.completed,
      isReadyForResults: isReady,
    };
  }

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sahayak DPI platform running on http://localhost:${PORT}`);
  });
}

startServer();
