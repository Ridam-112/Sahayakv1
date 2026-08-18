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
    const bnVoices = voices.filter((v) => isBengaliVoice(v));
    if (bnVoices.length === 0) {
      console.warn("[Sahayak Voice Debug] No Bengali browser TTS voice available in speechSynthesis.");
      return null; // NEVER fall back to English/Hindi for Bengali
    }

    // 1. Matched female Bengali voice
    const femaleBn = bnVoices.find((v) => isFemaleVoice(v));
    if (femaleBn) return femaleBn;

    // 2. Any non-male Bengali voice
    const nonMaleBn = bnVoices.find((v) => {
      const name = v.name.toLowerCase();
      return !MALE_VOICE_HINTS.some((m) => name.includes(m));
    });
    if (nonMaleBn) return nonMaleBn;

    // 3. Fallback to any Bengali voice
    return bnVoices[0];
  }

  if (lang === "hi") {
    const hiVoices = voices.filter((v) => isHindiVoice(v));
    if (hiVoices.length === 0) return null;

    const femaleHi = hiVoices.find((v) => isFemaleVoice(v));
    if (femaleHi) return femaleHi;

    return hiVoices[0];
  }

  if (lang === "en") {
    const enVoices = voices.filter((v) => isEnglishVoice(v));
    if (enVoices.length === 0) return null;

    // Prioritize Indian English female voices or natural English female voices
    const inEnFemale = enVoices.find(
      (v) => (v.lang.includes("IN") || v.lang.includes("in")) && isFemaleVoice(v)
    );
    if (inEnFemale) return inEnFemale;

    const femaleEn = enVoices.find((v) => isFemaleVoice(v));
    if (femaleEn) return femaleEn;

    return enVoices[0];
  }

  // Other regional languages
  const matching = voices.filter((v) =>
    (v.lang || "").toLowerCase().replace("_", "-").startsWith(lang)
  );
  if (matching.length > 0) {
    const femaleMatch = matching.find((v) => isFemaleVoice(v));
    return femaleMatch || matching[0];
  }

  return null;
}

let currentBengaliAudio: HTMLAudioElement | null = null;
const clientAudioCache = new Map<string, string>();

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
  voice: string = "Aoede"
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

// Isolated Bengali Audio test function
export async function testBengaliAudioIsolated(): Promise<boolean> {
  const testText =
    "নমস্কার, আমি সহায়ক। আপনার জন্য উপযুক্ত সরকারি প্রকল্প খুঁজে দিতে আমি সাহায্য করতে পারি। প্রথমে আপনার নামটা বলুন।";
  console.log(`[Sahayak Audio Debug]
language = bn
text = "${testText}"
engine = "Gemini TTS"
voice = Aoede
browserSpeechSynthesisUsed = false`);

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: testText,
        language: "bn",
        voice: "Aoede",
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS server response error: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.audioBase64) {
      console.log(`[Sahayak Audio Debug]
language = bn
text = "${testText}"
engine = "Gemini TTS"
voice = Aoede
browserSpeechSynthesisUsed = false
audioGenerated = true
audioPlaybackStarted = true`);

      const audio = new Audio(data.audioBase64);
      currentBengaliAudio = audio;
      await audio.play();
      return true;
    }
    return false;
  } catch (err) {
    console.error("[Sahayak Isolated Bengali TTS Error]:", err);
    return false;
  }
}

