// Web Speech API helper for Multilingual TTS and Speech Recognition in Sahayak

// Female voice name identifiers across Windows, macOS, iOS, Android, Linux, and Chrome
const FEMALE_VOICE_HINTS = [
  "female",
  "woman",
  "girl",
  "lekha",
  "nabaneeta",
  "paulami",
  "damayanti",
  "baishali",
  "kalpana",
  "heera",
  "swara",
  "sangeeta",
  "aditi",
  "ananya",
  "kavya",
  "pallavi",
  "priya",
  "veena",
  "shruthi",
  "shruti",
  "rani",
  "zira",
  "samantha",
  "victoria",
  "karen",
  "cynthia",
  "serena",
  "ava",
  "jenny",
  "aria",
  "emma",
  "mia",
  "sonia",
  "neerja",
  "google বাংলা",
  "google bangla",
  "google हिन्दी",
  "google hindi",
  "google english",
];

const MALE_VOICE_HINTS = [
  "male",
  " man",
  "boy",
  "subhas",
  "deepak",
  "prabhat",
  "valluvar",
  "ravi",
  "david",
  "mark",
  "george",
  "guy",
  "stefan",
  "madhur",
  "hemant",
  "tarun",
  "karthik",
];

export function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const nameLower = voice.name.toLowerCase();
  const voiceUriLower = (voice.voiceURI || "").toLowerCase();
  const combined = `${nameLower} ${voiceUriLower}`;

  // If name has explicit male marker, reject
  if (MALE_VOICE_HINTS.some((hint) => combined.includes(hint))) {
    return false;
  }

  // If name has explicit female hint
  if (FEMALE_VOICE_HINTS.some((hint) => combined.includes(hint))) {
    return true;
  }

  // Google voices on Android/Chrome for Indian locales default to high-quality female TTS
  if (combined.includes("google") && !combined.includes("male")) {
    return true;
  }

  // If no male indicator found, consider non-male
  return true;
}

export function isBengaliVoice(voice: SpeechSynthesisVoice): boolean {
  const langLower = (voice.lang || "").toLowerCase().replace("_", "-");
  const nameLower = (voice.name || "").toLowerCase();
  const uriLower = (voice.voiceURI || "").toLowerCase();

  if (langLower === "bn" || langLower.startsWith("bn-") || langLower.startsWith("bn_")) {
    return true;
  }

  if (
    nameLower.includes("বাংলা") ||
    nameLower.includes("bangla") ||
    nameLower.includes("bengali") ||
    nameLower.includes("lekha") ||
    nameLower.includes("nabaneeta") ||
    nameLower.includes("paulami") ||
    nameLower.includes("damayanti") ||
    nameLower.includes("baishali") ||
    nameLower.includes("subhas") ||
    uriLower.includes("bn-in") ||
    uriLower.includes("bn-bd") ||
    uriLower.includes("bengali") ||
    uriLower.includes("bangla")
  ) {
    return true;
  }

  return false;
}

export function isHindiVoice(voice: SpeechSynthesisVoice): boolean {
  const langLower = (voice.lang || "").toLowerCase().replace("_", "-");
  const nameLower = (voice.name || "").toLowerCase();
  const uriLower = (voice.voiceURI || "").toLowerCase();

  if (langLower === "hi" || langLower.startsWith("hi-") || langLower.startsWith("hi_")) {
    return true;
  }

  if (
    nameLower.includes("हिन्दी") ||
    nameLower.includes("hindi") ||
    nameLower.includes("kalpana") ||
    nameLower.includes("heera") ||
    nameLower.includes("swara") ||
    nameLower.includes("sangeeta") ||
    uriLower.includes("hi-in")
  ) {
    return true;
  }

  return false;
}

export function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  const langLower = (voice.lang || "").toLowerCase().replace("_", "-");
  return langLower === "en" || langLower.startsWith("en-") || langLower.startsWith("en_");
}

let loggedVoicesOnce = false;

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0 && !loggedVoicesOnce) {
    loggedVoicesOnce = true;
    try {
      console.table(
        voices.map((v) => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
        }))
      );
    } catch {}
  }
  return voices;
}

// Attach listener early so voices populate
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      getAvailableVoices();
    };
  }
}

