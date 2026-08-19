import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Keyboard,
  Send,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  User,
  Volume2,
  VolumeX,
  AlertCircle,
  Play,
  Square,
  HelpCircle,
  Check,
  UserCheck,
  Zap,
  Loader2,
} from "lucide-react";
import { CitizenProfile, LanguageCode, NavTab, ConversationMessage } from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { VoiceOrb, VoiceOrbState } from "./VoiceOrb";
import { MicrophoneStateIndicator } from "./MicrophoneStateIndicator";
import { ConversationDebugDrawer, ConversationDebugInfo } from "./ConversationDebugDrawer";
import {
  speakText,
  stopSpeaking,
  playDirectBase64Audio,
  createSpeechRecognizer,
  preloadTTSAudio,
  VoiceLatencyMetrics,
} from "../utils/speech";
import { GeminiAudioRecorder } from "../utils/audioRecorder";

export type TurnState =
  | "IDLE"
  | "ASSISTANT_SPEAKING"
  | "WAITING_FOR_USER"
  | "USER_SPEAKING"
  | "PROCESSING_USER";

interface SchemeVoiceAgentProps {
  profile: CitizenProfile;
  onUpdateProfile: (updated: Partial<CitizenProfile>) => void;
  onComplete: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectNavTab: (tab: NavTab) => void;
  onBack?: () => void;
}