export function speakText(
  text: string,
  lang: string = "bn",
  onEnd?: () => void,
  latencyMetrics?: VoiceLatencyMetrics,
  onLatencyUpdate?: (metrics: VoiceLatencyMetrics) => void
): () => void {
  const startTs = latencyMetrics?.startClicked || Date.now();
  // Normalize text - remove markdown or noisy symbols while preserving Bengali Unicode
  const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
  if (!cleanText) {
    onEnd?.();
    return () => {};
  }

  // STOP previous audio playback and speech
  stopSpeaking();

  // PATH B: BENGALI USES GEMINI HIGH-FIDELITY TTS (TOTALLY BYPASSES BROWSER SPEECH SYNTHESIS)
  if (lang === "bn") {
    let isCancelled = false;
    const cacheKey = `bn:Aoede:${cleanText}`;
    const requestStarted = Date.now();

    const logMetrics = (metrics: VoiceLatencyMetrics) => {
      console.log(`[Voice Latency]
startClicked: 0 ms
sessionInitStarted: ${metrics.sessionInitStarted ? metrics.sessionInitStarted - startTs : 0} ms
sessionReady: ${metrics.sessionReady ? metrics.sessionReady - startTs : 0} ms
requestStarted: ${metrics.requestStarted ? metrics.requestStarted - startTs : 0} ms
firstAudioChunkReceived: ${metrics.firstAudioChunkReceived ? metrics.firstAudioChunkReceived - startTs : 0} ms
audioPlaybackStarted: ${metrics.audioPlaybackStarted ? metrics.audioPlaybackStarted - startTs : 0} ms
timeToFirstAudio: ${metrics.timeToFirstAudioMs} ms`);
      onLatencyUpdate?.(metrics);
    };

    const playBase64Audio = (audioBase64: string) => {
      if (isCancelled) return;
      const audioDecodeStarted = Date.now();
      const audio = new Audio(audioBase64);
      currentBengaliAudio = audio;

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
        if (currentBengaliAudio === audio) {
          currentBengaliAudio = null;
        }
        onEnd?.();
      };

      audio.onerror = (e) => {
        console.warn("[Sahayak Bengali Audio Playback Error]:", e);
        if (currentBengaliAudio === audio) {
          currentBengaliAudio = null;
        }
        onEnd?.();
      };

      audio.play().catch((playErr) => {
        console.warn("[Sahayak Audio Play Autoplay/Error]:", playErr);
        onEnd?.();
      });
    };

    // Fast path: Check client-side preloaded cache
    if (clientAudioCache.has(cacheKey)) {
      const cachedAudio = clientAudioCache.get(cacheKey)!;
      const firstAudioChunkReceived = Date.now();
      console.log(`[Sahayak Audio Debug] Client Memory Cache HIT | Fast Startup`);
      playBase64Audio(cachedAudio);
      return () => {
        isCancelled = true;
        if (currentBengaliAudio) {
          currentBengaliAudio.pause();
          currentBengaliAudio.src = "";
          currentBengaliAudio = null;
        }
      };
    }

    console.log(`[Sahayak Audio Debug]
language = bn
text = "${cleanText}"
engine = "Gemini TTS"
voice = Aoede
browserSpeechSynthesisUsed = false`);

    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: cleanText,
        language: "bn",
        voice: "Aoede", // High quality female voice
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;

        if (data.audioBase64) {
          clientAudioCache.set(cacheKey, data.audioBase64);
          console.log(`[Sahayak Audio Debug]
language = bn
text = "${cleanText}"
engine = "Gemini TTS"
voice = Aoede
browserSpeechSynthesisUsed = false
audioGenerated = true
audioPlaybackStarted = true`);

          playBase64Audio(data.audioBase64);
        } else {
          // Fall back to browser speech synthesis if server TTS is cooling down
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
              const utterance = new SpeechSynthesisUtterance(cleanText);
              utterance.lang = "bn-IN";
              utterance.rate = 0.95;
              const voices = getAvailableVoices();
              const matched = findBestVoiceForLanguage(voices, "bn");
              if (matched) utterance.voice = matched;
              utterance.onend = () => onEnd?.();
              utterance.onerror = () => onEnd?.();
              window.speechSynthesis.speak(utterance);
              return;
            } catch {
              onEnd?.();
            }
          } else {
            onEnd?.();
          }
        }
      })
      .catch(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = "bn-IN";
            utterance.rate = 0.95;
            const voices = getAvailableVoices();
            const matched = findBestVoiceForLanguage(voices, "bn");
            if (matched) utterance.voice = matched;
            utterance.onend = () => onEnd?.();
            utterance.onerror = () => onEnd?.();
            window.speechSynthesis.speak(utterance);
            return;
          } catch {
            onEnd?.();
          }
        } else {
          onEnd?.();
        }
      });

    return () => {
      isCancelled = true;
      if (currentBengaliAudio) {
        currentBengaliAudio.pause();
        currentBengaliAudio.src = "";
        currentBengaliAudio = null;
      }
    };
  }

  // PATH A: HINDI AND ENGLISH USE BROWSER SPEECH SYNTHESIS
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    onEnd?.();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);

  if (lang === "hi") {
    utterance.lang = "hi-IN";
  } else {
    utterance.lang = "en-IN";
  }

  utterance.rate = 0.94; // Calm, respectful, natural pacing
  utterance.pitch = 1.05; // Pleasant, warm female pitch

  const voices = getAvailableVoices();
  const matchedVoice = findBestVoiceForLanguage(voices, lang);

  console.log(
    `[Sahayak Voice TTS] Language: ${lang} | Voice: ${matchedVoice ? matchedVoice.name : "System Default"} | Locale: ${utterance.lang} | Source: browser speechSynthesis`
  );

  if (matchedVoice) {
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang;
  }

  // Handle Chrome async voices loading if not ready yet
  if (!matchedVoice && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      const updatedMatch = findBestVoiceForLanguage(updatedVoices, lang);
      if (updatedMatch) {
        utterance.voice = updatedMatch;
        utterance.lang = updatedMatch.lang;
      }
    };
  }

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
    console.log(`[Voice Latency]
startClicked: 0 ms
sessionInitStarted: ${metrics.sessionInitStarted ? metrics.sessionInitStarted - startTs : 0} ms
sessionReady: ${metrics.sessionReady ? metrics.sessionReady - startTs : 0} ms
audioPlaybackStarted: ${timeToFirstAudioMs} ms
timeToFirstAudio: ${timeToFirstAudioMs} ms`);
    onLatencyUpdate?.(metrics);
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    if ((e as any).error !== "canceled" && (e as any).error !== "interrupted") {
      console.warn("TTS Notice/Error:", e);
    }
    onEnd?.();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis speak error:", err);
    onEnd?.();
  }

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking() {
  if (currentBengaliAudio) {
    try {
      currentBengaliAudio.pause();
      currentBengaliAudio.src = "";
    } catch {}
    currentBengaliAudio = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
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
  onError?: (err: any) => void
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
    recognition.continuous = false;
    recognition.interimResults = false; // NEVER auto-trigger on interim partial audio
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i] && event.results[i].isFinal) {
          finalTranscript += event.results[i][0]?.transcript || "";
        }
      }

      // If browser did not flag isFinal but returned results on non-continuous mode
      if (!finalTranscript && event.results[0] && event.results[0][0]) {
        finalTranscript = event.results[0][0].transcript || "";
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
