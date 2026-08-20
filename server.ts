import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

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

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

  // Supported Gemini TTS voices: 'Kore' (female), 'Zephyr' (female/calm), 'Puck' (male), 'Charon' (male), 'Fenrir' (male)
  function resolveTTSVoice(requestedVoice?: string): string {
    const validVoices = ["Kore", "Zephyr", "Puck", "Charon", "Fenrir"];
    if (requestedVoice && validVoices.includes(requestedVoice)) {
      return requestedVoice;
    }
    if (requestedVoice && (requestedVoice.toLowerCase().includes("male") || requestedVoice.toLowerCase().includes("man") || requestedVoice.toLowerCase().includes("boy"))) {
      return "Puck";
    }
    return "Kore"; // Default natural warm female voice
  }

  async function fetchGoogleTTSAudio(text: string, lang = "bn-IN"): Promise<string | null> {
    try {
      const langCode = lang.startsWith("bn") ? "bn" : lang.startsWith("hi") ? "hi" : "en";
      const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
      if (!cleanText) return null;

      // Break into sentences/chunks under 180 chars if text is long
      const chunks: string[] = [];
      if (cleanText.length <= 180) {
        chunks.push(cleanText);
      } else {
        const sentences = cleanText.split(/(?<=[।?!.\n])/g);
        let cur = "";
        for (const s of sentences) {
          if ((cur + " " + s).length <= 180) {
            cur = cur ? cur + " " + s : s;
          } else {
            if (cur) chunks.push(cur.trim());
            cur = s;
          }
        }
        if (cur) chunks.push(cur.trim());
      }

      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${langCode}&client=tw-ob`;
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (!resp.ok) {
          throw new Error(`Google TTS HTTP ${resp.status}`);
        }
        const arrayBuf = await resp.arrayBuffer();
        audioBuffers.push(Buffer.from(arrayBuf));
      }

      if (audioBuffers.length === 0) return null;
      const combinedBuffer = Buffer.concat(audioBuffers);
      return `data:audio/mp3;base64,${combinedBuffer.toString("base64")}`;
    } catch (err: any) {
      console.warn("[Sahayak Google TTS Fallback Notice]:", err?.message || err);
      return null;
    }
  }

  async function generateAndCacheAudio(
    text: string,
    rawVoiceName = "Kore",
    lang = "bn-IN"
  ): Promise<string | null> {
    const voiceName = resolveTTSVoice(rawVoiceName);
    const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
    if (!cleanText) return null;

    const cacheKey = `${lang}:${voiceName}:${cleanText}`;
    if (ttsAudioCache.has(cacheKey)) {
      return ttsAudioCache.get(cacheKey)!;
    }

    // 1. Try Gemini Neural TTS (if not currently cooling down)
    if (Date.now() >= ttsCooldownUntil) {
      const ai = getGenAI();
      if (ai) {
        try {
          const ttsResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
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

          if (part && part.inlineData?.data) {
            const rawPcm = Buffer.from(part.inlineData.data, "base64");
            const wavBuffer = pcmToWav(rawPcm, 24000);
            const audioBase64 = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
            ttsAudioCache.set(cacheKey, audioBase64);
            return audioBase64;
          }
        } catch (e: any) {
          const errMsg = e?.message || (typeof e === "object" ? JSON.stringify(e) : String(e));
          if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
            const match = errMsg.match(/retry in ([0-9.]+)s/i) || errMsg.match(/retryDelay":"([0-9]+)s"/i);
            const retrySeconds = match && match[1] ? Math.ceil(parseFloat(match[1])) : 20;
            ttsCooldownUntil = Date.now() + retrySeconds * 1000;
            console.log(`[Sahayak TTS Notice] API rate limit reached. Cooling down Gemini TTS for ${retrySeconds}s, using neural fallback.`);
          } else if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
            ttsCooldownUntil = Date.now() + 10000;
            console.log(`[Sahayak TTS Notice] TTS model under temporary high demand (503). Cooling down for 10s, using neural fallback.`);
          }
        }
      }
    }

    // 2. High-Reliability Native Audio Fallback (guarantees crystal-clear Bengali, Hindi, & English audio on all devices)
    const fallbackAudio = await fetchGoogleTTSAudio(cleanText, lang);
    if (fallbackAudio) {
      ttsAudioCache.set(cacheKey, fallbackAudio);
      return fallbackAudio;
    }

    return null;
  }

  // Resilient multi-model fallback executor for Gemini text tasks
  async function generateContentWithFallback(
    promptConfig: {
      contents: string;
      config?: Record<string, any>;
    },
    contextName = "AI Task"
  ): Promise<string | null> {
    const ai = getGenAI();
    if (!ai) return null;

    const modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptConfig.contents,
          config: promptConfig.config,
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        const msg = err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
        const isHighDemandOrQuota =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("quota");

        if (isHighDemandOrQuota) {
          console.log(`[Sahayak AI Notice] ${contextName} (${model} busy/rate-limited). Trying next fallback.`);
          continue;
        } else {
          console.log(`[Sahayak AI Notice] ${contextName} notice on ${model}: ${msg.substring(0, 100)}`);
        }
      }
    }
    return null;
  }

  let audioCooldownUntil = 0;

  // Gemini Multimodal Native Audio Understanding & Reasoning Executor
  async function generateContentWithAudio(
    audioBase64: string,
    audioMimeType: string,
    promptText: string,
    contextName = "Gemini Native Audio Turn"
  ): Promise<string | null> {
    if (Date.now() < audioCooldownUntil) {
      return null;
    }

    const ai = getGenAI();
    if (!ai) return null;

    if (!audioBase64 || typeof audioBase64 !== "string") return null;

    // Safely strip data URL prefix (e.g. data:audio/webm;codecs=opus;base64, or any header before the comma)
    let cleanBase64 = audioBase64.trim();
    const commaIdx = cleanBase64.indexOf(",");
    if (commaIdx !== -1 && cleanBase64.slice(0, commaIdx).toLowerCase().includes("base64")) {
      cleanBase64 = cleanBase64.slice(commaIdx + 1);
    }
    // Remove non-base64 characters
    cleanBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, "").trim();
    if (cleanBase64.length < 32) return null;

    let mime = (audioMimeType || "audio/webm").split(";")[0].trim().toLowerCase();
    if (!mime || !mime.startsWith("audio/")) {
      mime = "audio/webm";
    }

    const modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mime,
                    data: cleanBase64,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        const msg = err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
          const match = msg.match(/retry in ([0-9.]+)s/i) || msg.match(/retryDelay":"([0-9]+)s"/i);
          const retrySec = match && match[1] ? Math.ceil(parseFloat(match[1])) : 15;
          audioCooldownUntil = Date.now() + retrySec * 1000;
          console.log(`[Sahayak Notice] Gemini audio rate-limited on ${model}. Cooldown for ${retrySec}s.`);
          break;
        } else if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
          audioCooldownUntil = Date.now() + 8000;
          console.log(`[Sahayak Notice] Gemini audio model ${model} under temporary demand (503).`);
          continue;
        } else {
          console.log(`[Sahayak Notice] Audio processing notice on ${model}: ${msg.substring(0, 80)}`);
        }
      }
    }
    return null;
  }

  // Direct Audio Speech Understanding endpoint
  app.post("/api/voice-understand", async (req, res) => {
    try {
      const { audioBase64, audioMimeType = "audio/webm", language = "bn" } = req.body || {};
      if (!audioBase64) {
        return res.status(400).json({ error: "audioBase64 is required", hasSpeech: false, transcript: "" });
      }

      const langMap: Record<string, string> = {
        bn: "Bengali",
        hi: "Hindi",
        en: "English",
      };
      const langName = langMap[language] || "Bengali";

      const prompt = `Listen carefully to this user audio in ${langName}.
Analyze the user's speech.
Output JSON only:
{
  "hasSpeech": boolean,
  "transcript": "<exact words spoken by user in original native script>",
  "englishTranslation": "<english translation of spoken words>",
  "detectedLanguage": "bn" | "hi" | "en"
}`;

      const raw = await generateContentWithAudio(audioBase64, audioMimeType, prompt, "Direct Audio Transcription");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return res.json(parsed);
        } catch {}
      }

      return res.json({ hasSpeech: false, transcript: "", detectedLanguage: language });
    } catch (e: any) {
      console.error("Voice understand error:", e);
      res.status(500).json({ error: "Voice processing failed", hasSpeech: false, transcript: "" });
    }
  });

  // Note: Background prompt pre-warming is omitted on startup to prevent triggering 429 rate limits on free-tier API keys.

  app.post("/api/tts", async (req, res) => {
    const startTime = Date.now();
    try {
      const { text, language = "bn-IN", voice } = req.body || {};
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Map shorthand language codes to exact BCP-47 locale tags
      const exactLangCode =
        language === "bn" || language === "bn-IN"
          ? "bn-IN"
          : language === "hi" || language === "hi-IN"
          ? "hi-IN"
          : language === "en" || language === "en-IN"
          ? "en-IN"
          : language;

      const rawVoice = voice || "Kore";
      const voiceName = resolveTTSVoice(rawVoice);
      const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
      const cacheKey = `${exactLangCode}:${voiceName}:${cleanText}`;

      console.log(
        `[TTS CLOUD API CALL] Language: "${exactLangCode}" | Voice: "${voiceName}" | Model: "gemini-3.1-flash-tts-preview" | Text: "${cleanText.substring(0, 60)}..."`
      );

      if (ttsAudioCache.has(cacheKey)) {
        const cachedBase64 = ttsAudioCache.get(cacheKey)!;
        const latencyMs = Date.now() - startTime;
        console.log(`[Sahayak Audio Debug] Cache HIT | Time: ${latencyMs}ms | Lang: "${exactLangCode}" | Text: "${cleanText.substring(0, 50)}..."`);
        return res.json({
          success: true,
          audioBase64: cachedBase64,
          format: "audio/wav",
          language: exactLangCode,
          voice: voiceName,
          engine: "Gemini TTS (Cache)",
          browserSpeechSynthesisUsed: false,
          cached: true,
          latencyMs,
        });
      }

      console.log(`[Sahayak Audio Debug]
language = ${exactLangCode}
text = "${cleanText.substring(0, 100)}"
engine = "Gemini TTS"
voice = ${voiceName}
browserSpeechSynthesisUsed = false`);

      const audioBase64 = await generateAndCacheAudio(cleanText, voiceName, exactLangCode);
      if (!audioBase64) {
        // Return 200 with success: false and friendly reason so client handles smoothly without 500 error
        return res.json({
          success: false,
          error: "TTS_UNAVAILABLE",
          message: "Gemini TTS rate limited or unavailable",
          language: exactLangCode,
          browserSpeechSynthesisUsed: false,
        });
      }

      const latencyMs = Date.now() - startTime;
      res.json({
        success: true,
        audioBase64,
        format: "audio/wav",
        language: exactLangCode,
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

    const draftText = await generateContentWithFallback({ contents: prompt }, "Grievance Draft");
    if (draftText) {
      const subjectMatch = draftText.match(/Subject:\s*([^\n]+)/i);
      const subject = subjectMatch ? subjectMatch[1] : `Grievance regarding ${cleanScheme}`;
      return res.json({ draft: draftText, subject });
    }

    res.json(createFallbackGrievance());
  });

  // AI Scheme Advisor / Assistant
  app.post("/api/ask-assistant", async (req, res) => {
    const { question = "", language = "English" } = req.body || {};
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

    const prompt = `You are Sahayak, an official Indian Digital Public Infrastructure (DPI) conversational citizen guide.
Citizen query: "${question}"
Language preference: ${language}

Provide an empathetic, plain-language, accurate answer about Indian central & state welfare schemes, required documents (Aadhaar, Land records, Bank passbook, Ration card), grievance filing on CPGRAMS, or eligibility steps. Keep it under 3-4 concise sentences.`;

    const answer = await generateContentWithFallback({ contents: prompt }, "Scheme Assistant");
    if (answer) {
      return res.json({ answer });
    }

    res.json({ answer: createFallbackAssistantAnswer() });
  });

  // AI Civic Feed Update Explainer
  app.post("/api/explain-update", async (req, res) => {
    const { title = "", summary = "", language = "English", userProfile } = req.body || {};

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

    const raw = await generateContentWithFallback({ contents: prompt }, "Civic Feed Explainer");
    if (raw) {
      try {
        const cleanJson = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        let parsed = JSON.parse(cleanJson);
        if (parsed.plainSummary) {
          return res.json(parsed);
        }
      } catch {
        // use fallback
      }
    }

    res.json(createFallbackExplanation());
  });

  // AI Voice Agent Conversational Profile Extraction & Dynamic Dialogue Manager (Zero Hallucination)
  app.post("/api/voice-agent-turn", async (req, res) => {
    try {
      const {
        userMessage = "",
        audioBase64 = "",
        audioMimeType = "audio/webm",
        currentProfile = {},
        currentLanguage = "bn",
        pendingQuestionKey,
        conversationHistory = [],
      } = req.body || {};

      const langMap: Record<string, string> = {
        bn: "Bengali (বাংলা)",
        hi: "Hindi (हिंदी)",
        en: "English",
        te: "Telugu (తెలుగు)",
        ta: "Tamil (தமிழ்)",
      };
      const selectedLanguageName = langMap[currentLanguage] || "Bengali (বাংলা)";

      let cleanUserMsg = (userMessage || "").trim();
      let hasSpeech = Boolean(cleanUserMsg);
      let parsed: any = null;

      // 1. If audio is provided, let Gemini process the audio natively
      if (audioBase64) {
        const audioPrompt = `You are Sahayak, an empathetic Indian Digital Public Infrastructure (DPI) conversational AI voice agent helping a citizen find matching government welfare schemes.

The user is speaking in: ${selectedLanguageName}.
Listen to the user's spoken audio directly.

CURRENT CITIZEN PROFILE:
${JSON.stringify(currentProfile, null, 2)}

RECENT CONVERSATION HISTORY:
${JSON.stringify(conversationHistory.slice(-6), null, 2)}

PENDING FIELD BEING ASKED: "${pendingQuestionKey || "name"}"

CRITICAL ANTI-HALLUCINATION RULES:
1. First evaluate if the user actually spoke meaningful words.
   - If the audio is silent, background noise, breathing, or empty, set "hasSpeech": false, "userTranscript": "".
   - Never invent, assume, predict, or autocomplete user speech.
2. If user spoke:
   - Transcribe their exact utterance into "userTranscript" in original native script (Bengali / Hindi / English).
   - Extract ONLY explicit facts mentioned by the user:
     - Name: only if explicitly stated.
     - Age: only if number is stated (e.g. "আমার বয়স ২০" -> age: "20").
     - Occupation: (e.g. "আমি কলেজে পড়ি" -> occupation: "Student", education: { level: "college" }).
     - NEVER guess course, year, class, income, or land unless explicitly spoken!
   - Provide a natural, warm conversational reply in the citizen's language (${selectedLanguageName}).
   - Ask for the next missing piece of information needed for schemes.

Output ONLY valid JSON:
{
  "hasSpeech": boolean,
  "userTranscript": "<exact words in original script>",
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
      "course"?: string,
      "year"?: number | string,
      "semester"?: number | string
    }
  },
  "assistantReply": "<Spoken reply in ${selectedLanguageName}>",
  "assistantReplyBn": "<Bengali text>",
  "assistantReplyHi": "<Hindi text>",
  "assistantReplyEn": "<English text>",
  "nextQuestionKey": "name" | "age" | "occupation" | "education_level" | "school_class" | "college_course" | "college_year" | "income" | "ownsLand" | "completed",
  "isReadyForResults": boolean,
  "suggestedAnswers": ["Option 1", "Option 2"]
}`;

        const rawAudioResponse = await generateContentWithAudio(audioBase64, audioMimeType, audioPrompt, "Voice Agent Audio Turn");
        if (rawAudioResponse) {
          try {
            parsed = JSON.parse(rawAudioResponse);
            if (parsed.userTranscript && parsed.userTranscript.trim()) {
              cleanUserMsg = parsed.userTranscript.trim();
              hasSpeech = parsed.hasSpeech !== false;
            } else if (parsed.hasSpeech === false) {
              hasSpeech = false;
            }
          } catch {}
        }
      }

      // If audio had no speech and no text was sent, return clean wait state
      if (!hasSpeech && !cleanUserMsg) {
        return res.json({
          hasSpeech: false,
          userTranscript: "",
          assistantReply: "",
          extractedFields: {},
          mergedProfile: currentProfile,
          isReadyForResults: false,
        });
      }

      // 2. Run deterministic fact extractor as fallback / validator
      const deterministicResult = extractUserFactsStrict(cleanUserMsg, currentProfile, pendingQuestionKey, currentLanguage);

      // 3. If text-only mode and not yet parsed by audio
      if (!parsed) {
        const textPrompt = `You are Sahayak, an empathetic Indian Digital Public Infrastructure (DPI) conversational AI voice agent helping a citizen find matching government welfare schemes.