export function findBestVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  if (lang === "bn") {
    // 1. Direct Bengali voices
    const bnVoices = voices.filter((v) => isBengaliVoice(v));
    if (bnVoices.length > 0) {
      const femaleBn = bnVoices.find((v) => isFemaleVoice(v));
      if (femaleBn) return femaleBn;
      return bnVoices[0];
    }

    // 2. Hindi fallback for Indic phonetics
    const hiVoices = voices.filter((v) => isHindiVoice(v));
    if (hiVoices.length > 0) {
      const femaleHi = hiVoices.find((v) => isFemaleVoice(v));
      if (femaleHi) return femaleHi;
      return hiVoices[0];
    }

    // 3. Indian English fallback
    const inEnVoices = voices.filter((v) =>
      (v.lang || "").toLowerCase().replace("_", "-").includes("en-in")
    );
    if (inEnVoices.length > 0) {
      const femaleInEn = inEnVoices.find((v) => isFemaleVoice(v));
      if (femaleInEn) return femaleInEn;
      return inEnVoices[0];
    }
  }

  if (lang === "hi") {
    // 1. Direct Hindi voices
    const hiVoices = voices.filter((v) => isHindiVoice(v));
    if (hiVoices.length > 0) {
      const femaleHi = hiVoices.find((v) => isFemaleVoice(v));
      if (femaleHi) return femaleHi;
      return hiVoices[0];
    }

    // 2. Bengali fallback
    const bnVoices = voices.filter((v) => isBengaliVoice(v));
    if (bnVoices.length > 0) {
      const femaleBn = bnVoices.find((v) => isFemaleVoice(v));
      if (femaleBn) return femaleBn;
      return bnVoices[0];
    }

    // 3. Indian English fallback
    const inEnVoices = voices.filter((v) =>
      (v.lang || "").toLowerCase().replace("_", "-").includes("en-in")
    );
    if (inEnVoices.length > 0) {
      const femaleInEn = inEnVoices.find((v) => isFemaleVoice(v));
      if (femaleInEn) return femaleInEn;
      return inEnVoices[0];
    }
  }

  if (lang === "en") {
    const enVoices = voices.filter((v) => isEnglishVoice(v));
    if (enVoices.length > 0) {
      const inEnFemale = enVoices.find(
        (v) => (v.lang.includes("IN") || v.lang.includes("in")) && isFemaleVoice(v)
      );
      if (inEnFemale) return inEnFemale;

      const femaleEn = enVoices.find((v) => isFemaleVoice(v));
      if (femaleEn) return femaleEn;

      return enVoices[0];
    }
  }

  // Other regional languages matching prefix
  const matching = voices.filter((v) =>
    (v.lang || "").toLowerCase().replace("_", "-").startsWith(lang)
  );
  if (matching.length > 0) {
    const femaleMatch = matching.find((v) => isFemaleVoice(v));
    return femaleMatch || matching[0];
  }

  // Fallback to default system voice
  return voices.find((v) => v.default) || voices[0] || null;
}

let currentPlayingAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeUtteranceSafetyTimer: any = null;
const clientAudioCache = new Map<string, string>();
let audioUnlocked = false;

// Safe audio unlocker triggered by user click/tap
export function unlockAudioContext(): void {
  if (audioUnlocked || typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    audioUnlocked = true;
  } catch (e) {
    console.warn("Audio unlock notice:", e);
  }
}

// Attach auto-unlock on first document interaction
if (typeof window !== "undefined") {
  const unlockEvents = ["click", "touchstart", "keydown"];
  const handleFirstInteraction = () => {
    unlockAudioContext();
    unlockEvents.forEach((ev) =>
      document.removeEventListener(ev, handleFirstInteraction)
    );
  };
  unlockEvents.forEach((ev) =>
    document.addEventListener(ev, handleFirstInteraction, { once: true, passive: true })
  );
}

export interface VoiceLatencyMetrics {
  startClicked: number;
  sessionInitStarted?: number;
  sessionReady?: number;
  requestStarted?: number;
  firstAudioChunkReceived?: number;
  audioDecodeStarted?: number;
  audioPlaybackStarted?: number;
  timeToFirstAudioMs?: number;
}

