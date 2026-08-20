// Web Speech API helper for Multilingual TTS and Speech Recognition in Sahayak

import { hapticMicStart, hapticMicStop, hapticSpeechDetected, hapticError } from "./haptics";

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

  // EXPLICIT REJECTION OF NON-BENGALI INDIC LOCALES (e.g. Assamese 'as-IN', Odia 'or-IN', etc.)
  if (
    langLower.startsWith("as") ||
    langLower.startsWith("or") ||
    nameLower.includes("assamese") ||
    nameLower.includes("odia") ||
    nameLower.includes("oriya")
  ) {
    return false;
  }

  if (
    langLower === "bn-in" ||
    langLower === "bn" ||
    langLower.startsWith("bn-") ||
    langLower.startsWith("bn_")
  ) {
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

  if (
    langLower.startsWith("as") ||
    langLower.startsWith("bn") ||
    nameLower.includes("bengali") ||
    nameLower.includes("assamese")
  ) {
    return false;
  }

  if (
    langLower === "hi-in" ||
    langLower === "hi" ||
    langLower.startsWith("hi-") ||
    langLower.startsWith("hi_")
  ) {
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

// Global TTS Debug State for Dev Indicator
export interface TtsDebugInfo {
  langCode: string;
  engine: "Gemini Native Audio" | "Browser SpeechSynthesis" | "None (Voice Missing)" | "Idle";
  voiceName: string;
  status: "Idle" | "Speaking" | "Aborted (Missing Voice)" | "Error";
  lastUtterancePreview?: string;
  totalVoicesInstalled: number;
  availableBengaliVoices: string[];
}

let currentTtsDebugInfo: TtsDebugInfo = {
  langCode: "bn-IN",
  engine: "Idle",
  voiceName: "None",
  status: "Idle",
  totalVoicesInstalled: 0,
  availableBengaliVoices: [],
};

const debugListeners = new Set<(info: TtsDebugInfo) => void>();

export function getTtsDebugInfo(): TtsDebugInfo {
  return currentTtsDebugInfo;
}

export function subscribeTtsDebugInfo(listener: (info: TtsDebugInfo) => void): () => void {
  debugListeners.add(listener);
  listener(currentTtsDebugInfo);
  return () => {
    debugListeners.delete(listener);
  };
}

function updateTtsDebugState(partial: Partial<TtsDebugInfo>) {
  currentTtsDebugInfo = { ...currentTtsDebugInfo, ...partial };
  debugListeners.forEach((l) => {
    try {
      l(currentTtsDebugInfo);
    } catch {}
  });
}

// Convert shorthand language code to exact BCP-47 locale tag
export function getExactLocaleCode(lang: string): string {
  switch (lang?.toLowerCase()) {
    case "bn":
    case "bn-in":
      return "bn-IN"; // Bengali (India)
    case "hi":
    case "hi-in":
      return "hi-IN"; // Hindi (India)
    case "en":
    case "en-in":
      return "en-IN"; // English (India)
    case "en-us":
      return "en-US";
    case "te":
      return "te-IN";
    case "ta":
      return "ta-IN";
    default:
      return lang ? `${lang}-IN` : "bn-IN";
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  const bnVoices = voices.filter((v) => isBengaliVoice(v)).map((v) => `${v.name} (${v.lang})`);

  updateTtsDebugState({
    totalVoicesInstalled: voices.length,
    availableBengaliVoices: bnVoices,
  });

  if (voices.length > 0 && !loggedVoicesOnce) {
    loggedVoicesOnce = true;
    console.log(`[TTS VOICES LIST] Total ${voices.length} synthesizer voices detected on this device:`);
    try {
      console.table(
        voices.map((v) => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
          default: v.default,
          uri: v.voiceURI,
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
  const exactLocale = getExactLocaleCode(lang);

  if (exactLocale === "bn-IN") {
    // 1. Strict match for Bengali (India)
    const bnInVoices = voices.filter(
      (v) => (v.lang || "").toLowerCase().replace("_", "-") === "bn-in" && isBengaliVoice(v)
    );
    if (bnInVoices.length > 0) {
      const femaleBnIn = bnInVoices.find((v) => isFemaleVoice(v));
      return femaleBnIn || bnInVoices[0];
    }

    // 2. Any verified Bengali voice
    const anyBnVoices = voices.filter((v) => isBengaliVoice(v));
    if (anyBnVoices.length > 0) {
      const femaleBn = anyBnVoices.find((v) => isFemaleVoice(v));
      return femaleBn || anyBnVoices[0];
    }

    // CRITICAL: DO NOT FALL BACK TO ASSAMESE, HINDI, OR ENGLISH.
    // Return null so the app safely displays text only rather than speaking with a wrong-language voice!
    return null;
  }

  if (exactLocale === "hi-IN") {
    const hiInVoices = voices.filter(
      (v) => (v.lang || "").toLowerCase().replace("_", "-") === "hi-in" && isHindiVoice(v)
    );
    if (hiInVoices.length > 0) {
      const femaleHiIn = hiInVoices.find((v) => isFemaleVoice(v));
      return femaleHiIn || hiInVoices[0];
    }

    const anyHiVoices = voices.filter((v) => isHindiVoice(v));
    if (anyHiVoices.length > 0) {
      const femaleHi = anyHiVoices.find((v) => isFemaleVoice(v));
      return femaleHi || anyHiVoices[0];
    }

    return null;
  }

  if (exactLocale === "en-IN" || exactLocale === "en-US") {
    const inEnVoices = voices.filter(
      (v) => (v.lang || "").toLowerCase().replace("_", "-") === "en-in" && isEnglishVoice(v)
    );
    if (inEnVoices.length > 0) {
      const femaleInEn = inEnVoices.find((v) => isFemaleVoice(v));
      return femaleInEn || inEnVoices[0];
    }

    const anyEnVoices = voices.filter((v) => isEnglishVoice(v));
    if (anyEnVoices.length > 0) {
      const femaleEn = anyEnVoices.find((v) => isFemaleVoice(v));
      return femaleEn || anyEnVoices[0];
    }

    return null;
  }

  return null;
}

let currentPlayingAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeUtteranceSafetyTimer: any = null;
let activeTrailingBufferTimer: any = null;
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
  const exactLocale = getExactLocaleCode(lang);
  const testTexts: Record<string, string> = {
    "bn-IN": "নমস্কার, আমি সহায়ক। আপনার জন্য উপযুক্ত সরকারি প্রকল্প খুঁজে দিতে আমি সাহায্য করতে পারি।",
    "hi-IN": "नमस्ते, मैं सहायक हूँ। आपके लिए सही सरकारी योजनाएँ ढूँढने में मैं आपकी मदद कर सकती हूँ।",
    "en-IN": "Hello, I am Sahayak. I can help you discover verified government welfare schemes.",
  };

  const testText = testTexts[exactLocale] || testTexts["bn-IN"];
  console.log(`[TTS LANGUAGE DEBUG] Testing isolated audio | Language code: "${exactLocale}" (requested: "${lang}")`);

  updateTtsDebugState({
    langCode: exactLocale,
    engine: "Gemini Native Audio",
    voiceName: `Kore (${exactLocale})`,
    status: "Speaking",
    lastUtterancePreview: testText,
  });

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: testText,
        language: exactLocale,
        voice: "Kore",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        stopSpeaking();
        const audioSrc = data.audioBase64.startsWith("data:")
          ? data.audioBase64
          : `data:audio/wav;base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        currentPlayingAudio = audio;
        audio.onended = () => {
          updateTtsDebugState({ status: "Idle" });
        };
        try {
          await audio.play();
        } catch (playErr) {
          console.warn("[Sahayak Isolated TTS Play notice]:", playErr);
        }
        return true;
      }
    }
  } catch (err) {
    console.warn("[Sahayak Isolated TTS Cloud Fallback]:", err);
  }

  // Resilient fallback to browser synthesis
  speakWithBrowserSynthesis(testText, exactLocale, Date.now());
  return true;
}

// Resilient browser speech synthesis runner - strictly sets exact locale and uses verified voice if available
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

  const exactLocale = getExactLocaleCode(lang);
  console.log(`[TTS LANGUAGE DEBUG] Browser SpeechSynthesis | Exact Language Code: "${exactLocale}" (requested: "${lang}")`);

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

  console.log("[AUDIO OUTPUT PIPELINE] Browser SpeechSynthesis");
  console.log("[TTS DEBUG]\npipeline = Browser TTS");

  // Preserve the complete, natural sentence. Never split into characters or romanize.
  const utterance = new SpeechSynthesisUtterance(cleanText);
  activeUtterance = utterance;

  // Set exact locale code
  utterance.lang = exactLocale;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  if (matchedVoice) {
    utterance.voice = matchedVoice;
    console.log(
      `[TTS DEBUG] Matched Voice Found: "${matchedVoice.name}" | Voice Lang: "${matchedVoice.lang}" | Assigned Lang: "${exactLocale}"`
    );
    updateTtsDebugState({
      langCode: exactLocale,
      engine: "Browser SpeechSynthesis",
      voiceName: `${matchedVoice.name} (${matchedVoice.lang})`,
      status: "Speaking",
      lastUtterancePreview: cleanText.substring(0, 60),
    });
  } else {
    console.log(
      `[TTS DEBUG] Using browser built-in synthesizer with lang="${exactLocale}"`
    );
    updateTtsDebugState({
      langCode: exactLocale,
      engine: "Browser SpeechSynthesis",
      voiceName: `Browser Native Voice (${exactLocale})`,
      status: "Speaking",
      lastUtterancePreview: cleanText.substring(0, 60),
    });
  }

  let hasEnded = false;
  const finishSpeech = () => {
    if (hasEnded) return;
    hasEnded = true;
    console.log(`[TTS] Speech END (Browser SpeechSynthesis onend fired) at ${new Date().toISOString()}`);
    console.log("[VOICE]\nassistantAudioEnded = true");
    updateTtsDebugState({
      status: "Idle",
    });
    if (activeUtteranceSafetyTimer) {
      clearTimeout(activeUtteranceSafetyTimer);
      activeUtteranceSafetyTimer = null;
    }
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }

    // Strict Buffer: Wait 400ms after speech ends before activating downstream listener/mic
    console.log(`[TTS] Applying 400ms buffer delay after TTS before signaling completion...`);
    if (activeTrailingBufferTimer) clearTimeout(activeTrailingBufferTimer);
    activeTrailingBufferTimer = setTimeout(() => {
      activeTrailingBufferTimer = null;
      console.log(`[TTS] Buffer delay completed at ${new Date().toISOString()} -> invoking onEnd callback`);
      onEnd?.();
    }, 400);
  };

  utterance.onstart = () => {
    console.log(`[TTS] Speech START (Browser SpeechSynthesis): "${cleanText.substring(0, 60)}..." [lang=${exactLocale}] at ${new Date().toISOString()}`);
    console.log("[VOICE]\nassistantAudioStarted = true");
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
    const errType = (e as any)?.error;
    if (errType === "canceled" || errType === "interrupted") {
      // Deliberate cancellation - do not trigger completion buffer or onEnd
      if (activeUtteranceSafetyTimer) {
        clearTimeout(activeUtteranceSafetyTimer);
        activeUtteranceSafetyTimer = null;
      }
      activeUtterance = null;
      return;
    }
    console.warn("Browser TTS notice:", e);
    finishSpeech();
  };

  // Safety fallback timer to prevent assistant from getting stuck if browser fails to trigger onend
  // Set generously so it NEVER cuts off genuine long Indian language utterances
  const safetyTimeoutMs = Math.max(45000, cleanText.length * 350);
  activeUtteranceSafetyTimer = setTimeout(() => {
    console.warn(`[TTS] Safety timeout reached (${safetyTimeoutMs}ms), forcing speech completion.`);
    finishSpeech();
  }, safetyTimeoutMs);

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
  }, 40);

  return () => {
    if (activeTrailingBufferTimer) {
      clearTimeout(activeTrailingBufferTimer);
      activeTrailingBufferTimer = null;
    }
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

  const exactLocale = getExactLocaleCode(lang);
  console.log(`[TTS LANGUAGE DEBUG] Language code: "${exactLocale}" (requested: "${lang}")`);

  // STOP previous audio playback and speech
  stopSpeaking();

  let isCancelled = false;
  const cacheKey = `${exactLocale}:Kore:${cleanText}`;
  const requestStarted = Date.now();

  const logMetrics = (metrics: VoiceLatencyMetrics) => {
    onLatencyUpdate?.(metrics);
  };

  const playBase64Audio = (rawAudioBase64: string) => {
    if (isCancelled) return;
    console.log("[AUDIO OUTPUT PIPELINE] Gemini Native Audio");
    console.log("[TTS DEBUG]\npipeline = Gemini Native Audio");
    console.log(`[TTS LANGUAGE DEBUG] Playing Gemini Native Audio for locale "${exactLocale}"`);
    console.log("[VOICE]\nGEMINI AUDIO RESPONSE STARTED");
    console.log("[VOICE]\nassistantAudioStarted = true");
    console.log("[VOICE DEBUG]\nAUDIO START\nassistantSpeaking = true");
    console.log("[VOICE DEBUG]\nBUFFER START\npendingBuffers = 1");
    console.log("[VOICE DEBUG]\nGEMINI TURN COMPLETE");

    updateTtsDebugState({
      langCode: exactLocale,
      engine: "Gemini Native Audio",
      voiceName: `Kore (${exactLocale})`,
      status: "Speaking",
      lastUtterancePreview: cleanText.substring(0, 60),
    });

    const audioDecodeStarted = Date.now();
    const audioSrc = rawAudioBase64.startsWith("data:")
      ? rawAudioBase64
      : `data:audio/wav;base64,${rawAudioBase64}`;
    const audio = new Audio(audioSrc);
    currentPlayingAudio = audio;

    let hasHandledCompletion = false;
    let fallbackTimer: any = null;

    const notifyPlaybackFinished = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);

      console.log(`[TTS] Speech END (Audio element ended event fired) at ${new Date().toISOString()}`);
      console.log("[VOICE DEBUG]\nBUFFER END\npendingBuffers = 0");
      console.log("[VOICE DEBUG]\nALL ASSISTANT AUDIO FINISHED");
      console.log("[VOICE]\nassistantAudioEnded = true");
      console.log("[VOICE]\nGEMINI AUDIO RESPONSE ENDED");

      updateTtsDebugState({ status: "Idle" });

      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
      }

      // Strict Buffer: Wait 400ms after speech ends before activating downstream listener/mic
      console.log(`[TTS] Applying 400ms buffer delay after TTS before signaling completion...`);
      if (activeTrailingBufferTimer) clearTimeout(activeTrailingBufferTimer);
      activeTrailingBufferTimer = setTimeout(() => {
        activeTrailingBufferTimer = null;
        if (!isCancelled) {
          console.log(`[TTS] Buffer delay completed at ${new Date().toISOString()} -> invoking onEnd callback`);
          onEnd?.();
        }
      }, 400);
    };

    audio.onplay = () => {
      console.log(`[TTS] Speech START (Gemini Native Audio): "${cleanText.substring(0, 60)}..." [lang=${exactLocale}] at ${new Date().toISOString()}`);
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

      // Long safety fallback only in case audio element hangs indefinitely
      const safetySec = audio.duration && !isNaN(audio.duration) && audio.duration > 0
        ? audio.duration + 10
        : Math.max(30, cleanText.length * 0.4);
      fallbackTimer = setTimeout(() => {
        console.warn("[TTS] Long safety timeout reached for audio playback");
        notifyPlaybackFinished();
      }, safetySec * 1000);
    };

    audio.onended = () => {
      notifyPlaybackFinished();
    };

    audio.addEventListener("ended", () => {
      notifyPlaybackFinished();
    });

    audio.onerror = (e) => {
      console.warn("[Sahayak Audio Playback Error]:", e);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
      }
      // Fall back to browser speech synthesis
      speakWithBrowserSynthesis(cleanText, exactLocale, startTs, onEnd, latencyMetrics, onLatencyUpdate);
    };

    audio.play().catch((playErr) => {
      console.warn("[Sahayak Audio Autoplay prevented/error, falling back]:", playErr);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
      }
      speakWithBrowserSynthesis(cleanText, exactLocale, startTs, onEnd, latencyMetrics, onLatencyUpdate);
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

  // Request High-Fidelity Neural TTS with an 8 second timeout
  const abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
  const abortTimeout = setTimeout(() => {
    if (abortController) abortController.abort();
  }, 8000);

  fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: cleanText,
      language: exactLocale,
      voice: "Kore", // Natural warm female voice
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
        speakWithBrowserSynthesis(cleanText, exactLocale, startTs, onEnd, latencyMetrics, onLatencyUpdate);
      }
    })
    .catch(() => {
      clearTimeout(abortTimeout);
      if (isCancelled) return;
      speakWithBrowserSynthesis(cleanText, exactLocale, startTs, onEnd, latencyMetrics, onLatencyUpdate);
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
  let hasEnded = false;
  let fallbackTimer: any = null;

  console.log("[AUDIO OUTPUT PIPELINE] Gemini Native Audio");
  console.log("[TTS DEBUG]\npipeline = Gemini Native Audio");
  console.log("[VOICE]\nGEMINI AUDIO RESPONSE STARTED");
  console.log("[VOICE]\nassistantAudioStarted = true");
  console.log("[VOICE DEBUG]\nAUDIO START\nassistantSpeaking = true");
  console.log("[VOICE DEBUG]\nBUFFER START\npendingBuffers = 1");
  console.log("[VOICE DEBUG]\nGEMINI TURN COMPLETE");

  const audioSrc = base64Audio.startsWith("data:")
    ? base64Audio
    : `data:audio/wav;base64,${base64Audio}`;
  const audio = new Audio(audioSrc);
  currentPlayingAudio = audio;

  const notifyDirectPlaybackFinished = () => {
    if (hasEnded) return;
    hasEnded = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);

    console.log(`[TTS] Speech END (Direct audio ended event fired) at ${new Date().toISOString()}`);
    console.log("[VOICE DEBUG]\nBUFFER END\npendingBuffers = 0");
    console.log("[VOICE DEBUG]\nALL ASSISTANT AUDIO FINISHED");
    console.log("[VOICE]\nassistantAudioEnded = true");
    console.log("[VOICE]\nGEMINI AUDIO RESPONSE ENDED");

    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
    }

    // Strict Buffer: Wait 400ms after speech ends before activating downstream listener/mic
    console.log(`[TTS] Applying 400ms buffer delay after direct audio before signaling completion...`);
    if (activeTrailingBufferTimer) clearTimeout(activeTrailingBufferTimer);
    activeTrailingBufferTimer = setTimeout(() => {
      activeTrailingBufferTimer = null;
      if (!isCancelled) {
        console.log(`[TTS] Direct audio buffer delay completed at ${new Date().toISOString()} -> invoking onEnd callback`);
        onEnd?.();
      }
    }, 400);
  };

  audio.onplay = () => {
    console.log(`[TTS] Speech START (Direct Base64 Audio) at ${new Date().toISOString()}`);
    const safetySec = audio.duration && !isNaN(audio.duration) && audio.duration > 0
      ? audio.duration + 10
      : 30;
    fallbackTimer = setTimeout(() => {
      console.warn("[TTS] Long safety timeout reached for direct audio playback");
      notifyDirectPlaybackFinished();
    }, safetySec * 1000);
  };

  audio.onended = () => {
    notifyDirectPlaybackFinished();
  };

  audio.addEventListener("ended", () => {
    notifyDirectPlaybackFinished();
  });

  audio.onerror = (e) => {
    console.warn("[Sahayak Direct Audio Playback Error]:", e);
    notifyDirectPlaybackFinished();
  };

  audio.play().catch((playErr) => {
    console.warn("[Sahayak Audio play failed]:", playErr);
    notifyDirectPlaybackFinished();
  });

  return () => {
    isCancelled = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    stopSpeaking();
  };
}

export function stopSpeaking() {
  if (activeTrailingBufferTimer) {
    clearTimeout(activeTrailingBufferTimer);
    activeTrailingBufferTimer = null;
  }

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
    console.warn("[VOICE INPUT] SpeechRecognition API not supported in this browser.");
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // set false for crisp, instant turn-taking
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    let lastKnownTranscript = "";

    recognition.onstart = () => {
      console.log(`[VOICE INPUT] Speech recognition session started successfully (lang: "${lang}")`);
      hapticMicStart();
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || "";
        if (item.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (interimTranscript) {
        lastKnownTranscript = interimTranscript.trim();
        console.log(`[VOICE INPUT] Interim transcript: "${interimTranscript}"`);
        hapticSpeechDetected();
        if (onInterim) onInterim(interimTranscript);
      }

      const trimmedFinal = finalTranscript.trim();
      if (trimmedFinal.length > 0) {
        lastKnownTranscript = trimmedFinal;
        console.log(`[VOICE INPUT] Raw final transcript received: "${trimmedFinal}"`);
        console.log(`[VOICE INPUT] Passing transcript to app state: "${trimmedFinal}"`);
        onResult(trimmedFinal);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("[VOICE INPUT] Recognition error event:", event.error);
      hapticError();
      onError?.(event.error);
    };

    recognition.onend = () => {
      console.log("[VOICE INPUT] Speech recognition session ended.");
      hapticMicStop();
      // If recognition ended with an interim transcript that was never marked final, flush it
      if (lastKnownTranscript && lastKnownTranscript.length > 0) {
        console.log(`[VOICE INPUT] Flushing final recognized speech on end: "${lastKnownTranscript}"`);
        onResult(lastKnownTranscript);
        lastKnownTranscript = "";
      }
    };

    return recognition;
  } catch (e) {
    console.warn("Failed to initialize SpeechRecognition:", e);
    return null;
  }
}