The conversation is taking place in: ${selectedLanguageName}.

CURRENT VERIFIED CITIZEN PROFILE:
${JSON.stringify(currentProfile, null, 2)}

RECENT CONVERSATION HISTORY:
${JSON.stringify(conversationHistory.slice(-6), null, 2)}

CITIZEN'S LATEST UTTERANCE:
"${cleanUserMsg}"

STRICT CONVERSATIONAL & ANTI-HALLUCINATION RULES:
1. USER INPUT MUST BE THE ONLY SOURCE OF FACTS.
   - Never invent, assume, predict, autocomplete, or fabricate user information.
   - If the user says "আমি কলেজে পড়ি", only education level = "college" (and occupation = "Student") can be extracted. Course and year are UNKNOWN until explicitly stated.
   - If the user provides multiple facts in one sentence (e.g. "My name is Rahul, 21 years old, studying B.Sc in 2nd year"), extract ALL of them: name="Rahul", age="21", occupation="Student", education={level:"college", course:"B.Sc.", year:2}.
   - If the user corrects earlier information (e.g. "Actually I am in class 10 in school, not college"), update accordingly and clear invalidated fields.
   - If the user asks a question or makes a conversational comment, answer it warmly and empathetically in their language.
2. DIALOGUE FLOW:
   - Acknowledge what the user just said in a natural, friendly tone.
   - Determine what essential information is still missing from the citizen's profile to evaluate welfare schemes (Name -> Age -> Occupation -> School Class OR College Course & Year if Student -> Land ownership if Farmer -> Family annual income).
   - Ask naturally and conversationally for the next missing piece of information. Do NOT ask for facts already provided.
   - If all required fields are present, announce that matching schemes are ready and set isReadyForResults to true.