// Preload audio into memory cache ahead of time (e.g. on page mount or language select)
export async function preloadTTSAudio(
  text: string,
  lang: string = "bn",
  voice: string = "Kore"
): Promise<string | null> {
  const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
  if (!cleanText) return null;
  const cacheKey = `${lang}:${voice}:${cleanText}`;

  if (clientAudioCache.has(cacheKey)) {
    return clientAudioCache.get(cacheKey)!;
  }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, language: lang, voice }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.audioBase64) {
      clientAudioCache.set(cacheKey, data.audioBase64);
      return data.audioBase64;
    }
  } catch (e) {
    console.warn("[Sahayak Preload Notice]:", e);
  }
  return null;
}

// Isolated Bengali/Hindi/English Audio test function
export async function testBengaliAudioIsolated(lang = "bn"): Promise<boolean> {
  const testTexts: Record<string, string> = {
    bn: "নমস্কার, আমি সহায়ক। আপনার জন্য উপযুক্ত সরকারি প্রকল্প খুঁজে দিতে আমি সাহায্য করতে পারি।",
    hi: "नमस्ते, मैं सहायक हूँ। आपके लिए सही सरकारी योजनाएँ ढूँढने में मैं आपकी मदद कर सकती हूँ।",
    en: "Hello, I am Sahayak. I can help you discover verified government welfare schemes.",
  };

  const testText = testTexts[lang] || testTexts.bn;
  console.log(`[Sahayak Audio Debug]
language = ${lang}
text = "${testText}"
engine = "Gemini TTS"
voice = Kore`);

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: testText,
        language: lang,
        voice: "Kore",
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS server response error: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.audioBase64) {
      stopSpeaking();
      const audio = new Audio(data.audioBase64);
      currentPlayingAudio = audio;
      await audio.play();
      return true;
    }
    return false;
  } catch (err) {
    console.error("[Sahayak Isolated TTS Error]:", err);
    return false;
  }
}

const BENGALI_COMMON_PHRASES: Record<string, string> = {
  "নমস্কার, আমি সহায়ক। আপনার প্রয়োজন এবং যোগ্যতার ভিত্তিতে উপযুক্ত সরকারি প্রকল্প খুঁজে দিতে পারি। তার জন্য আপনাকে কয়েকটি প্রশ্ন করব। প্রথমে আপনার নামটা বলুন।":
    "Nomoshkar, aami Sahayak. Aapnar proyojon ebong joggotar bhittite upojukto sorkari prokolpo khuje dite paari. Taar jonno aapnake koyekti proshno korbo. Prothome aapnar naamta bolun.",
  "আপনার বয়স কত বছর?": "Aapnar boyosh koto bochhor?",
  "আপনার পেশা বা জীবিকা কী? যেমন: কৃষক, শ্রমিক, ছোট ব্যবসায়ী, ছাত্র, বা গৃহিণী?":
    "Aapnar pesha ba jeebika ki? Jemon: krishok, shromik, chhoto byabosaayee, chhaatro, ba grihinee?",
  "আপনার পরিবারের বার্ষিক আনুমানিক আয় কত টাকা?": "Aapnar poribaarer baarshik aanumaanik aay koto taka?",
  "আপনার পরিবারের কি কোনো রেশন কার্ড আছে? যেমন: AAY, BPL, SPHH, PHH, RKSY?":
    "Aapnar poribaarer ki kono Ration card aachhe? Jemon: AAY, BPL, SPHH, PHH, ba RKSY?",
  "আপনার পরিবারের কোনো সদস্য কি বিশেষভাবে সক্ষম বা প্রতিবন্ধী?":
    "Aapnar poribaarer kono sodosyo ki bisheshbhabe sokhom ba protibondhi?",
  "ধন্যবাদ! আপনার দেওয়া তথ্যের ভিত্তিতে উপযুক্ত সরকারি প্রকল্প খোঁজা হচ্ছে...":
    "Dhonnobaad! Aapnar deowa tothyer bhittite upojukto sorkari prokolpo khoja hochhe...",
};

