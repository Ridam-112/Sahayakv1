// Web Speech API helper for Multilingual TTS and Speech Recognition in Sahayak

export function speakText(
  text: string,
  lang: string = "en",
  onEnd?: () => void
): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    onEnd?.();
    return () => {};
  }

  // Cancel ongoing speech
  window.speechSynthesis.cancel();

  // Normalize text - remove markdown or noisy symbols
  const cleanText = text.replace(/[*_#`[\]()]/g, " ").trim();
  if (!cleanText) {
    onEnd?.();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Map language codes to BCP 47 tags (including regional variants)
  const langMap: Record<string, string[]> = {
    bn: ["bn-IN", "bn-BD", "bn_IN", "bn_BD", "bn"],
    hi: ["hi-IN", "hi_IN", "hi"],
    en: ["en-IN", "en-GB", "en-US", "en_IN", "en"],
    te: ["te-IN", "te_IN", "te"],
    ta: ["ta-IN", "ta_IN", "ta"],
    mr: ["mr-IN", "mr_IN", "mr"],
    gu: ["gu-IN", "gu_IN", "gu"],
    kn: ["kn-IN", "kn_IN", "kn"],
  };

  const targetCodes = langMap[lang] || [lang, "en-IN"];
  // Set default primary language tag on utterance
  utterance.lang = targetCodes[0] || "bn-IN";
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Try to find a matched voice across available voices
  const findMatchingVoice = (voices: SpeechSynthesisVoice[]) => {
    if (!voices || voices.length === 0) return null;

    // 1. Exact match with any target code
    for (const code of targetCodes) {
      const match = voices.find(
        (v) =>
          v.lang.toLowerCase() === code.toLowerCase() ||
          v.lang.toLowerCase().replace("_", "-") === code.toLowerCase().replace("_", "-")
      );
      if (match) return match;
    }

    // 2. Starts with language prefix (e.g. 'bn' or 'hi')
    const prefix = lang.toLowerCase();
    const prefixMatch = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith(prefix) ||
        v.name.toLowerCase().includes("bengali") ||
        (prefix === "bn" && (v.name.toLowerCase().includes("bangla") || v.name.toLowerCase().includes("bn")))
    );
    if (prefixMatch) return prefixMatch;

    return null;
  };

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = findMatchingVoice(voices);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang;
  }

  // Handle Chrome async voices loading
  if (!matchedVoice && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      const updatedMatch = findMatchingVoice(updatedVoices);
      if (updatedMatch) {
        utterance.voice = updatedMatch;
        utterance.lang = updatedMatch.lang;
      }
    };
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    // If canceled manually, ignore error
    if ((e as any).error !== "canceled" && (e as any).error !== "interrupted") {
      console.warn("TTS Error:", e);
    }
    onEnd?.();
  };

  // Safe speak call
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
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      onResult(transcript);
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