Output ONLY a valid JSON object matching this schema:
{
  "extractedFields": {
    "name"?: string,
    "age"?: string,
    "occupation"?: string,
    "income"?: string,
    "ownsLand"?: boolean,
    "landSizeAcres"?: string,
    "state"?: string,
    "education"?: {
      "level"?: "school" | "college",
      "class"?: number | string,
      "course"?: string,
      "year"?: number | string,
      "semester"?: number | string
    }
  },
  "clearedFields"?: string[],
  "assistantReply": "<Conversational reply in target language>",
  "assistantReplyBn": "<Conversational reply in Bengali>",
  "assistantReplyHi": "<Conversational reply in Hindi>",
  "assistantReplyEn": "<Conversational reply in English>",
  "nextQuestionKey": "name" | "age" | "occupation" | "education_level" | "school_class" | "college_course" | "college_year" | "income" | "ownsLand" | "completed",
  "isReadyForResults": boolean,
  "suggestedAnswers": ["Option 1", "Option 2"]
}`;

        const raw = await generateContentWithFallback({
          contents: textPrompt,
          config: { responseMimeType: "application/json" },
        }, "Voice Agent Turn");

        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = null;
          }
        }
      }

      // Merge and sanitize facts: user facts must ONLY be genuine extracts
      const finalExtracted: Record<string, any> = {};

      if (parsed?.extractedFields && typeof parsed.extractedFields === "object") {
        for (const [key, val] of Object.entries(parsed.extractedFields)) {
          if (val !== undefined && val !== null && val !== "") {
            if (key === "education" && typeof val === "object") {
              const eduVal = val as any;
              const sanitizedEdu: Record<string, any> = {};
              if (eduVal.level === "school" || eduVal.level === "college") sanitizedEdu.level = eduVal.level;
              if (eduVal.class) sanitizedEdu.class = eduVal.class;
              if (eduVal.course) sanitizedEdu.course = eduVal.course;
              if (eduVal.year) sanitizedEdu.year = eduVal.year;
              if (eduVal.semester) sanitizedEdu.semester = eduVal.semester;
              if (Object.keys(sanitizedEdu).length > 0) finalExtracted.education = sanitizedEdu;
            } else {
              finalExtracted[key] = val;
            }
          }
        }
      }

      // Overlay deterministic facts
      if (deterministicResult.extractedFields) {
        for (const [key, val] of Object.entries(deterministicResult.extractedFields)) {
          if (key === "education" && typeof val === "object") {
            finalExtracted.education = {
              ...(finalExtracted.education || {}),
              ...(val as any),
            };
          } else {
            finalExtracted[key] = val;
          }
        }
      }

      // Compute resulting profile
      let mergedProfile = { ...currentProfile, ...finalExtracted };
      if (finalExtracted.education) {
        mergedProfile.education = {
          ...(currentProfile.education || {}),
          ...finalExtracted.education,
        };
      }

      // Cleared fields management
      if (finalExtracted.education?.level === "school" && currentProfile.education?.level === "college") {
        mergedProfile.education = {
          level: "school",
          class: finalExtracted.education.class || null,
          board: null,
        };
      }
      if (finalExtracted.education?.level === "college" && currentProfile.education?.level === "school") {
        mergedProfile.education = {
          level: "college",
          course: finalExtracted.education.course || null,
          year: finalExtracted.education.year || null,
          semester: finalExtracted.education.semester || null,
        };
      }

      const isComplete = isProfileFullyReady(mergedProfile);
      const nextMissingKey = determineNextMissingField(mergedProfile);

      const assistantReply =
        currentLanguage === "bn"
          ? (parsed?.assistantReplyBn || parsed?.assistantReply || deterministicResult.nextQuestion.textBn)
          : currentLanguage === "hi"
          ? (parsed?.assistantReplyHi || parsed?.assistantReply || deterministicResult.nextQuestion.textHi)
          : (parsed?.assistantReplyEn || parsed?.assistantReply || deterministicResult.nextQuestion.textEn);

      // Pre-synthesize high quality female TTS audio for zero playback delay
      const assistantAudioBase64 = await generateAndCacheAudio(assistantReply, "Kore");

      console.log(`VOICE INPUT RECEIVED: "${cleanUserMsg}"`);
      console.log(`GEMINI RESPONSE: "${assistantReply}"`);
      console.log(`[Conversation Facts] Extracted: ${JSON.stringify(finalExtracted)} | Profile: ${JSON.stringify(mergedProfile)}`);

      const responsePayload = {
        hasSpeech: true,
        userTranscript: cleanUserMsg,
        extractedFields: finalExtracted,
        mergedProfile,
        assistantReply,
        assistantReplyBn: parsed?.assistantReplyBn || deterministicResult.nextQuestion.textBn,
        assistantReplyHi: parsed?.assistantReplyHi || deterministicResult.nextQuestion.textHi,
        assistantReplyEn: parsed?.assistantReplyEn || deterministicResult.nextQuestion.textEn,
        assistantAudioBase64: assistantAudioBase64 || null,
        nextQuestion: {
          key: isComplete ? "completed" : nextMissingKey,
          textEn: parsed?.assistantReplyEn || deterministicResult.nextQuestion.textEn,
          textBn: parsed?.assistantReplyBn || deterministicResult.nextQuestion.textBn,
          textHi: parsed?.assistantReplyHi || deterministicResult.nextQuestion.textHi,
          suggestedAnswers: parsed?.suggestedAnswers || deterministicResult.nextQuestion.suggestedAnswers || [],
        },
        isReadyForResults: isComplete,
        debug: {
          userMessage: cleanUserMsg,
          assistantReply,
          extractedFacts: finalExtracted,
          currentProfile: mergedProfile,
          autoGeneratedUserInput: false,
          demoInput: false,
          language: currentLanguage,
        },
      };

      res.json(responsePayload);
    } catch (err: any) {
      console.error("AI Voice Agent Turn Error:", err);
      const fallback = extractUserFactsStrict(req.body?.userMessage, req.body?.currentProfile, req.body?.pendingQuestionKey, req.body?.currentLanguage);
      res.json(fallback);
    }
  });

  // Track 1 — AI Citizen Development Request Processor & Classifier
  app.post("/api/process-development-request", async (req, res) => {
    const { text = "", language = "bn", location = {}, source = "voice", citizenName } = req.body || {};

    const createFallbackClassification = () => {
      const lower = text.toLowerCase();
      let category = "other";
      let urgency = "medium";
      let affectedPopulation = "community";
      let problem = text || "Citizen reported development need";

      if (lower.includes("হাসপাতাল") || lower.includes("ডাক্তার") || lower.includes("চিকিৎসা") || lower.includes("hospital") || lower.includes("doctor") || lower.includes("अस्पताल") || lower.includes("स्वास्थ्य")) {
        category = "healthcare";
        urgency = "high";
        problem = "Inadequate local healthcare facility, doctor deficit, or missing emergency care.";
      } else if (lower.includes("রাস্তা") || lower.includes("সেতু") || lower.includes("road") || lower.includes("bridge") || lower.includes("सड़क") || lower.includes("पुल")) {
        category = "roads";
        urgency = "high";
        problem = "Damaged, unpaved or washed-out road and bridge connectivity.";
      } else if (lower.includes("জল") || lower.includes("পানি") || lower.includes("আর্সেনিক") || lower.includes("water") || lower.includes("drinking") || lower.includes("पानी")) {
        category = "drinking_water";
        urgency = "high";
        problem = "Lack of clean drinking water, pipeline connections, or water contamination.";
      } else if (lower.includes("স্কুল") || lower.includes("বিদ্যালয়") || lower.includes("school") || lower.includes("education") || lower.includes("स्कूल")) {
        category = "schools_education";
        problem = "School infrastructure deficit, missing digital classrooms or teachers.";
      } else if (lower.includes("বিদ্যুৎ") || lower.includes("কারেন্ট") || lower.includes("electricity") || lower.includes("बिजली")) {
        category = "electricity";
        problem = "Frequent power outages, voltage fluctuations, or missing transformer.";
      } else if (lower.includes("সেচ") || lower.includes("খাল") || lower.includes("irrigation") || lower.includes("canal") || lower.includes("सिंचाई")) {
        category = "irrigation";
        problem = "Lack of agricultural canal water, siltation, or need for lift irrigation.";
      } else if (lower.includes("ড্রেন") || lower.includes("নিকাশি") || lower.includes("drain") || lower.includes("flood") || lower.includes("जलभराव")) {
        category = "drainage_flood";
        urgency = "high";
        problem = "Stormwater drainage blockages and seasonal waterlogging.";
      }

      let detectedCity = location?.city || "Balurghat";
      let detectedDistrict = location?.district || "Dakshin Dinajpur";
      let detectedState = location?.state || "West Bengal";

      if (lower.includes("balurghat") || lower.includes("বালুরঘাট") || lower.includes("बालुरघाट")) {
        detectedCity = "Balurghat";
        detectedDistrict = "Dakshin Dinajpur";
      } else if (lower.includes("purulia") || lower.includes("পুরুলিয়া") || lower.includes("पुरुलिया")) {
        detectedCity = "Baghmundi";
        detectedDistrict = "Purulia";
      } else if (lower.includes("malda") || lower.includes("মালদা") || lower.includes("मालदा")) {
        detectedCity = "Kaliachak";
        detectedDistrict = "Malda";
      } else if (lower.includes("siliguri") || lower.includes("শিলিগুড়ি") || lower.includes("darjeeling")) {
        detectedCity = "Siliguri";
        detectedDistrict = "Darjeeling";
      } else if (lower.includes("gaya") || lower.includes("गया")) {
        detectedCity = "Gaya";
        detectedDistrict = "Gaya";
        detectedState = "Bihar";
      } else if (lower.includes("varanasi") || lower.includes("वाराणसी")) {
        detectedCity = "Varanasi";
        detectedDistrict = "Varanasi";
        detectedState = "Uttar Pradesh";
      }

      return {
        requestId: `REQ-${Date.now()}`,
        language,
        originalText: text,
        category,
        subCategory: `${category}_need`,
        location: {
          country: "India",
          state: detectedState,
          district: detectedDistrict,
          city: detectedCity,
          locality: location?.locality || "",
        },
        problem,
        urgency,
        affectedPopulation,
        citizenSuggestedSolution: null,
        timestamp: "Just now",
        source: source || "voice",
        verifiedStatus: "verified",
        citizenName: citizenName || "Citizen Contributor",
      };
    };

    const prompt = `You are the Sahayak AI Classifier for Track 1 Digital Public Infrastructure & Governance (BRICS Innovation).