function romanizeBengali(text: string): string {
  const trimmed = text.trim();
  if (BENGALI_COMMON_PHRASES[trimmed]) {
    return BENGALI_COMMON_PHRASES[trimmed];
  }
  const map: Record<string, string> = {
    'অ': 'o', 'আ': 'aa', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u', 'ঊ': 'oo', 'ঋ': 'ri',
    'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': '',
    'া': 'aa', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ৃ': 'ri',
    'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': '',
    '।': '.', '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return text.split('').map(c => map[c] !== undefined ? map[c] : c).join('').replace(/\s+/g, ' ').trim();
}

// Fallback browser speech synthesis runner
function speakWithBrowserSynthesis(
  cleanText: string,
  lang: string,
  startTs: number,
  onEnd?: () => void,
  latencyMetrics?: VoiceLatencyMetrics,
  onLatencyUpdate?: (metrics: VoiceLatencyMetrics) => void
): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return () => {};
  }

  // Clear any existing active speech utterance and timeout
  if (activeUtteranceSafetyTimer) {
    clearTimeout(activeUtteranceSafetyTimer);
    activeUtteranceSafetyTimer = null;
  }

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
  } catch {}

  const voices = getAvailableVoices();
  const matchedVoice = findBestVoiceForLanguage(voices, lang);

  // If browser has no native Bengali voice and uses an English/Indian English voice,
  // romanize text so it pronounces native Bengali phonetics cleanly
  let textToSpeak = cleanText;
  if (lang === "bn" && (!matchedVoice || !isBengaliVoice(matchedVoice))) {
    textToSpeak = romanizeBengali(cleanText);
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  activeUtterance = utterance;

  if (matchedVoice) {
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang;
  } else {
    utterance.lang = lang === "bn" ? "en-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.05;

  let hasEnded = false;
  const finishSpeech = () => {
    if (hasEnded) return;
    hasEnded = true;
    if (activeUtteranceSafetyTimer) {
      clearTimeout(activeUtteranceSafetyTimer);
      activeUtteranceSafetyTimer = null;
    }
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    onEnd?.();
  };

  utterance.onstart = () => {
    const audioPlaybackStarted = Date.now();
    const timeToFirstAudioMs = audioPlaybackStarted - startTs;
    const metrics: VoiceLatencyMetrics = {
      startClicked: startTs,
      sessionInitStarted: latencyMetrics?.sessionInitStarted,
      sessionReady: latencyMetrics?.sessionReady,
      requestStarted: startTs,
      firstAudioChunkReceived: audioPlaybackStarted,
      audioDecodeStarted: audioPlaybackStarted,
      audioPlaybackStarted,
      timeToFirstAudioMs,
    };
    onLatencyUpdate?.(metrics);
  };

  utterance.onend = () => {
    finishSpeech();
  };

  utterance.onerror = (e) => {
    if ((e as any).error !== "canceled" && (e as any).error !== "interrupted") {
      console.warn("Browser TTS notice:", e);
    }
    finishSpeech();
  };

  // Safety timer to prevent assistant from getting stuck if browser fails to trigger onend
  const estimatedDurationMs = Math.max(3000, Math.min(20000, cleanText.length * 110));
  activeUtteranceSafetyTimer = setTimeout(() => {
    finishSpeech();
  }, estimatedDurationMs + 2000);

  // Short delay to avoid Chrome's immediate cancel-before-speak race condition
  setTimeout(() => {
    try {
      if (hasEnded) return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis speak error:", err);
      finishSpeech();
    }
  }, 30);

  return () => {
    finishSpeech();
    try {
      window.speechSynthesis.cancel();
    } catch {}
  };
}

export function speakText(
  text: string,
  lang: string = "bn",
  onEnd?: () => void,
  latencyMetrics?: VoiceLatencyMetrics,
  onLatencyUpdate?: (metrics: VoiceLatencyMetrics) => void
): () => void {
  unlockAudioContext();
  const startTs = latencyMetrics?.startClicked || Date.now();
  const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
  if (!cleanText) {
    onEnd?.();
    return () => {};
  }

  // STOP previous audio playback and speech
  stopSpeaking();

  let isCancelled = false;
  const cacheKey = `${lang}:Kore:${cleanText}`;
  const requestStarted = Date.now();

  const logMetrics = (metrics: VoiceLatencyMetrics) => {
    onLatencyUpdate?.(metrics);
  };

  const playBase64Audio = (audioBase64: string) => {
    if (isCancelled) return;
    const audioDecodeStarted = Date.now();
    const audio = new Audio(audioBase64);
    currentPlayingAudio = audio;

    audio.onplay = () => {
      const audioPlaybackStarted = Date.now();
      const timeToFirstAudioMs = audioPlaybackStarted - startTs;
      const updated: VoiceLatencyMetrics = {
        startClicked: startTs,
        sessionInitStarted: latencyMetrics?.sessionInitStarted,
        sessionReady: latencyMetrics?.sessionReady,
        requestStarted,
        firstAudioChunkReceived: latencyMetrics?.firstAudioChunkReceived || audioDecodeStarted,
        audioDecodeStarted,
        audioPlaybackStarted,
        timeToFirstAudioMs,
      };
      logMetrics(updated);
    };

    audio.onended = () => {
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
      }
      onEnd?.();
    };

    audio.onerror = (e) => {
      console.warn("[Sahayak Audio Playback Error]:", e);
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
      }
      // Fall back to browser speech synthesis
      speakWithBrowserSynthesis(cleanText, lang, startTs, onEnd, latencyMetrics, onLatencyUpdate);
    };

    audio.play().catch((playErr) => {
      console.warn("[Sahayak Audio Autoplay prevented/error, falling back]:", playErr);
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
      }
      speakWithBrowserSynthesis(cleanText, lang, startTs, onEnd, latencyMetrics, onLatencyUpdate);
    });
  };

  // Fast path: Client memory cache HIT
  if (clientAudioCache.has(cacheKey)) {
    const cachedAudio = clientAudioCache.get(cacheKey)!;
    playBase64Audio(cachedAudio);
    return () => {
      isCancelled = true;
      stopSpeaking();
    };
  }

  // Request Gemini High-Fidelity Neural TTS with a 2.5 second timeout
  const abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
  const abortTimeout = setTimeout(() => {
    if (abortController) abortController.abort();
  }, 2500);

  fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: cleanText,
      language: lang,
      voice: "Kore", // Natural warm voice
    }),
    signal: abortController?.signal,
  })
    .then((res) => {
      clearTimeout(abortTimeout);
      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (isCancelled) return;

      if (data.audioBase64) {
        clientAudioCache.set(cacheKey, data.audioBase64);
        playBase64Audio(data.audioBase64);
      } else {
        // Fall back to browser speech synthesis immediately
        speakWithBrowserSynthesis(cleanText, lang, startTs, onEnd, latencyMetrics, onLatencyUpdate);
      }
    })
    .catch(() => {
      clearTimeout(abortTimeout);
      if (isCancelled) return;
      speakWithBrowserSynthesis(cleanText, lang, startTs, onEnd, latencyMetrics, onLatencyUpdate);
    });

  return () => {
    isCancelled = true;
    clearTimeout(abortTimeout);
    if (abortController) abortController.abort();
    stopSpeaking();
  };
}