export const SchemeVoiceAgent: React.FC<SchemeVoiceAgentProps> = ({
  profile,
  onUpdateProfile,
  onComplete,
  currentLanguage,
  onSelectLanguage,
  onSelectNavTab,
  onBack,
}) => {
  // Turn State Machine: strict turn-taking
  const [turnState, setTurnState] = useState<TurnState>("IDLE");
  const [agentState, setAgentState] = useState<VoiceOrbState>("idle");
  const [hasStartedConversation, setHasStartedConversation] = useState<boolean>(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const [pendingQuestionKey, setPendingQuestionKey] = useState<string>("name");
  const [currentSuggestedOptions, setCurrentSuggestedOptions] = useState<string[]>([]);
  const [progressCount, setProgressCount] = useState(1);
  const [micError, setMicError] = useState<string | null>(null);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string>("");
  const [latencyMetrics, setLatencyMetrics] = useState<VoiceLatencyMetrics | null>(null);
  const [debugInfo, setDebugInfo] = useState<ConversationDebugInfo | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const audioRecorderRef = useRef<GeminiAudioRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInterruptedRef = useRef(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  const stopAllAudioCapture = () => {
    setMicVolumeLevel(0);
    setLiveInterimTranscript("");
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  // Initial debug log on mount: ensure strictly IDLE and mic OFF
  useEffect(() => {
    console.log("VOICE STATE: IDLE | microphone = OFF");
  }, []);

  // Preload greeting audio into memory as soon as component loads or language switches
  useEffect(() => {
    const greetingData = getGreetingData(currentLanguage);
    preloadTTSAudio(greetingData.spoken, currentLanguage, "Kore");
  }, [currentLanguage]);

  // Central localized greetings (Natural female conversational persona)
  const getGreetingData = (lang: LanguageCode) => {
    if (lang === "bn") {
      const bnText =
        "নমস্কার, আমি সহায়ক। আপনার প্রয়োজন এবং যোগ্যতার ভিত্তিতে উপযুক্ত সরকারি প্রকল্প খুঁজে দিতে পারি। তার জন্য আপনাকে কয়েকটি প্রশ্ন করব। প্রথমে আপনার নামটা বলুন।";
      return {
        spoken: bnText,
        text: bnText,
        textBn: bnText,
        textHi:
          "नमस्ते, मैं सहायक हूँ। आपकी ज़रूरत और पात्रता के आधार पर आपके लिए सही सरकारी योजनाएँ ढूँढने में मैं आपकी मदद कर सकती हूँ। इसके लिए मैं आपसे कुछ सवाल पूछूँगी। सबसे पहले, आपका नाम क्या है?",
        suggested: [],
      };
    } else if (lang === "hi") {
      const hiText =
        "नमस्ते, मैं सहायक हूँ। आपकी ज़रूरत और पात्रता के आधार पर आपके लिए सही सरकारी योजनाएँ ढूँढने में मैं आपकी मदद कर सकती हूँ। इसके लिए मैं आपसे कुछ सवाल पूछूँगी। सबसे पहले, आपका नाम क्या है?";
      return {
        spoken: hiText,
        text: hiText,
        textBn:
          "নমস্কার, আমি সহায়ক। আপনার প্রয়োজন এবং যোগ্যতার ভিত্তিতে উপযুক্ত সরকারি প্রকল্প খুঁজে দিতে পারি। তার জন্য আপনাকে কয়েকটি প্রশ্ন করব। প্রথমে আপনার নামটা বলুন।",
        textHi: hiText,
        suggested: [],
      };
    } else {
      const enText =
        "Hi, I'm Sahayak. I can help you find government schemes based on your needs and eligibility criteria. Let me ask you a few questions first. What's your name?";
      return {
        spoken: enText,
        text: enText,
        textBn:
          "নমস্কার, আমি সহায়ক। আপনার প্রয়োজন এবং যোগ্যতার ভিত্তিতে উপযুক্ত সরকারি প্রকল্প খুঁজে দিতে পারি। তার জন্য আপনাকে কয়েকটি প্রশ্ন করব। প্রথমে আপনার নামটা বলুন।",
        textHi:
          "नमस्ते, मैं सहायक हूँ। आपकी ज़रूरत और पात्रता के आधार पर आपके लिए सही सरकारी योजनाएँ ढूँढने में मैं आपकी मदद कर सकती हूँ। इसके लिए मैं आपसे कुछ सवाल पूछूँगी। सबसे पहले, आपका नाम क्या है?",
        suggested: [],
      };
    }
  };
  // Get active question in current language
  const getMessageText = (msg: ConversationMessage) => {
    if (currentLanguage === "bn" && msg.textBn) return msg.textBn;
    if (currentLanguage === "hi" && msg.textHi) return msg.textHi;
    return msg.text;
  };

  // Speak aloud helper with barge-in / interruption support
  const speakCurrentAgentMessage = (
    text: string,
    onDone?: () => void,
    metrics?: VoiceLatencyMetrics
  ) => {
    // 1. Enter ASSISTANT_SPEAKING state and ensure microphone is OFF
    setTurnState("ASSISTANT_SPEAKING");
    console.log("[TURN DEBUG] state = ASSISTANT_SPEAKING | microphone = OFF");

    // Stop any active speech recognition while assistant speaks
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (isAudioMuted) {
      setAgentState("listening");
      setTurnState("WAITING_FOR_USER");
      console.log("[TURN DEBUG] state = WAITING_FOR_USER (muted) | microphone = ON");
      startVoiceListening();
      onDone?.();
      return;
    }

    setAgentState("speaking");
    stopSpeaking();
    isInterruptedRef.current = false;

    speakText(
      text,
      currentLanguage,
      () => {
        // If user interrupted during speech, don't automatically override the new state
        if (!isInterruptedRef.current) {
          // 2. Only after audio finishes, transition to WAITING_FOR_USER and turn ON microphone
          setTurnState("WAITING_FOR_USER");
          console.log("[TURN DEBUG] state = WAITING_FOR_USER | microphone = ON");
          setAgentState("listening");
          startVoiceListening();
        }
        onDone?.();
      },
      metrics,
      (updated) => {
        setLatencyMetrics(updated);
      }
    );
  };

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, turnState, agentState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopAllAudioCapture();
    };
  }, []);

  // When language is switched from header during active session
  const handleLanguageChange = (newLang: LanguageCode) => {
    stopSpeaking();
    stopAllAudioCapture();
    onSelectLanguage(newLang);

    // If conversation was active, reset so user starts fresh in new language
    if (hasStartedConversation) {
      setTurnState("IDLE");
      console.log("[TURN DEBUG] state = IDLE (language changed) | microphone = OFF");
      setAgentState("idle");
      setHasStartedConversation(false);
      setMessages([]);
      setPendingQuestionKey("name");
    }
  };

  // Start Voice Listening (Gemini Direct Audio with parallel Web Speech for real-time live captions)
  const startVoiceListening = async () => {
    setMicError(null);
    setLiveInterimTranscript("");
    stopAllAudioCapture();

    // 1. Start Gemini Native Audio Recorder (high-precision multimodal audio understanding)
    try {
      const recorder = new GeminiAudioRecorder({
        volumeThreshold: 0.012,
        silenceThresholdMs: 3000,
        onVolumeChange: (vol) => {
          setMicVolumeLevel(vol);
        },
        onSpeechStart: () => {
          setTurnState("USER_SPEAKING");
          console.log("VOICE STATE: USER_SPEAKING");
        },
        onSilenceTimeout: async () => {
          if (recorder.getIsRecording()) {
            const hasSpoken = recorder.getHasSpoken() || Boolean(liveInterimTranscript);
            if (!hasSpoken) {
              // User has not spoken yet; keep waiting, do not interrupt
              return;
            }
            setTurnState("PROCESSING_USER");
            console.log("VOICE STATE: PROCESSING_USER");
            setAgentState("thinking");
            const result = await recorder.stop();
            if (result.base64 && (result.hasSpeech || recorder.getHasSpoken())) {
              handleUserAudioTurn(result.base64, result.mimeType);
            } else {
              setTurnState("WAITING_FOR_USER");
              console.log("VOICE STATE: WAITING_FOR_USER (silence loop)");
              setAgentState("listening");
              startVoiceListening();
            }
          }
        },
      });

      audioRecorderRef.current = recorder;
      await recorder.start();
      setAgentState("listening");
      console.log("VOICE RECORDER: started successfully | listening for user speech");
    } catch (recorderErr: any) {
      console.warn("Gemini Audio Recorder notice:", recorderErr);
      const errMsg = recorderErr?.message || String(recorderErr);
      if (errMsg.includes("Permission") || errMsg.includes("denied") || errMsg.includes("NotAllowedError")) {
        setMicError(
          currentLanguage === "bn"
            ? "মাইক্রোফোনের অনুমতি প্রয়োজন। অনুগ্রহ করে ব্রাউজারে অনুমতি দিন অথবা নিচে লিখুন।"
            : currentLanguage === "hi"
            ? "माइक्रोफ़ोन की अनुमति आवश्यक है। कृपया अनुमति दें या नीचे लिखें।"
            : "Microphone permission required. Please allow mic in browser or type below."
        );
      }
    }
  };

  const handleManualAudioSubmit = async () => {
    if (liveInterimTranscript && liveInterimTranscript.trim()) {
      const textToSubmit = liveInterimTranscript.trim();
      stopAllAudioCapture();
      setTurnState("PROCESSING_USER");
      setAgentState("thinking");
      handleUserReply(textToSubmit);
      return;
    }

    if (audioRecorderRef.current?.getIsRecording()) {
      const hasSpoken = audioRecorderRef.current.getHasSpoken();
      setTurnState("PROCESSING_USER");
      setAgentState("thinking");
      const result = await audioRecorderRef.current.stop();
      if (result.base64 && (hasSpoken || result.hasSpeech || result.durationMs >= 800)) {
        handleUserAudioTurn(result.base64, result.mimeType);
      } else {
        // No speech detected, resume listening smoothly
        setTurnState("WAITING_FOR_USER");
        setAgentState("listening");
        startVoiceListening();
      }
    }
  };

  // User explicitly starts the conversation
  const handleStartConversation = () => {
    const startClicked = Date.now();
    const initMetrics: VoiceLatencyMetrics = {
      startClicked,
      sessionInitStarted: startClicked,
      sessionReady: Date.now(),
    };
    setLatencyMetrics(initMetrics);

    setHasStartedConversation(true);
    setMicError(null);
    setTurnState("ASSISTANT_SPEAKING");
    console.log("VOICE STATE: ASSISTANT_SPEAKING | microphone = OFF");
    setAgentState("speaking");

    const greetingData = getGreetingData(currentLanguage);
    const initialMsg: ConversationMessage = {
      id: "msg-initial",
      sender: "agent",
      text: greetingData.text,
      textBn: greetingData.textBn,
      textHi: greetingData.textHi,
      timestamp: "Just now",
      fieldKey: "name",
      suggestedAnswers: [],
    };

    setMessages([initialMsg]);
    setCurrentSuggestedOptions([]);
    setPendingQuestionKey("name");

    console.log(`GEMINI RESPONSE: "${greetingData.spoken}"`);

    // Speak first question in the selected native language immediately (0ms delay)
    speakCurrentAgentMessage(
      greetingData.spoken,
      () => {
        textInputRef.current?.focus();
      },
      initMetrics
    );

    // Warm text input focus in parallel
    setTimeout(() => textInputRef.current?.focus(), 150);
  };

  // Toggle or Interruption handler on Voice Orb click
  const handleVoiceOrbClick = () => {
    if (turnState === "IDLE" || !hasStartedConversation) {
      handleStartConversation();
      return;
    }

    if (turnState === "ASSISTANT_SPEAKING") {
      // Barge-in / Interruption: immediately stop speech and allow user to speak
      isInterruptedRef.current = true;
      stopSpeaking();
      setTurnState("WAITING_FOR_USER");
      console.log("VOICE STATE: WAITING_FOR_USER (barge-in) | microphone = ON");
      setAgentState("listening");
      startVoiceListening();
      return;
    }

    if (turnState === "USER_SPEAKING") {
      // User tapped orb after actually speaking -> submit voice answer
      handleManualAudioSubmit();
      return;
    }

    if (turnState === "WAITING_FOR_USER") {
      // If user typed in the input box, submit the typed text
      if (typedInput.trim()) {
        stopSpeaking();
        stopAllAudioCapture();
        handleUserReply(typedInput.trim());
        return;
      }

      // If user spoke or interim transcript exists, submit voice
      if (liveInterimTranscript.trim() || audioRecorderRef.current?.getHasSpoken()) {
        handleManualAudioSubmit();
        return;
      }

      // If user hasn't spoken yet and tapped orb/mic to start speaking:
      // Ensure microphone is actively listening and ready for voice input
      if (!audioRecorderRef.current?.getIsRecording()) {
        startVoiceListening();
      }
      setAgentState("listening");
      return;
    }

    if (agentState === "stopped" || turnState === "ERROR") {
      // Resume listening
      setTurnState("WAITING_FOR_USER");
      console.log("VOICE STATE: WAITING_FOR_USER | microphone = ON");
      setAgentState("listening");
      startVoiceListening();
      return;
    }
  };

  // Strict validation: Required fields before matching schemes can run
  const isProfileCompleteForResults = (p: CitizenProfile): boolean => {
    const hasName = Boolean(p.name && String(p.name).trim().length > 0);
    const hasAge = Boolean(p.age && String(p.age).trim().length > 0);
    const hasOcc = Boolean(p.occupation && String(p.occupation).trim().length > 0);
    const hasInc = Boolean(p.income && String(p.income).trim().length > 0);

    if (!hasName || !hasAge || !hasOcc || !hasInc) return false;

    // Student specific criteria
    const isStudent =
      (p.occupation || "").toLowerCase().includes("student") ||
      (p.occupation || "").toLowerCase().includes("study") ||
      (p.occupation || "").toLowerCase().includes("college") ||
      (p.occupation || "").toLowerCase().includes("school") ||
      (p.occupation || "").toLowerCase().includes("ছাত্র");

    if (isStudent) {
      if (!p.education?.level) return false;
      if (p.education.level === "school" && (!p.education.class || String(p.education.class).trim().length === 0)) {
        return false;
      }
      if (p.education.level === "college" && (!p.education.course || String(p.education.course).trim().length === 0)) {
        return false;
      }
    }

    // Farmer specific criteria
    const isFarmer = (p.occupation || "").toLowerCase().includes("farmer") || (p.occupation || "").toLowerCase().includes("কৃষক");
    if (isFarmer && p.ownsLand === undefined) {
      return false;
    }

    return true;
  };

  // Get missing question fallback if agent attempts premature finish
  const getNextMissingQuestion = (p: CitizenProfile) => {
    const name = p.name || "";
    if (!name.trim()) {
      return {
        key: "name",
        textEn: "What is your name? What should I call you?",
        textBn: "আপনার নাম কী? প্রথমে আপনার নামটা বলুন।",
        textHi: "आपका नाम क्या है? पहले अपना नाम बताएँ।",
        suggestedAnswers: ["Rahul", "Priya", "Amit"],
      };
    }
    if (!p.age || !String(p.age).trim()) {
      return {
        key: "age",
        textEn: `Nice to meet you, ${name}! How old are you?`,
        textBn: `ধন্যবাদ ${name}। আপনার বয়স কত?`,
        textHi: `धन्यवाद ${name}। आपकी उम्र कितनी है?`,
        suggestedAnswers: ["20", "25", "35", "45", "60"],
      };
    }
    if (!p.occupation || !String(p.occupation).trim()) {
      return {
        key: "occupation",
        textEn: "What do you currently do — student, farmer, business, artisan, or job?",
        textBn: "আপনি বর্তমানে কী করেন — পড়াশোনা, চাষাবাদ, ব্যবসা, কারিগরি কাজ, নাকি চাকরি?",
        textHi: "आप वर्तमान में क्या करते हैं — पढ़ाई, खेती, व्यापार, कारीगरी, या नौकरी?",
        suggestedAnswers: ["Student (ছাত্র)", "Farmer (কৃষক)", "Business (ব্যবসা)", "Artisan (কারিগর)"],
      };
    }

    const isStudent =
      (p.occupation || "").toLowerCase().includes("student") ||
      (p.occupation || "").toLowerCase().includes("study") ||
      (p.occupation || "").toLowerCase().includes("college") ||
      (p.occupation || "").toLowerCase().includes("school") ||
      (p.occupation || "").toLowerCase().includes("ছাত্র");

    if (isStudent) {
      if (!p.education?.level) {
        return {
          key: "education_level",
          textEn: "Are you currently in school or college/university?",
          textBn: "আপনি স্কুলে পড়েন, নাকি কলেজ/বিশ্ববিদ্যালয়ে?",
          textHi: "आप स्कूल में पढ़ते हैं या कॉलेज/यूनिवर्सिटी में?",
          suggestedAnswers: ["স্কুলে পড়ি (School)", "কলেজে পড়ি (College/Univ)"],
        };
      }

      if (p.education.level === "school") {
        if (!p.education.class || String(p.education.class).trim().length === 0) {
          return {
            key: "school_class",
            textEn: "Which class are you in?",
            textBn: "আপনি কোন ক্লাসে পড়েন?",
            textHi: "आप किस कक्षा में पढ़ते हैं?",
            suggestedAnswers: ["Class 9 (নবম শ্রেণি)", "Class 10 (দশম শ্রেণি)", "Class 11 (একাদশ)", "Class 12 (দ্বাদশ)"],
          };
        }
      } else if (p.education.level === "college") {
        if (!p.education.course || String(p.education.course).trim().length === 0) {
          return {
            key: "college_course",
            textEn: "Which course or degree are you pursuing?",
            textBn: "আপনি কোন কোর্স বা ডিগ্রি করছেন?",
            textHi: "आप कौन सा कोर्स या डिग्री कर रहे हैं?",
            suggestedAnswers: ["B.A.", "B.Sc.", "B.Tech", "B.Com", "Diploma / ITI", "M.A. / M.Sc."],
          };
        }
        if (!p.education.year && !p.education.semester) {
          return {
            key: "college_year",
            textEn: "Which year or semester are you in?",
            textBn: "আপনি এখন কোন বর্ষ বা সেমিস্টারে পড়ছেন?",
            textHi: "आप अभी किस वर्ष या सेमेस्टर में हैं?",
            suggestedAnswers: ["১ম বর্ষ (1st Year)", "২য় বর্ষ (2nd Year)", "৩য় বর্ষ (3rd Year)", "৪র্থ বর্ষ (4th Year)"],
          };
        }
      }
    }

    if (!p.income || !String(p.income).trim()) {
      return {
        key: "income",
        textEn: "What is your approximate annual family income?",
        textBn: "আপনার পরিবারের আনুমানিক বার্ষিক আয় কত?",
        textHi: "आपके परिवार की अनुमानित वार्षिक आय कितनी है?",
        suggestedAnswers: ["Under ₹50,000", "₹1.5 Lakh", "₹2.5 Lakhs+", "BPL (দারিদ্র্যসীমার নিচে)"],
      };
    }
    if (p.occupation === "Farmer" && p.ownsLand === undefined) {
      return {
        key: "ownsLand",
        textEn: "Do you own cultivable agricultural land?",
        textBn: "আপনার কি নিজস্ব চাষযোগ্য কৃষিজমি আছে?",
        textHi: "क्या आपके पास अपनी खेती योग्य कृषि भूमि है?",
        suggestedAnswers: ["Yes (হ্যাঁ, আছে)", "No (না, নেই)"],
      };
    }
    return {
      key: "completed",
      textEn: "Thank you! Based on your details, I have found relevant government schemes for you.",
      textBn: "ধন্যবাদ। আপনার দেওয়া তথ্যের ভিত্তিতে আমি কিছু প্রাসঙ্গিক সরকারি প্রকল্প খুঁজে পেয়েছি।",
      textHi: "धन्यवाद। आपके द्वारा दी गई जानकारी के आधार पर मुझे कुछ उपयुक्त सरकारी योजनाएँ मिली हैं।",
      suggestedAnswers: ["View Matching Schemes"],
    };
  };

  // Process user audio directly with Gemini Multimodal AI
  const handleUserAudioTurn = async (audioBase64: string, audioMimeType: string) => {
    setAgentState("thinking");
    stopSpeaking();
    stopAllAudioCapture();

    try {
      const res = await fetch("/api/voice-agent-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          audioMimeType,
          currentProfile: profile,
          currentLanguage,
          pendingQuestionKey,
          conversationHistory: messages.map((m) => ({
            sender: m.sender,
            text: getMessageText(m),
          })),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Server error ${res.status}: ${errorText.substring(0, 150)}`);
      }

      const data = await res.json();

      if (data.hasSpeech === false || !data.userTranscript) {
        // No speech detected in audio - remain waiting for user voice
        setTurnState("WAITING_FOR_USER");
        console.log("VOICE STATE: WAITING_FOR_USER (silence/no speech in audio)");
        setAgentState("listening");
        startVoiceListening();
        return;
      }

      console.log(`VOICE INPUT RECEIVED: "${data.userTranscript}"`);

      // 1. Add user reply
      const userMsg: ConversationMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: data.userTranscript,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, userMsg]);
      setTypedInput("");

      if (data.debug) {
        setDebugInfo(data.debug);
      }

      // 2. Update profile
      let mergedProfile = { ...profile };
      if (data.extractedFields && Object.keys(data.extractedFields).length > 0) {
        onUpdateProfile(data.extractedFields);
        mergedProfile = { ...profile, ...data.extractedFields };
      }

      setProgressCount((prev) => Math.min(prev + 1, 6));

      const profileReady = isProfileCompleteForResults(mergedProfile);

      if (profileReady && (data.isReadyForResults || data.nextQuestion?.key === "completed")) {
        const finishText =
          currentLanguage === "bn"
            ? "ধন্যবাদ। আপনার দেওয়া তথ্যের ভিত্তিতে আমি কিছু প্রাসঙ্গিক সরকারি প্রকল্প খুঁজে পেয়েছি।"
            : currentLanguage === "hi"
            ? "धन्यवाद। आपके द्वारा दी गई जानकारी के आधार पर मुझे कुछ उपयुक्त सरकारी योजनाएँ मिली हैं।"
            : "Thank you! Based on your details, I have found relevant government schemes for you.";

        console.log(`GEMINI RESPONSE: "${finishText}"`);

        const finishMsg: ConversationMessage = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: "Thank you! Based on your details, I have found relevant government schemes for you.",
          textBn: "ধন্যবাদ। আপনার দেওয়া তথ্যের ভিত্তিতে আমি কিছু প্রাসঙ্গিক সরকারি প্রকল্প খুঁজে পেয়েছি।",
          textHi: "धन्यवाद। आपके द्वारा दी गई जानकारी के आधार पर मुझे कुछ उपयुक्त सरकारी योजनाएँ मिली हैं।",
          timestamp: "Just now",
          fieldKey: "completed",
        };

        setMessages((prev) => [...prev, finishMsg]);

        if (data.assistantAudioBase64) {
          setTurnState("ASSISTANT_SPEAKING");
          console.log("VOICE STATE: ASSISTANT_SPEAKING | microphone = OFF");
          setAgentState("speaking");
          playDirectBase64Audio(data.assistantAudioBase64, () => {
            setTimeout(() => onComplete(), 1200);
          });
        } else {
          speakCurrentAgentMessage(finishText, () => {
            setTimeout(() => onComplete(), 1200);
          });
        }
        return;
      }

      // 3. Next question
      let nextQ = data.nextQuestion;
      if (!profileReady && (!nextQ || nextQ.key === "completed")) {
        nextQ = getNextMissingQuestion(mergedProfile);
      }

      const agentReplyText =
        currentLanguage === "bn"
          ? nextQ.textBn || nextQ.textEn
          : currentLanguage === "hi"
          ? nextQ.textHi || nextQ.textEn
          : nextQ.textEn;

      console.log(`GEMINI RESPONSE: "${agentReplyText}"`);

      const agentMsg: ConversationMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: nextQ.textEn,
        textBn: nextQ.textBn,
        textHi: nextQ.textHi,
        timestamp: "Just now",
        fieldKey: nextQ.key,
        suggestedAnswers: nextQ.suggestedAnswers || [],
      };

      setPendingQuestionKey(nextQ.key);
      setCurrentSuggestedOptions(nextQ.suggestedAnswers || []);
      setMessages((prev) => [...prev, agentMsg]);

      // 4. Play speech and transition to WAITING_FOR_USER
      if (data.assistantAudioBase64) {
        setTurnState("ASSISTANT_SPEAKING");
        console.log("VOICE STATE: ASSISTANT_SPEAKING | microphone = OFF");
        setAgentState("speaking");
        playDirectBase64Audio(data.assistantAudioBase64, () => {
          setTurnState("WAITING_FOR_USER");
          console.log("VOICE STATE: WAITING_FOR_USER | microphone = ON");
          setAgentState("listening");
          startVoiceListening();
          setTimeout(() => textInputRef.current?.focus(), 100);
        });
      } else {
        speakCurrentAgentMessage(agentReplyText, () => {
          setTimeout(() => textInputRef.current?.focus(), 100);
        });
      }
    } catch (err) {
      console.error("Gemini Audio Turn error:", err);
      setTurnState("WAITING_FOR_USER");
      console.log("VOICE STATE: WAITING_FOR_USER | microphone = ON");
      setAgentState("listening");
      startVoiceListening();
    }
  };

  // Process user reply (typed or explicit chip selection)
  const handleUserReply = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    console.log(`VOICE INPUT RECEIVED: "${trimmed}"`);

    // 1. Add user reply to messages
    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setTypedInput("");
    setAgentState("thinking");
    stopSpeaking();
    stopAllAudioCapture();

    try {
      const res = await fetch("/api/voice-agent-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: trimmed,
          currentProfile: profile,
          currentLanguage,
          pendingQuestionKey,
          conversationHistory: messages.map((m) => ({
            sender: m.sender,
            text: getMessageText(m),
          })),
        }),
      });

      const data = await res.json();

      if (data.debug) {
        setDebugInfo(data.debug);
        console.log("[Conversation Debug]", {
          userMessage: data.debug.userMessage,
          assistantReply: data.debug.assistantReply,
          extractedFacts: data.debug.extractedFacts,
          currentProfile: data.debug.currentProfile,
          autoGeneratedUserInput: false,
          demoInput: false,
        });
      }

      // 2. Update structured user profile ONLY with extracted fields from user input
      let mergedProfile = { ...profile };
      if (data.extractedFields && Object.keys(data.extractedFields).length > 0) {
        onUpdateProfile(data.extractedFields);
        mergedProfile = { ...profile, ...data.extractedFields };
      }

      setProgressCount((prev) => Math.min(prev + 1, 6));

      // 3. HARD GUARD: Check if profile has enough real information to show results
      const profileReady = isProfileCompleteForResults(mergedProfile);

      if (profileReady && (data.isReadyForResults || data.nextQuestion?.key === "completed")) {
        const finishText =
          currentLanguage === "bn"
            ? "ধন্যবাদ। আপনার দেওয়া তথ্যের ভিত্তিতে আমি কিছু প্রাসঙ্গিক সরকারি প্রকল্প খুঁজে পেয়েছি।"
            : currentLanguage === "hi"
            ? "धन्यवाद। आपके द्वारा दी गई जानकारी के आधार पर मुझे कुछ उपयुक्त सरकारी योजनाएँ मिली हैं।"
            : "Thank you! Based on your details, I have found relevant government schemes for you.";

        const finishMsg: ConversationMessage = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: "Thank you! Based on your details, I have found relevant government schemes for you.",
          textBn: "ধন্যবাদ। আপনার দেওয়া তথ্যের ভিত্তিতে আমি কিছু প্রাসঙ্গিক সরকারি প্রকল্প খুঁজে পেয়েছি।",
          textHi: "धन्यवाद। आपके द्वारा दी गई जानकारी के आधार पर मुझे कुछ उपयुक्त सरकारी योजनाएँ मिली हैं।",
          timestamp: "Just now",
          fieldKey: "completed",
        };

        setMessages((prev) => [...prev, finishMsg]);

        speakCurrentAgentMessage(finishText, () => {
          setTimeout(() => {
            onComplete();
          }, 1200);
        });
        return;
      }

      // 4. If not ready for results yet, pick the next question
      // If AI prematurely sent 'completed' before profile was full, force next missing field
      let nextQ = data.nextQuestion;
      if (!profileReady && (!nextQ || nextQ.key === "completed")) {
        nextQ = getNextMissingQuestion(mergedProfile);
      }

      const agentReplyText =
        currentLanguage === "bn"
          ? nextQ.textBn || nextQ.textEn
          : currentLanguage === "hi"
          ? nextQ.textHi || nextQ.textEn
          : nextQ.textEn;

      console.log(`GEMINI RESPONSE: "${agentReplyText}"`);

      const agentMsg: ConversationMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: nextQ.textEn,
        textBn: nextQ.textBn,
        textHi: nextQ.textHi,
        timestamp: "Just now",
        fieldKey: nextQ.key,
        suggestedAnswers: nextQ.suggestedAnswers || [],
      };

      setPendingQuestionKey(nextQ.key);
      setCurrentSuggestedOptions(nextQ.suggestedAnswers || []);
      setMessages((prev) => [...prev, agentMsg]);

      // 5. Speak next question and then WAIT FOR REAL USER INPUT
      speakCurrentAgentMessage(agentReplyText, () => {
        // Focus text input after speech finishes
        setTimeout(() => textInputRef.current?.focus(), 100);
      });
    } catch {
      // Deterministic fallback turn
      const mergedFallback = { ...profile };
      if (pendingQuestionKey === "name") {
        mergedFallback.name = trimmed;
        onUpdateProfile({ name: trimmed });
      } else if (pendingQuestionKey === "age") {
        mergedFallback.age = trimmed;
        onUpdateProfile({ age: trimmed });
      } else if (pendingQuestionKey === "occupation") {
        if (/student|study|college|school|porashona|ছাত্র|ছাত্রী|छात्र|पढाई/i.test(trimmed)) {
          mergedFallback.occupation = "Student";
          onUpdateProfile({ occupation: "Student" });
        } else if (/farmer|krishi|chash|kisan|কৃষক|কৃষি|किसान|खेती/i.test(trimmed)) {
          mergedFallback.occupation = "Farmer";
          onUpdateProfile({ occupation: "Farmer" });
        } else {
          mergedFallback.occupation = trimmed;
          onUpdateProfile({ occupation: trimmed });
        }
      } else if (pendingQuestionKey === "education_level") {
        const isCollege = /college|university|varsity|কলেজ|বিশ্ববিদ্যালয়|कॉलेज|यूनिवर्सिटी|b\.?a|b\.?sc|b\.?tech|b\.?com|diploma|iti|m\.?a|m\.?sc|degree/i.test(trimmed);
        if (isCollege) {
          const edu = { level: "college" as const, course: null, year: null, semester: null, institution: null };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        } else {
          const edu = { level: "school" as const, class: null, board: null };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        }
      } else if (pendingQuestionKey === "school_class") {
        if (/college|university|varsity|কলেজ|বিশ্ববিদ্যালয়|कॉलेज|यूनिवर्सिटी/i.test(trimmed)) {
          const edu = { level: "college" as const, course: null, year: null, semester: null, institution: null };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        } else {
          const numMatch = trimmed.match(/\b([1-9]|1[0-2])\b/);
          const cls = numMatch ? parseInt(numMatch[1], 10) : (/দশম|10/i.test(trimmed) ? 10 : trimmed);
          const edu = { level: "school" as const, class: cls, board: null };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        }
      } else if (pendingQuestionKey === "college_course") {
        if (/school|স্কুল|স্কুলে|স্কুলে পড়ি|स्कूल/i.test(trimmed)) {
          const edu = { level: "school" as const, class: null, board: null };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        } else {
          let crs = trimmed;
          if (/b\.?sc|bsc|বিএসসি/i.test(trimmed)) crs = "B.Sc.";
          else if (/b\.?a\b|ba\b|বিএ\b/i.test(trimmed)) crs = "B.A.";
          else if (/b\.?tech|btech|engineering|ইঞ্জিনিয়ারিং/i.test(trimmed)) crs = "B.Tech";
          else if (/b\.?com|bcom|বিকম/i.test(trimmed)) crs = "B.Com";
          const edu = { ...(profile.education || {}), level: "college" as const, course: crs };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        }
      } else if (pendingQuestionKey === "college_year") {
        if (/school|স্কুল|স্কুলে|স্কুলে পড়ি|स्कूल/i.test(trimmed)) {
          const edu = { level: "school" as const, class: null, board: null };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        } else {
          let yr: number | string = 1;
          if (/1st|first|প্রথম|১ম|पहला|1/i.test(trimmed)) yr = 1;
          else if (/2nd|second|দ্বিতীয়|২য়|दूसरा|2/i.test(trimmed)) yr = 2;
          else if (/3rd|third|তৃতীয়|৩য়|तीसरा|3/i.test(trimmed)) yr = 3;
          else if (/4th|fourth|final|চতুর্থ|৪র্থ|चौथा|4/i.test(trimmed)) yr = 4;
          const edu = { ...(profile.education || {}), level: "college" as const, year: yr };
          mergedFallback.education = edu;
          onUpdateProfile({ education: edu });
        }
      } else if (pendingQuestionKey === "income") {
        mergedFallback.income = trimmed;
        onUpdateProfile({ income: trimmed });
      } else if (pendingQuestionKey === "ownsLand") {
        const owns = /yes|হ্যাঁ|हाँ|ache|আছে/i.test(trimmed);
        mergedFallback.ownsLand = owns;
        onUpdateProfile({ ownsLand: owns });
      }

      const nextMissing = getNextMissingQuestion(mergedFallback);
      const fallbackText =
        currentLanguage === "bn"
          ? nextMissing.textBn
          : currentLanguage === "hi"
          ? nextMissing.textHi
          : nextMissing.textEn;

      const fallbackMsg: ConversationMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: nextMissing.textEn,
        textBn: nextMissing.textBn,
        textHi: nextMissing.textHi,
        timestamp: "Just now",
        fieldKey: nextMissing.key,
        suggestedAnswers: nextMissing.suggestedAnswers || [],
      };

      setPendingQuestionKey(nextMissing.key);
      setCurrentSuggestedOptions(nextMissing.suggestedAnswers || []);
      setMessages((prev) => [...prev, fallbackMsg]);
      speakCurrentAgentMessage(fallbackText, () => {
        setTimeout(() => textInputRef.current?.focus(), 100);
      });
    }
  };

  const handleRepeatQuestion = () => {
    const lastAgentMsg = [...messages].reverse().find((m) => m.sender === "agent");
    if (lastAgentMsg) {
      speakCurrentAgentMessage(getMessageText(lastAgentMsg));
    }
  };

  const toggleAudioMute = () => {
    if (agentState === "speaking") stopSpeaking();
    setIsAudioMuted(!isAudioMuted);
  };

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={handleLanguageChange}
        showBack={!!onBack}
        onBack={onBack}
      />

      <main className="max-w-md mx-auto w-full px-4 py-3 space-y-3.5 flex-1 flex flex-col pb-24">
        {/* ========================================================================= */}
        {/* IDLE STATE: When user first opens Find Schemes (NO AUTO-START)            */}
        {/* ========================================================================= */}
        {!hasStartedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === "bn"
                    ? "সহায়ক ভয়েস এজেন্ট"
                    : currentLanguage === "hi"
                    ? "सहायक वॉयस एजेंट"
                    : "Find Schemes Voice Agent"}
                </span>
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {currentLanguage === "bn"
                  ? "সরকারি প্রকল্প খুঁজুন"
                  : currentLanguage === "hi"
                  ? "सरकारी योजनाएँ खोजें"
                  : "Find Schemes"}
              </h1>
            </div>

            {/* Idle Voice Avatar */}
            <div className="relative flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-700 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-2xl mb-1">🤖</span>
                <span className="text-[11px] font-bold tracking-wide">Sahayak</span>
              </div>
            </div>

            {/* Conversational Prompt */}
            <div className="max-w-xs space-y-1.5 text-center">
              <p className="text-sm font-semibold text-slate-800">
                {currentLanguage === "bn"
                  ? "“আমি আপনার জন্য প্রাসঙ্গিক সরকারি প্রকল্প খুঁজে দিতে পারি।”"
                  : currentLanguage === "hi"
                  ? "“मैं आपकी ज़रूरत के अनुसार सरकारी योजनाएँ ढूँढ सकती हूँ।”"
                  : "“I can help you find government schemes based on your needs.”"}
              </p>
              <p className="text-xs text-slate-500">
                {currentLanguage === "bn"
                  ? "সহজ কয়েকটি প্রশ্নের উত্তর দিয়ে আপনার যোগ্য প্রকল্পগুলো জানুন।"
                  : currentLanguage === "hi"
                  ? "कुछ आसान सवालों के जवाब देकर अपनी पात्र योजनाएं जानें।"
                  : "Answer a few simple questions to find schemes you qualify for."}
              </p>
            </div>

            {/* Main Explicit Start Button */}
            <div className="w-full space-y-3 pt-2 max-w-xs">
              <button
                id="btn-start-voice-conversation"
                onClick={handleStartConversation}
                className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-200 active:scale-98 transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>
                  {currentLanguage === "bn"
                    ? "Start Conversation / কথোপকথন শুরু করুন"
                    : currentLanguage === "hi"
                    ? "Start Conversation / बातचीत शुरू करें"
                    : "Start Conversation"}
                </span>
              </button>

              <div className="space-y-1 text-center">
                <p className="text-xs text-slate-400">
                  {currentLanguage === "bn"
                    ? "আপনি টাইপ করেও উত্তর দিতে পারেন।"
                    : currentLanguage === "hi"
                    ? "आप टाइप करके भी उत्तर दे सकते हैं।"
                    : "You can also type your answers."}
                </p>
                <button
                  id="btn-start-type-instead"
                  onClick={handleStartConversation}
                  className="py-1.5 px-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                >
                  {currentLanguage === "bn"
                    ? "Type instead / টাইপ করুন"
                    : currentLanguage === "hi"
                    ? "Type instead / टाइप करें"
                    : "Type instead"}
                </button>
              </div>
            </div>

            {/* Skip directly to all schemes */}
            <button
              id="btn-browse-all-schemes"
              onClick={onComplete}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer pt-4"
            >
              <span>
                {currentLanguage === "bn"
                  ? "সমস্ত স্কিমের তালিকা ব্রাউজ করুন"
                  : currentLanguage === "hi"
                  ? "सभी योजनाओं की सूची देखें"
                  : "Browse all schemes directly"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ========================================================================= */
          /* ACTIVE CONVERSATION SCREEN (STARTED EXPLICITLY)                           */
          /* ========================================================================= */
          <>
            {/* Top Status & Progress Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {agentState === "listening" ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                      </>
                    ) : agentState === "speaking" ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                    )}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Sahayak AI Assistant
                  </span>
                  {latencyMetrics?.timeToFirstAudioMs !== undefined && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-700">
                      <Zap className="w-2.5 h-2.5 text-emerald-500" />
                      <span>{latencyMetrics.timeToFirstAudioMs}ms</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAudioMute}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
                  >
                    {isAudioMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <button
                    id="btn-skip-to-results"
                    onClick={onComplete}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span>
                      {currentLanguage === "bn"
                        ? "স্কিম দেখুন"
                        : currentLanguage === "hi"
                        ? "योजनाएँ देखें"
                        : "View Schemes"}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>
                    {currentLanguage === "bn"
                      ? "প্রোফাইল যাচাই ও প্রকল্প ম্যাচিং"
                      : currentLanguage === "hi"
                      ? "प्रोफ़ाइल मिलान और योजना चयन"
                      : "Conversational Profile Matching"}
                  </span>
                  <span className="font-mono font-bold text-indigo-700">
                    {progressCount} / 5
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((progressCount / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Collected Citizen Profile Snapshot (Only populated by actual user answers!) */}
            <div className="bg-slate-100/80 rounded-xl p-2.5 border border-slate-200/80 text-[11px]">
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  {currentLanguage === "bn"
                    ? "সংগৃহীত নাগরিক প্রোফাইল:"
                    : currentLanguage === "hi"
                    ? "एकत्रित नागरिक प्रोफ़ाइल:"
                    : "Collected Citizen Profile:"}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {currentLanguage === "bn"
                    ? "(শুধুমাত্র আপনার উত্তরের ভিত্তিতে)"
                    : "(Based strictly on your answers)"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 font-medium">
                <div>
                  <span className="text-slate-400">Name: </span>
                  <span className={profile.name ? "font-bold text-slate-900" : "text-slate-400 italic"}>
                    {profile.name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Age: </span>
                  <span className={profile.age ? "font-bold text-slate-900" : "text-slate-400 italic"}>
                    {profile.age || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Occupation: </span>
                  <span className={profile.occupation ? "font-bold text-slate-900" : "text-slate-400 italic"}>
                    {profile.occupation || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Income: </span>
                  <span className={profile.income ? "font-bold text-slate-900" : "text-slate-400 italic"}>
                    {profile.income || "—"}
                  </span>
                </div>
                {profile.education?.level && (
                  <div className="col-span-2 text-[10px] bg-white/70 px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Education:</span>
                    <span className="font-bold text-indigo-700">
                      {profile.education.level === "school"
                        ? `School (Class ${profile.education.class || "Pending"})`
                        : `College (${profile.education.course || "Degree"}${profile.education.year ? `, Year ${profile.education.year}` : ""})`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Microphone access warning fallback banner if blocked */}
            {micError && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{micError}</span>
              </div>
            )}

            {/* Live Conversation Transcript Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 p-1 min-h-[160px] max-h-[260px] rounded-2xl">
              {messages.map((msg) => {
                const isAgent = msg.sender === "agent";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${
                      isAgent ? "items-start" : "items-end justify-end"
                    }`}
                  >
                    {isAgent && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs text-xs font-bold">
                        🤖
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed space-y-1.5 shadow-xs ${
                        isAgent
                          ? "bg-white text-slate-900 border border-slate-200 rounded-tl-xs"
                          : "bg-indigo-600 text-white rounded-tr-xs"
                      }`}
                    >
                      <p className="font-medium">{getMessageText(msg)}</p>

                      {/* Subtitle in English if viewing regional language */}
                      {isAgent && currentLanguage !== "en" && (
                        <p className="text-[10px] text-slate-400 font-normal">
                          {msg.text}
                        </p>
                      )}

                      {/* Replay audio button */}
                      {isAgent && (
                        <div className="pt-1 flex items-center gap-1.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => speakCurrentAgentMessage(getMessageText(msg))}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer transition-colors"
                            title="Listen again"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>
                              {currentLanguage === "bn"
                                ? "আবার শুনুন"
                                : currentLanguage === "hi"
                                ? "फिर से सुनें"
                                : "Listen again"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {!isAgent && (
                      <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Processing / Thinking Indicator */}
              {agentState === "thinking" && (
                <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150" />
                  <span className="text-[11px] font-medium text-slate-600 ml-1">
                    {currentLanguage === "bn"
                      ? "সহায়ক চিন্তা করছে..."
                      : currentLanguage === "hi"
                      ? "सहायक सोच रहा है..."
                      : "Thinking..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Answer Chips (Explicit click only when waiting for user) */}
            {currentSuggestedOptions.length > 0 && turnState === "WAITING_FOR_USER" && (
              <div className="space-y-1 pt-1">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>
                    {currentLanguage === "bn"
                      ? "উত্তরের পরামর্শ (ট্যাপ করে উত্তর দিন):"
                      : currentLanguage === "hi"
                      ? "सुझाए गए उत्तर (चुनने के लिए टैप करें):"
                      : "Suggested options (tap to choose):"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentSuggestedOptions.map((opt, i) => (
                    <button
                      key={i}
                      id={`suggested-opt-${i}`}
                      onClick={() => handleUserReply(opt)}
                      className="py-1.5 px-3 rounded-xl bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-xs font-semibold text-slate-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Indicator for Microphone State (Listening, Processing, Idle, Speaking) */}
            <MicrophoneStateIndicator
              turnState={turnState}
              currentLanguage={currentLanguage}
              volumeLevel={micVolumeLevel}
              interimTranscript={liveInterimTranscript}
              hasSpeechDetected={turnState === "USER_SPEAKING"}
              onMicClick={handleVoiceOrbClick}
            />

            {/* Voice Orb Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-col items-center justify-center space-y-2.5 text-center">
              <VoiceOrb
                state={turnState}
                onClick={handleVoiceOrbClick}
                size="md"
                volumeLevel={micVolumeLevel}
              />

              <div className="space-y-1 w-full flex flex-col items-center">
                <div className="text-xs font-bold text-slate-900">
                  {turnState === "WAITING_FOR_USER" ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      {currentLanguage === "bn"
                        ? "🎤 মাইক্রোফোন চালু — কথা বলুন বা নিচে লিখুন"
                        : currentLanguage === "hi"
                        ? "🎤 माइक्रोफ़ोन सक्रिय — बोलिए या नीचे लिखें"
                        : "🎤 Microphone active — speak or type below"}
                    </span>
                  ) : turnState === "USER_SPEAKING" ? (
                    <span className="text-indigo-700 flex items-center justify-center gap-1.5 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" />
                      {currentLanguage === "bn"
                        ? "🎙️ আপনার কথা শুনছি..."
                        : currentLanguage === "hi"
                        ? "🎙️ आपकी आवाज़ सुन रहा हूँ..."
                        : "🎙️ Listening to your voice..."}
                    </span>
                  ) : turnState === "ASSISTANT_SPEAKING" ? (
                    <span className="text-indigo-700 flex items-center justify-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                      {currentLanguage === "bn"
                        ? "সহায়ক কথা বলছে..."
                        : currentLanguage === "hi"
                        ? "सहायक बोल रहा है..."
                        : "Sahayak is speaking..."}
                    </span>
                  ) : turnState === "PROCESSING_USER" ? (
                    <span className="text-amber-700 flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {currentLanguage === "bn"
                        ? "Gemini চিন্তা করছে ও উত্তর বিশ্লেষণ করছে..."
                        : currentLanguage === "hi"
                        ? "Gemini सोच रहा है और उत्तर समझ रहा है..."
                        : "Gemini is analyzing your answer..."}
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      {currentLanguage === "bn"
                        ? "নিচে আপনার উত্তর লিখুন বা মাইকে কথা বলুন"
                        : currentLanguage === "hi"
                        ? "नीचे अपना उत्तर लिखें या माइक में बोलें"
                        : "Type your answer or tap mic to speak"}
                    </span>
                  )}
                </div>

                {/* Real-time live speech caption preview */}
                {liveInterimTranscript && (
                  <div className="w-full max-w-xs px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="truncate">Hearing: "{liveInterimTranscript}"</span>
                  </div>
                )}

                {/* 1-Tap Done Speaking / Send Button when user is speaking or listening */}
                {(turnState === "WAITING_FOR_USER" || turnState === "USER_SPEAKING") && (
                  <button
                    id="btn-done-speaking-send"
                    onClick={handleManualAudioSubmit}
                    className="w-full max-w-xs py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-95 transition-all cursor-pointer mt-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {currentLanguage === "bn"
                        ? "কথা শেষ? উত্তর জমা দিন (Send Answer)"
                        : currentLanguage === "hi"
                        ? "बोलना पूरा? उत्तर भेजें (Send Answer)"
                        : "Done Speaking? Send Answer"}
                    </span>
                  </button>
                )}
              </div>

              {/* Action buttons: Repeat / Mic Toggle */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={handleRepeatQuestion}
                  disabled={turnState === "PROCESSING_USER"}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-medium flex items-center gap-1 cursor-pointer active:scale-95 transition-all disabled:opacity-40"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {currentLanguage === "bn"
                      ? "পুনরায় শুনুন"
                      : currentLanguage === "hi"
                      ? "दोबारा सुनें"
                      : "Say Again"}
                  </span>
                </button>

                <button
                  onClick={handleVoiceOrbClick}
                  className="py-1 px-2.5 rounded-lg border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <Mic className="w-3 h-3" />
                  <span>
                    {turnState === "USER_SPEAKING"
                      ? currentLanguage === "bn"
                        ? "উত্তর জমা দিন"
                        : currentLanguage === "hi"
                        ? "उत्तर भेजें"
                        : "Submit Voice"
                      : turnState === "WAITING_FOR_USER"
                      ? currentLanguage === "bn"
                        ? "মাইক সক্রিয় (কথা বলুন)"
                        : currentLanguage === "hi"
                        ? "माइक सक्रिय (बोलिए)"
                        : "Mic Active (Speak)"
                      : turnState === "ASSISTANT_SPEAKING"
                      ? currentLanguage === "bn"
                        ? "থামান ও বলুন"
                        : currentLanguage === "hi"
                        ? "रोकें और बोलें"
                        : "Stop & Speak"
                      : currentLanguage === "bn"
                      ? "মাইক চালু করুন"
                      : currentLanguage === "hi"
                      ? "माइक चालू करें"
                      : "Speak Now"}
                  </span>
                </button>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* PROMINENT USER INPUT AREA (DEMO / MANUAL INPUT MODE)                  */}
            {/* Always visible so user/tester can type answers like 20, Student, etc. */}
            {/* ===================================================================== */}
            <div className="bg-white p-3 rounded-2xl border-2 border-indigo-500/30 shadow-md space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {currentLanguage === "bn"
                      ? "আপনার উত্তর লিখুন (User Input Area):"
                      : currentLanguage === "hi"
                      ? "अपना उत्तर लिखें (User Input Area):"
                      : "Your Answer (User Input Area):"}
                  </span>
                </span>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                  Manual Typing & Voice
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (typedInput.trim() && turnState !== "PROCESSING_USER") {
                    stopSpeaking();
                    stopAllAudioCapture();
                    handleUserReply(typedInput.trim());
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={textInputRef}
                  type="text"
                  id="input-voice-user-response"
                  value={typedInput}
                  disabled={turnState === "PROCESSING_USER"}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder={
                    pendingQuestionKey === "name"
                      ? currentLanguage === "bn"
                        ? "আপনার নাম লিখুন (যেমন: রাহুল)..."
                        : currentLanguage === "hi"
                        ? "अपना नाम लिखें (जैसे: राहुल)..."
                        : "Type your name (e.g. Rahul)..."
                      : pendingQuestionKey === "age"
                      ? currentLanguage === "bn"
                        ? "বয়স লিখুন (যেমন: 20)..."
                        : currentLanguage === "hi"
                        ? "उम्र लिखें (जैसे: 20)..."
                        : "Type age (e.g. 20)..."
                      : pendingQuestionKey === "occupation"
                      ? currentLanguage === "bn"
                        ? "পেশা লিখুন (যেমন: Student / Farmer)..."
                        : currentLanguage === "hi"
                        ? "व्यवसाय लिखें (जैसे: Student / Farmer)..."
                        : "Type occupation (e.g. Student / Farmer)..."
                      : pendingQuestionKey === "income"
                      ? currentLanguage === "bn"
                        ? "আয় লিখুন (যেমন: 1.5 lakh)..."
                        : currentLanguage === "hi"
                        ? "आय लिखें (जैसे: 1.5 lakh)..."
                        : "Type income (e.g. 1.5 lakh)..."
                      : currentLanguage === "bn"
                      ? "এখানে উত্তর টাইপ করুন..."
                      : "Type your answer..."
                  }
                  className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 focus:bg-white text-slate-900 font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  id="btn-submit-user-reply"
                  disabled={!typedInput.trim() || turnState === "PROCESSING_USER"}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>{currentLanguage === "bn" ? "পাঠান" : currentLanguage === "hi" ? "भेजें" : "Send"}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* Floating Interactive Live Debug Drawer */}
      <ConversationDebugDrawer
        debugInfo={debugInfo}
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        onOpen={() => setIsDebugOpen(true)}
      />

      <BottomNav currentTab="schemes" onSelectTab={onSelectNavTab} />
    </div>
  );
};