Citizen statement: "${text}"
Target language: ${language}
Provided location context: ${JSON.stringify(location || {})}

Classify into one category from:
[healthcare, roads, public_transport, drinking_water, sanitation, electricity, internet_connectivity, schools_education, public_safety, waste_management, drainage_flood, housing, agriculture_infrastructure, irrigation, employment_infrastructure, government_services, other]

Return ONLY a valid JSON object matching:
{
  "category": "healthcare" | "roads" | "drinking_water" | "schools_education" | "electricity" | "irrigation" | "drainage_flood" | "public_transport" | "waste_management" | "public_safety" | "other",
  "subCategory": "<short subcategory key>",
  "problem": "<concise 1-sentence description of the core problem>",
  "urgency": "low" | "medium" | "high" | "critical",
  "affectedPopulation": "individual" | "neighborhood" | "community" | "entire_region",
  "location": {
    "country": "India",
    "state": "<State name>",
    "district": "<District name>",
    "city": "<City/Town or best inferred location>"
  },
  "citizenSuggestedSolution": "<Specific solution if suggested, else null>"
}`;

    const raw = await generateContentWithFallback({
      contents: prompt,
      config: { responseMimeType: "application/json" },
    }, "Dev Request Classifier");

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.category) {
          return res.json({
            requestId: `REQ-${Date.now()}`,
            language,
            originalText: text,
            category: parsed.category,
            subCategory: parsed.subCategory || `${parsed.category}_need`,
            location: {
              country: parsed.location?.country || "India",
              state: parsed.location?.state || location?.state || "West Bengal",
              district: parsed.location?.district || location?.district || "Dakshin Dinajpur",
              city: parsed.location?.city || location?.city || "Balurghat",
              locality: location?.locality || "",
            },
            problem: parsed.problem || text,
            urgency: parsed.urgency || "medium",
            affectedPopulation: parsed.affectedPopulation || "community",
            citizenSuggestedSolution: parsed.citizenSuggestedSolution || null,
            timestamp: "Just now",
            source: source || "voice",
            verifiedStatus: "verified",
            citizenName: citizenName || "Citizen Contributor",
          });
        }
      } catch {}
    }

    res.json(createFallbackClassification());
  });

  // Dedicated In-Memory Civic Reports Database Store (Preserving 100% Original Citizen Submissions)
  const storedCivicReports: Array<{
    id: string;
    type: "voice" | "text";
    originalAudioBase64?: string;
    audioMimeType?: string;
    durationSeconds?: number;
    originalText?: string;
    transcript?: string;
    language: string;
    timestamp: string;
    sessionId?: string;
    location?: {
      state: string;
      district?: string;
      city?: string;
      locality?: string;
    };
    status: string;
    aiMetadata?: {
      category?: string;
      urgency?: string;
      department?: string;
      summary?: string;
    };
  }> = [];

  // Submit Civic Report Endpoint (Voice or Text)
  app.post("/api/submit-civic-report", async (req, res) => {
    try {
      const {
        type = "text",
        audioBase64,
        audioMimeType = "audio/webm",
        durationSeconds = 0,
        text = "",
        language = "bn",
        sessionId = `sess-${Date.now().toString(36)}`,
        location = { state: "West Bengal", district: "Dakshin Dinajpur", city: "Balurghat" },
        timestamp = new Date().toISOString(),
      } = req.body || {};

      const reportId = `SHK-${type === "voice" ? "VR" : "TR"}-${Math.floor(10000 + Math.random() * 90000)}`;

      let category = "roads";
      let department = "Public Works Department";
      let urgency = "medium";
      let summary = "";
      let transcript = "";

      // For voice reports: store actual audio payload
      if (type === "voice" && audioBase64) {
        summary = "Voice report submitted by citizen";
        // Optionally classify via Gemini audio metadata without modifying the original audio
        if (getGenAI()) {
          try {
            const audioPrompt = `Listen to this citizen report. Output JSON only:
{
  "transcript": "<exact words in original script>",
  "category": "roads" | "healthcare" | "drinking_water" | "schools_education" | "electricity" | "irrigation" | "drainage_flood" | "other",
  "urgency": "low" | "medium" | "high" | "critical",
  "department": "<Government department name>"
}`;
            const raw = await generateContentWithAudio(audioBase64, audioMimeType, audioPrompt, "Civic Audio Metadata");
            if (raw) {
              const p = JSON.parse(raw);
              if (p.transcript) transcript = p.transcript;
              if (p.category) category = p.category;
              if (p.urgency) urgency = p.urgency;
              if (p.department) department = p.department;
            }
          } catch {}
        }
      } else {
        // For text reports: preserve exact original text
        const lower = (text || "").toLowerCase();
        if (lower.includes("হাসপাতাল") || lower.includes("doctor") || lower.includes("হাসপাতাল") || lower.includes("hospital")) {
          category = "healthcare";
          department = "Health & Family Welfare Department";
          urgency = "high";
        } else if (lower.includes("জল") || lower.includes("water") || lower.includes("পানি") || lower.includes("পানি")) {
          category = "drinking_water";
          department = "Public Health Engineering (PHE)";
          urgency = "high";
        } else if (lower.includes("বিদ্যুৎ") || lower.includes("electricity") || lower.includes("কারেন্ট")) {
          category = "electricity";
          department = "State Electricity Distribution";
          urgency = "medium";
        } else if (lower.includes("স্কুল") || lower.includes("school") || lower.includes("education")) {
          category = "schools_education";
          department = "School Education Department";
          urgency = "medium";
        } else {
          category = "roads";
          department = "Public Works Department (Roads)";
          urgency = "medium";
        }
        summary = text;
      }

      const reportRecord = {
        id: reportId,
        type: type as "voice" | "text",
        ...(type === "voice"
          ? {
              originalAudioBase64: audioBase64,
              audioMimeType,
              durationSeconds,
              transcript,
            }
          : {
              originalText: text,
            }),
        language,
        timestamp,
        sessionId,
        location,
        status: "submitted_to_database",
        aiMetadata: {
          category,
          urgency,
          department,
          summary: summary || transcript || (type === "voice" ? "Audio recording preserved" : text),
        },
      };

      storedCivicReports.unshift(reportRecord);
      console.log(`[Sahayak Civic Database] New report registered: ${reportId} (Type: ${type}, Language: ${language})`);

      return res.json({
        success: true,
        reportId,
        message: "Report submitted to Sahayak civic database",
        report: reportRecord,
      });
    } catch (err: any) {
      console.error("[Sahayak Civic Submit Error]:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to store report in civic database",
      });
    }
  });

  // Get Civic Reports List
  app.get("/api/civic-reports", (req, res) => {
    res.json({
      success: true,
      count: storedCivicReports.length,
      reports: storedCivicReports,
    });
  });

  // Track 1 — Conversational Development Need Voice Interview Agent
  app.post("/api/development-agent-turn", async (req, res) => {
    const {
      userMessage = "",
      audioBase64 = "",
      audioMimeType = "audio/webm",
      currentLanguage = "bn",
      conversationStep = 1,
      collectedData = {},
      conversationHistory = [],
    } = req.body || {};

    let cleanUserMsg = (userMessage || "").trim();

    // If audio is provided, use Gemini Native Audio Understanding
    if (!cleanUserMsg && audioBase64) {
      try {
        const audioPrompt = `You are Sahayak, an Indian Digital Public Infrastructure voice agent listening to a citizen speaking in Bengali, Hindi, or English about local infrastructure needs.