export function playDirectBase64Audio(
  base64Audio: string,
  onEnd?: () => void
): () => void {
  stopSpeaking();
  let isCancelled = false;

  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
  currentPlayingAudio = audio;

  audio.onended = () => {
    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
    }
    if (!isCancelled) {
      onEnd?.();
    }
  };

  audio.onerror = (e) => {
    console.warn("[Sahayak Direct Audio Playback Error]:", e);
    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
    }
    if (!isCancelled) {
      onEnd?.();
    }
  };

  audio.play().catch((playErr) => {
    console.warn("[Sahayak Audio play failed]:", playErr);
    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
    }
    if (!isCancelled) {
      onEnd?.();
    }
  });

  return () => {
    isCancelled = true;
    stopSpeaking();
  };
}

export function stopSpeaking() {
  if (activeUtteranceSafetyTimer) {
    clearTimeout(activeUtteranceSafetyTimer);
    activeUtteranceSafetyTimer = null;
  }
  activeUtterance = null;

  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.src = "";
    } catch {}
    currentPlayingAudio = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

// Convert English numerals to Bengali digits (e.g. 45 -> ৪৫)
export function toBengaliNumerals(num: string | number): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .split("")
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : bnDigits[parsed];
    })
    .join("");
}

// Speech Recognition helper
export function createSpeechRecognizer(
  lang: string = "bn-IN",
  onResult: (transcript: string) => void,
  onError?: (err: any) => void,
  onInterim?: (interim: string) => void
) {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0]?.transcript || "";
        } else {
          interimTranscript += item[0]?.transcript || "";
        }
      }

      if (interimTranscript && onInterim) {
        onInterim(interimTranscript);
      }

      const trimmed = finalTranscript.trim();
      if (trimmed.length > 0) {
        onResult(trimmed);
      }
    };

    recognition.onerror = (event: any) => {
      onError?.(event.error);
    };

    return recognition;
  } catch (e) {
    console.warn("Failed to initialize SpeechRecognition:", e);
    return null;
  }
}
