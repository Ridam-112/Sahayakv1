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
  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Map language codes to BCP 47 tags
  const langMap: Record<string, string> = {
    en: "en-IN",
    bn: "bn-IN",
    hi: "hi-IN",
    te: "te-IN",
    ta: "ta-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    kn: "kn-IN",
  };

  utterance.lang = langMap[lang] || "en-IN";
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Try to find a matched voice if available
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find((v) =>
    v.lang.toLowerCase().startsWith(lang.toLowerCase())
  );
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn("TTS Error:", e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

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