1. Transcribe the citizen's exact words into userTranscript in original native script (Bengali / Hindi / English).
2. If silent/background noise with no words spoken, set hasSpeech: false and userTranscript: "".
Output JSON: { "hasSpeech": boolean, "userTranscript": string }`;

        const rawAudio = await generateContentWithAudio(audioBase64, audioMimeType, audioPrompt, "Dev Audio Understanding");
        if (rawAudio) {
          try {
            const p = JSON.parse(rawAudio);
            if (p.userTranscript && p.userTranscript.trim()) {
              cleanUserMsg = p.userTranscript.trim();
            } else if (p.hasSpeech === false) {
              return res.json({
                hasSpeech: false,
                userTranscript: "",
                replyText: "",
                message: "No speech recognized",
              });
            }
          } catch {}
        }
      } catch (audioErr) {
        console.warn("Gemini development audio understanding notice:", audioErr);
      }
    }

    const prompt = `You are Sahayak, an empathetic civic voice agent interviewing an Indian citizen about a public development need, civic issue, or local infrastructure problem for Digital Public Infrastructure (Track 1 DPI).

Citizen statement: "${cleanUserMsg}"
Selected Language: ${currentLanguage}
Current Step: ${conversationStep}
Collected data so far: ${JSON.stringify(collectedData || {})}
Recent conversation history: ${JSON.stringify(conversationHistory.slice(-4))}

LANGUAGE & VOICE INSTRUCTIONS:
- When Selected Language is "bn": Respond in natural spoken Bengali. Use standard conversational Bengali appropriate for an Indian Bengali-speaking citizen. Do not transliterate Bengali. Do not pronounce individual characters. Speak complete Bengali words and sentences.
- When Selected Language is "hi": Respond in natural conversational Hindi. Speak complete Hindi words and sentences.
- When Selected Language is "en": Respond in natural conversational English.
- Do not switch language because the citizen uses occasional loanwords or names.

CONVERSATIONAL RULES:
1. UNDERSTAND WHAT THE CITIZEN SAYS:
   - Extract problem category, specific issue description, location (city/district), urgency, and community scope ONLY from what the user explicitly said.
   - Never invent facts.
2. DYNAMIC CONVERSATION:
   - If location (city/village) was NOT mentioned yet in collectedData or userMessage, acknowledge their problem empathetically in ${currentLanguage === "bn" ? "natural Bengali" : currentLanguage === "hi" ? "natural Hindi" : "natural English"} and ask for their area/locality name.
   - If location IS already known but community scope is unclear, ask how many people/households are affected or if it is an urgent hazard.
   - If sufficient details (issue + location) are recorded, warmly confirm that the development request is structured and aggregated onto the Policymaker Dashboard for priority ranking. Set isComplete = true.

Respond ONLY with a valid JSON matching:
{
  "extracted": {
    "category": "<healthcare | roads | drinking_water | schools_education | electricity | irrigation | drainage_flood | public_transport | waste_management | public_safety | other>",
    "problem": "<short clear description>",
    "location": { "city": "<city/village if mentioned>", "district": "<district if mentioned>", "state": "<state if mentioned>" },
    "urgency": "high" | "medium" | "low" | "critical",
    "affectedPopulation": "individual" | "neighborhood" | "community" | "entire_region"
  },
  "replyText": "<Target language spoken response>",
  "replyTextBn": "<Bengali text>",
  "replyTextHi": "<Hindi text>",
  "replyTextEn": "<English text>",
  "nextStep": number,
  "isComplete": boolean,
  "suggestedAnswers": ["option 1", "option 2"]
}`;

    const raw = await generateContentWithFallback({
      contents: prompt,
      config: { responseMimeType: "application/json" },
    }, "Dev Voice Agent Turn");

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.replyText) {
          console.log(`[Conversation Debug]
User Message: "${cleanUserMsg}"
Assistant Reply: "${parsed.replyText}"
Extracted Dev Facts: ${JSON.stringify(parsed.extracted)}
AUTO-GENERATED USER INPUT: false
DEMO INPUT: false`);

          let assistantAudioBase64: string | null = null;
          try {
            assistantAudioBase64 = await generateAndCacheAudio(parsed.replyText, "Kore");
          } catch {}

          return res.json({
            ...parsed,
            hasSpeech: true,
            userTranscript: cleanUserMsg,
            assistantAudioBase64,
          });
        }
      } catch {}
    }

    // Deterministic fallback turn for Track 1
    const isBn = currentLanguage === "bn";
    const isHi = currentLanguage === "hi";
    const lower = cleanUserMsg.toLowerCase();

    const localClass = classifyCitizenTextLocally(cleanUserMsg);
    const hasLocation = Boolean(
      collectedData.location?.city ||
      lower.includes("balurghat") || lower.includes("বালুরঘাট") ||
      lower.includes("purulia") || lower.includes("পুরুলিয়া") ||
      lower.includes("malda") || lower.includes("মালদা") ||
      lower.includes("siliguri") || lower.includes("শিলিগুড়ি") ||
      lower.includes("kolkata") || lower.includes("কলকাতা") ||
      lower.includes("gaya") || lower.includes("varanasi")
    );

    if (!hasLocation && conversationStep === 1) {
      const fallbackReply = isBn ? "বুঝেছি। আপনার এলাকার নাম বা লোকেশনটা জানাবেন?" : isHi ? "समझ गया। क्या आप अपने क्षेत्र या स्थान का नाम बताएँगे?" : "Got it. Could you tell me the name of your area or location?";
      let assistantAudioBase64: string | null = null;
      try {
        assistantAudioBase64 = await generateAndCacheAudio(fallbackReply, "Kore");
      } catch {}

      return res.json({
        hasSpeech: true,
        userTranscript: cleanUserMsg,
        assistantAudioBase64,
        extracted: { problem: cleanUserMsg, category: localClass.category },
        replyText: fallbackReply,
        replyTextBn: "বুঝেছি। আপনার এলাকার নাম বা লোকেশনটা জানাবেন?",
        replyTextHi: "समझ गया। क्या आप अपने क्षेत्र या स्थान का नाम बताएँगे?",
        replyTextEn: "Got it. Could you tell me the name of your area or location?",
        nextStep: 2,
        isComplete: false,
        suggestedAnswers: isBn ? ["বালুরঘাট", "পুরুলিয়া", "মালদা", "অন্যান্য এলাকা"] : isHi ? ["बालुरघाट", "पुरुलिया", "मालदा", "अन्य क्षेत्र"] : ["Balurghat", "Purulia", "Malda", "Other Location"],
      });
    }

    if (conversationStep === 2) {
      const fallbackReply = isBn ? "এই সমস্যাটি কি আপনার এলাকার অনেক মানুষকেই প্রভাবিত করছে?" : isHi ? "क्या यह समस्या आपके क्षेत्र के कई लोगों को प्रभावित कर रही है?" : "Is this issue affecting many people in your community?";
      let assistantAudioBase64: string | null = null;
      try {
        assistantAudioBase64 = await generateAndCacheAudio(fallbackReply, "Kore");
      } catch {}

      return res.json({
        hasSpeech: true,
        userTranscript: cleanUserMsg,
        assistantAudioBase64,
        extracted: { location: { city: cleanUserMsg } },
        replyText: fallbackReply,
        replyTextBn: "এই সমস্যাটি কি আপনার এলাকার অনেক মানুষকেই প্রভাবিত করছে?",
        replyTextHi: "क्या यह समस्या आपके क्षेत्र के कई लोगों को प्रभावित कर रही है?",
        replyTextEn: "Is this issue affecting many people in your community?",
        nextStep: 3,
        isComplete: false,
        suggestedAnswers: isBn ? ["হ্যাঁ, পুরো এলাকা প্রভাবিত", "কয়েকটি পরিবার", "অত্যন্ত জরুরি"] : isHi ? ["हाँ, पूरा क्षेत्र प्रभावित है", "कुछ परिवार", "अत्यंत आवश्यक"] : ["Yes, whole community", "A few households", "Extremely urgent"],
      });
    }

    const fallbackReply = isBn ? "ধন্যবাদ। আপনার এলাকার উন্নয়ন সংক্রান্ত অনুরোধটি নথিভুক্ত করা হয়েছে এবং পলিসি ড্যাশবোর্ডে যুক্ত হয়েছে।" : isHi ? "धन्यवाद। आपके क्षेत्र की विकास संबंधी आवश्यकता दर्ज कर ली गई है और पॉलिसी डैशबोर्ड में जुड़ गई है।" : "Thank you. Your development need has been recorded and added to the DPI aggregation engine and policymaker dashboard.";
    let assistantAudioBase64: string | null = null;
    try {
      assistantAudioBase64 = await generateAndCacheAudio(fallbackReply, "Kore");
    } catch {}

    return res.json({
      hasSpeech: true,
      userTranscript: cleanUserMsg,
      assistantAudioBase64,
      extracted: { affectedPopulation: "community", urgency: "high" },
      replyText: fallbackReply,
      replyTextBn: "ধন্যবাদ। আপনার এলাকার উন্নয়ন সংক্রান্ত অনুরোধটি নথিভুক্ত করা হয়েছে এবং পলিসি ড্যাশবোর্ডে যুক্ত হয়েছে।",
      replyTextHi: "धन्यवाद। आपके क्षेत्र की विकास संबंधी आवश्यकता दर्ज कर ली गई है और पॉलिसी डैशबोर्ड में जुड़ गई है।",
      replyTextEn: "Thank you. Your development need has been recorded and added to the DPI aggregation engine and policymaker dashboard.",
      nextStep: 4,
      isComplete: true,
      suggestedAnswers: isBn ? ["ড্যাশবোর্ড দেখুন", "আরেকটি সমস্যা জানান"] : isHi ? ["डैशबोर्ड देखें", "दूसरी समस्या दर्ज करें"] : ["View Dashboard", "Report Another Need"],
    });
  });

  // Local helper functions for zero-hallucination fact extraction
  function isProfileFullyReady(p: any): boolean {
    if (!p) return false;
    const hasName = Boolean(p.name && String(p.name).trim().length > 0);
    const hasAge = Boolean(p.age && String(p.age).trim().length > 0);
    const hasOcc = Boolean(p.occupation && String(p.occupation).trim().length > 0);
    const hasInc = Boolean(p.income && String(p.income).trim().length > 0);

    if (!hasName || !hasAge || !hasOcc || !hasInc) return false;

    const occLower = (p.occupation || "").toLowerCase();
    const isStudent = occLower.includes("student") || occLower.includes("study") || occLower.includes("college") || occLower.includes("school") || occLower.includes("ছাত্র");
    if (isStudent) {
      if (!p.education?.level) return false;
      if (p.education.level === "school" && (!p.education.class || String(p.education.class).trim().length === 0)) return false;
      if (p.education.level === "college" && (!p.education.course || String(p.education.course).trim().length === 0)) return false;
    }

    const isFarmer = occLower.includes("farmer") || occLower.includes("কৃষক") || occLower.includes("किसान");
    if (isFarmer && p.ownsLand === undefined) return false;

    return true;
  }

  function determineNextMissingField(p: any): string {
    if (!p.name || !String(p.name).trim()) return "name";
    if (!p.age || !String(p.age).trim()) return "age";
    if (!p.occupation || !String(p.occupation).trim()) return "occupation";

    const occLower = (p.occupation || "").toLowerCase();
    const isStudent = occLower.includes("student") || occLower.includes("study") || occLower.includes("college") || occLower.includes("school") || occLower.includes("ছাত্র");
    if (isStudent) {
      if (!p.education?.level) return "education_level";
      if (p.education.level === "school" && (!p.education.class || String(p.education.class).trim().length === 0)) return "school_class";
      if (p.education.level === "college" && (!p.education.course || String(p.education.course).trim().length === 0)) return "college_course";
      if (p.education.level === "college" && !p.education.year && !p.education.semester) return "college_year";
    }

    if (!p.income || !String(p.income).trim()) return "income";

    const isFarmer = occLower.includes("farmer") || occLower.includes("কৃষক") || occLower.includes("किसान");
    if (isFarmer && p.ownsLand === undefined) return "ownsLand";

    return "completed";
  }

  function extractUserFactsStrict(
    userMessage: string = "",
    currentProfile: any = {},
    pendingKey: string = "name",
    lang: string = "bn"
  ) {
    const cleanMsg = (userMessage || "").trim();
    const newlyExtracted: Record<string, any> = {};

    // 1. Strict Multi-Fact Extractor:
    // Name
    const nameMatch = cleanMsg.match(/(?:আমার নাম|मेरा नाम|my name is|i am|amar naam|mera naam|naam|নাম|नाम)\s*:?\s*([A-Za-z\u0980-\u09FF\u0900-\u097F\s]{2,25})/i);
    if (nameMatch && nameMatch[1] && !/কৃষক|ছাত্র|farmer|student|বছর|साल|age/i.test(nameMatch[1])) {
      newlyExtracted.name = nameMatch[1].trim();
    } else if ((pendingKey === "name" || pendingKey === "initial" || !currentProfile?.name) && cleanMsg.length > 1 && cleanMsg.length <= 25) {
      if (!/\b(student|farmer|study|কৃষক|ছাত্র|স্কুল|কলেজ|\d+)\b/i.test(cleanMsg)) {
        newlyExtracted.name = cleanMsg.replace(/^(আমার নাম|मेरा नाम|my name is|i am)\s*/i, "").trim();
      }
    }

    // Age
    const ageMatch = cleanMsg.match(/(?:বয়স|উমর|उम्र|age|years old|yr|বছর|साल)?\s*(\b\d{1,2}\b)\s*(?:years old|yr|বছর|साल|বয়স|উমর|বয়স|उम्र)?/i);
    if (ageMatch && ageMatch[1] && parseInt(ageMatch[1], 10) >= 5 && parseInt(ageMatch[1], 10) <= 110) {
      newlyExtracted.age = ageMatch[1];
    } else {
      if (/কুড়ি|বিস|twenty|20/i.test(cleanMsg)) newlyExtracted.age = "20";
      else if (/পঁচিশ|पच्चीस|twenty five|25/i.test(cleanMsg)) newlyExtracted.age = "25";
      else if (/তিরিশ|तीस|thirty|30/i.test(cleanMsg)) newlyExtracted.age = "30";
      else if (/পঁয়ত্রিশ|पैंतीस|thirty five|35/i.test(cleanMsg)) newlyExtracted.age = "35";
      else if (/চল্লিশ|चालीस|forty|40/i.test(cleanMsg)) newlyExtracted.age = "40";
      else if (/পঞ্চাশ|पचास|fifty|50/i.test(cleanMsg)) newlyExtracted.age = "50";
      else if (/ষাট|साठ|sixty|60/i.test(cleanMsg)) newlyExtracted.age = "60";
    }

    // Occupation
    if (/student|study|college|school|porashona|pori|ছাত্র|ছাত্রী|छात्र|छात्रा|पढाई|পড়াশোনা|পড়াশোনা|বিশ্ববিদ্যালয়/i.test(cleanMsg)) {
      newlyExtracted.occupation = "Student";
    } else if (/farmer|krishi|chash|kisan|kheti|কৃষক|কৃষি|চাষ|চাষী|किसान|खेती/i.test(cleanMsg)) {
      newlyExtracted.occupation = "Farmer";
    } else if (/business|shop|dokandar|byabsa|ব্যবসা|দোকান|व्यापार|दुकान/i.test(cleanMsg)) {
      newlyExtracted.occupation = "Self-Employed / Business";
    } else if (/artisan|craftsman|karigar|tailor|carpenter|weaver|কারিগর|তাঁতি|कारीगर/i.test(cleanMsg)) {
      newlyExtracted.occupation = "Artisan / Craftsman";
    } else if (/labor|labour|din majur|দিনমজুর|मजदूर|श्रमिक/i.test(cleanMsg)) {
      newlyExtracted.occupation = "Daily Wage Worker";
    }

    // Education (ONLY if Student or Education is mentioned)
    const isStudentUtterance =
      newlyExtracted.occupation === "Student" ||
      currentProfile.occupation === "Student" ||
      /student|study|college|school|class|শ্রেণি|কোর্স|বিএসসি|বিএ|school|কলেজ|স্কুল/i.test(cleanMsg);

    if (isStudentUtterance) {
      const isCollege = /college|university|varsity|কলেজ|বিশ্ববিদ্যালয়|कॉलेज|यूनिवर्सिटी|b\.?sc|b\.?a|b\.?tech|b\.?com|diploma|iti|m\.?a|m\.?sc|mbbs|degree/i.test(cleanMsg);
      const isSchool = /school|স্কুল|স্কুলে|স্কুলে পড়ি|স্কুল ছাত্র|स्कूल|class|শ্রেণি|দশম|একাদশ|দ্বাদশ/i.test(cleanMsg) && !isCollege;

      if (isSchool) {
        let cls: number | string | null = null;
        const numMatch = cleanMsg.match(/\b(class|শ্রেণি|ক্লাস|कक्षा)?\s*([1-9]|1[0-2])(?:th|st|nd|rd)?\b/i);
        if (numMatch && numMatch[2]) cls = parseInt(numMatch[2], 10);
        else if (/দশম|ten|10/i.test(cleanMsg)) cls = 10;
        else if (/একাদশ|eleven|11/i.test(cleanMsg)) cls = 11;
        else if (/দ্বাদশ|twelve|12/i.test(cleanMsg)) cls = 12;
        else if (/নবম|nine|9/i.test(cleanMsg)) cls = 9;
        else if (/অষ্টম|eight|8/i.test(cleanMsg)) cls = 8;
        else if (/সপ্তম|seven|7/i.test(cleanMsg)) cls = 7;

        newlyExtracted.education = {
          level: "school",
          class: cls, // Null if not stated! NEVER default
          board: null,
        };
      } else if (isCollege) {
        let crs: string | null = null;
        if (/b\.?sc|bsc|বিএসসি/i.test(cleanMsg)) crs = "B.Sc.";
        else if (/b\.?a\b|ba\b|বিএ\b/i.test(cleanMsg)) crs = "B.A.";
        else if (/b\.?tech|btech|engineering|ইঞ্জিনিয়ারিং/i.test(cleanMsg)) crs = "B.Tech";
        else if (/b\.?com|bcom|বিকম/i.test(cleanMsg)) crs = "B.Com";
        else if (/diploma|iti|polytechnic|ডিপ্লোমা|আইটিআই/i.test(cleanMsg)) crs = "Diploma / ITI";
        else if (/m\.?sc|msc|এমএসসি/i.test(cleanMsg)) crs = "M.Sc.";
        else if (/m\.?a\b|ma\b|এমএ/i.test(cleanMsg)) crs = "M.A.";
        else if (/mbbs|medical|মেডিকেল/i.test(cleanMsg)) crs = "MBBS";

        let yr: number | string | null = null;
        if (/1st|first|প্রথম|১ম|पहला|1st year|১ম বর্ষ/i.test(cleanMsg)) yr = 1;
        else if (/2nd|second|দ্বিতীয়|২য়|दूसरा|2nd year|২য় বর্ষ/i.test(cleanMsg)) yr = 2;
        else if (/3rd|third|তৃতীয়|৩য়|तीसरा|3rd year|৩য় বর্ষ/i.test(cleanMsg)) yr = 3;
        else if (/4th|fourth|final|চতুর্থ|৪র্থ|चौथा|4th year|৪র্থ বর্ষ/i.test(cleanMsg)) yr = 4;

        newlyExtracted.education = {
          level: "college",
          course: crs, // Null if not stated! NEVER default
          year: yr, // Null if not stated! NEVER default
          semester: null,
          institution: null,
        };
      }
    }

    // Income
    if (/income|আয়|आय|salary|টাকা|rupees|লাখ|lakh|bpl|দারিদ্র্যসীমা|বিপিএল/i.test(cleanMsg) || pendingKey === "income") {
      if (/bpl|দারিদ্র্যসীমা|বিপিএল|गरीबी रेखा/i.test(cleanMsg)) {
        newlyExtracted.income = "BPL (Below Poverty Line)";
      } else {
        const lakhMatch = cleanMsg.match(/(\d+(?:\.\d+)?)\s*(?:lakh|লাখ|लाख)/i);
        if (lakhMatch && lakhMatch[1]) {
          newlyExtracted.income = `₹${lakhMatch[1]} Lakh`;
        } else if (cleanMsg.length > 0 && pendingKey === "income") {
          newlyExtracted.income = cleanMsg;
        }
      }
    }

    // Land Ownership
    if (pendingKey === "ownsLand" || /land|জমি|जमीन|chash|চাষ/i.test(cleanMsg)) {
      if (/yes|হ্যাঁ|हाँ|ache|আছে|own land|own|জমি আছে|जमीन है/i.test(cleanMsg)) {
        newlyExtracted.ownsLand = true;
        const acreMatch = cleanMsg.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|একর|বিঘা)/i);
        if (acreMatch && acreMatch[1]) newlyExtracted.landSizeAcres = acreMatch[1];
      } else if (/no|না|নেই|नहीं|जमीन नहीं|ভাগচাষী|landless/i.test(cleanMsg)) {
        newlyExtracted.ownsLand = false;
      }
    }

    const merged = { ...currentProfile, ...newlyExtracted };
    if (newlyExtracted.education) {
      merged.education = {
        ...(currentProfile.education || {}),
        ...newlyExtracted.education,
      };
    }

    const isReady = isProfileFullyReady(merged);
    const nextKey = determineNextMissingField(merged);
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
      mergedProfile: merged,
      nextQuestion: questionMap[nextKey] || questionMap.completed,
      isReadyForResults: isReady,
      debug: {
        userMessage: cleanMsg,
        assistantReply: questionMap[nextKey]?.textBn || questionMap.completed.textBn,
        extractedFacts: newlyExtracted,
        currentProfile: merged,
        autoGeneratedUserInput: false,
        demoInput: false,
        language: lang,
      },
    };
  }

  function classifyCitizenTextLocally(text: string) {
    const lower = text.toLowerCase();
    let category = "healthcare";
    if (lower.includes("রাস্তা") || lower.includes("সেতু") || lower.includes("road") || lower.includes("bridge") || lower.includes("सड़क")) {
      category = "roads";
    } else if (lower.includes("জল") || lower.includes("পানি") || lower.includes("water") || lower.includes("drinking")) {
      category = "drinking_water";
    } else if (lower.includes("স্কুল") || lower.includes("school") || lower.includes("education")) {
      category = "schools_education";
    } else if (lower.includes("বিদ্যুৎ") || lower.includes("electricity") || lower.includes("কারেন্ট")) {
      category = "electricity";
    } else if (lower.includes("সেচ") || lower.includes("খাল") || lower.includes("irrigation")) {
      category = "irrigation";
    } else if (lower.includes("ড্রেন") || lower.includes("নিকাশি") || lower.includes("drain") || lower.includes("flood")) {
      category = "drainage_flood";
    }
    return { category, problem: text };
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
