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
  MapPin,
  TrendingUp,
  BarChart3,
  Globe2,
} from "lucide-react";
import {
  CitizenDevelopmentRequest,
  LanguageCode,
  NavTab,
  ConversationMessage,
} from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { VoiceOrb, TurnState, VoiceOrbState } from "./VoiceOrb";
import { MicrophoneStateIndicator } from "./MicrophoneStateIndicator";
import {
  speakText,
  stopSpeaking,
  playDirectBase64Audio,
  createSpeechRecognizer,
  preloadTTSAudio,
  VoiceLatencyMetrics,
} from "../utils/speech";
import { GeminiAudioRecorder } from "../utils/audioRecorder";
import { getCategoryMeta, classifyCitizenTextLocally } from "../data/developmentData";
import { ConversationDebugDrawer, ConversationDebugInfo } from "./ConversationDebugDrawer";

interface DevelopmentVoiceAgentProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSaveRequest: (request: CitizenDevelopmentRequest) => void;
  onViewDashboard: () => void;
  onSelectNavTab: (tab: NavTab) => void;
  onBack?: () => void;
}

export const DevelopmentVoiceAgent: React.FC<DevelopmentVoiceAgentProps> = ({
  currentLanguage,
  onSelectLanguage,
  onSaveRequest,
  onViewDashboard,
  onSelectNavTab,
  onBack,
}) => {
  // Strict Turn-Taking State Machine: IDLE | ASSISTANT_SPEAKING | WAITING_FOR_USER | USER_SPEAKING | PROCESSING_USER
  const [turnState, setTurnState] = useState<TurnState>("IDLE");
  const [hasStartedConversation, setHasStartedConversation] = useState<boolean>(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const [conversationStep, setConversationStep] = useState<number>(1);
  const [currentSuggestedOptions, setCurrentSuggestedOptions] = useState<string[]>([]);
  const [collectedData, setCollectedData] = useState<Partial<CitizenDevelopmentRequest>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [savedRequest, setSavedRequest] = useState<CitizenDevelopmentRequest | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [latencyMetrics, setLatencyMetrics] = useState<VoiceLatencyMetrics | null>(null);
  const [debugInfo, setDebugInfo] = useState<ConversationDebugInfo | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const audioRecorderRef = useRef<GeminiAudioRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInterruptedRef = useRef(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  const stopAllAudioCapture = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  // Exact required localized first greetings
  const getGreetingData = (lang: LanguageCode) => {
    if (lang === "bn") {
      const bnText =
        "নমস্কার, আমি সহায়ক। আপনার এলাকার সমস্যা বা উন্নয়নের প্রয়োজনীয়তা বুঝতে আমি আপনাকে সাহায্য করতে পারি। আপনি যা বলতে চান, নিজের মতো করে বলুন।";
      return {
        spoken: bnText,
        text: bnText,
        textBn: bnText,
        textHi:
          "नमस्ते, मैं सहायक हूँ। मैं आपके क्षेत्र की समस्या या विकास की ज़रूरत को समझने में आपकी मदद कर सकती हूँ। आप अपनी बात अपने तरीके से बताइए।",
        suggested: ["আমাদের এলাকায় ভালো হাসপাতাল নেই", "রাস্তাঘাট খুব খারাপ", "পানীয় জলের সমস্যা"],
      };
    } else if (lang === "hi") {
      const hiText =
        "नमस्ते, मैं सहायक हूँ। मैं आपके क्षेत्र की समस्या या विकास की ज़रूरत को समझने में आपकी मदद कर सकती हूँ। आप अपनी बात अपने तरीके से बताइए।";
      return {
        spoken: hiText,
        text: hiText,
        textBn:
          "নমস্কার, আমি সহায়ক। আপনার এলাকার সমস্যা বা উন্নয়নের প্রয়োজনীয়তা বুঝতে আমি আপনাকে সাহায্য করতে পারি। আপনি যা বলতে চান, নিজের মতো করে বলুন।",
        textHi: hiText,
        suggested: ["हमारे क्षेत्र में अस्पताल नहीं है", "सड़क की हालत बहुत खराब है", "पीने के पानी की समस्या है"],
      };
    } else {
      const enText =
        "Hello, I'm Sahayak. I can help understand problems or development needs in your area. Tell me about it in your own words.";
      return {
        spoken: enText,
        text: enText,
        textBn:
          "নমস্কার, আমি সহায়ক। আপনার এলাকার সমস্যা বা উন্নয়নের প্রয়োজনীয়তা বুঝতে আমি আপনাকে সাহায্য করতে পারি। আপনি যা বলতে চান, নিজের মতো করে বলুন।",
        textHi:
          "नमस्ते, मैं सहायक हूँ। मैं आपके क्षेत्र की समस्या या विकास की ज़रूरत को समझने में आपकी मदद कर सकती हूँ। आप अपनी बात अपने तरीके से बताइए।",
        suggested: ["No good hospital in our area", "Road is completely broken", "Drinking water shortage"],
      };
    }
  };

  // Initial mount: explicitly IDLE, microphone OFF
  useEffect(() => {
    console.log("VOICE STATE: IDLE | microphone = OFF");
    const greeting = getGreetingData(currentLanguage);
    preloadTTSAudio(greeting.spoken, currentLanguage, "Kore");
  }, [currentLanguage]);

  // Assistant speaking routine with strict turn completion
  const speakCurrentAgentMessage = (
    text: string,
    onDone?: () => void
  ) => {
    if (isAudioMuted) {
      setTurnState("WAITING_FOR_USER");
      console.log("VOICE STATE: WAITING_FOR_USER | microphone = ON");
      startVoiceListening();
      onDone?.();
      return;
    }

    setTurnState("ASSISTANT_SPEAKING");
    console.log("VOICE STATE: ASSISTANT_SPEAKING | microphone = OFF");
    stopAllAudioCapture();
    stopSpeaking();
    isInterruptedRef.current = false;

    speakText(
      text,
      currentLanguage,
      () => {
        // Only activate user input AFTER assistant audio completely finishes
        if (!isInterruptedRef.current) {
          setTurnState("WAITING_FOR_USER");
          console.log("VOICE STATE: WAITING_FOR_USER | microphone = ON");
          startVoiceListening();
          onDone?.();
        }
      },
      undefined,
      (metric) => {
        setLatencyMetrics(metric);
      }
    );
  };

  // Start Gemini Audio Recording with Speech Recognition fallback
  const startVoiceListening = async () => {
    stopAllAudioCapture();
    setMicError(null);

    try {
      const recorder = new GeminiAudioRecorder({
        volumeThreshold: 0.03,
        silenceThresholdMs: 1800,
        onSpeechStart: () => {
          setTurnState("USER_SPEAKING");
          console.log("VOICE STATE: USER_SPEAKING");
        },
        onSilenceTimeout: async () => {
          if (recorder.getIsRecording()) {
            setTurnState("PROCESSING_USER");
            console.log("VOICE STATE: PROCESSING_USER");
            const result = await recorder.stop();
            if (result.base64 && result.hasSpeech) {
              handleCitizenAudioInput(result.base64, result.mimeType);
            } else {
              setTurnState("WAITING_FOR_USER");
              startVoiceListening();
            }
          }
        },
      });

      audioRecorderRef.current = recorder;
      await recorder.start();
    } catch (e) {
      console.warn("Gemini audio recorder notice, falling back to Web Speech:", e);
      fallbackToSpeechRecognition();
    }
  };

  const fallbackToSpeechRecognition = () => {
    try {
      const recog = createSpeechRecognizer(
        currentLanguage === "bn" ? "bn-IN" : currentLanguage === "hi" ? "hi-IN" : "en-IN",
        (transcript) => {
          if (transcript && transcript.trim()) {
            setTurnState("PROCESSING_USER");
            console.log("VOICE STATE: PROCESSING_USER");
            handleCitizenInput(transcript.trim());
          }
        },
        (error) => {
          console.warn("Speech recognition error:", error);
          if (error === "not-allowed" || error === "permission-denied") {
            setMicError("Microphone permission denied. You can type below.");
          }
        }
      );

      if (recog) {
        recognitionRef.current = recog;
        recog.start();
      }
    } catch (e) {
      console.warn("Recognizer setup failed:", e);
    }
  };

  const stopVoiceListening = () => {
    stopAllAudioCapture();
    stopSpeaking();
    setTurnState("IDLE");
    console.log("VOICE STATE: IDLE | microphone = OFF");
  };

  // Initial user-triggered start: Sahayak speaks FIRST
  const handleStartConversation = () => {
    setHasStartedConversation(true);
    setTurnState("ASSISTANT_SPEAKING");
    console.log("VOICE STATE: ASSISTANT_SPEAKING | microphone = OFF");
    stopAllAudioCapture();

    const greeting = getGreetingData(currentLanguage);
    const initialMsg: ConversationMessage = {
      id: "msg-greeting",
      sender: "agent",
      text: greeting.text,
      textBn: greeting.textBn,
      textHi: greeting.textHi,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([initialMsg]);
    setCurrentSuggestedOptions(greeting.suggested);
    console.log(`GEMINI RESPONSE: "${greeting.spoken}"`);
    speakCurrentAgentMessage(greeting.spoken);
  };

  // Process audio turn directly
  const handleCitizenAudioInput = async (audioBase64: string, audioMimeType: string) => {
    setTurnState("PROCESSING_USER");
    console.log("VOICE STATE: PROCESSING_USER");
    stopSpeaking();
    stopAllAudioCapture();

    try {
      const response = await fetch("/api/development-agent-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          audioMimeType,
          currentLanguage,
          conversationStep,
          collectedData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Server error ${response.status}: ${errorText.substring(0, 150)}`);
      }

      const turnResult = await response.json();

      if (turnResult.hasSpeech === false || !turnResult.userTranscript) {
        setTurnState("WAITING_FOR_USER");
        console.log("VOICE STATE: WAITING_FOR_USER (silence/no speech)");
        startVoiceListening();
        return;
      }

      console.log(`VOICE INPUT RECEIVED: "${turnResult.userTranscript}"`);

      const userMsg: ConversationMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: turnResult.userTranscript,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setTypedInput("");

      applyTurnResponse(turnResult, turnResult.userTranscript);
    } catch (err) {
      console.error("Citizen audio turn error:", err);
      setTurnState("WAITING_FOR_USER");
      startVoiceListening();
    }
  };

  const applyTurnResponse = (turnResult: any, inputText: string) => {
    const updatedData: Partial<CitizenDevelopmentRequest> = {
      ...collectedData,
      ...turnResult.extracted,
      originalText: collectedData.originalText
        ? `${collectedData.originalText} | ${inputText}`
        : inputText,
      language: currentLanguage,
    };

    if (turnResult.extracted?.category) {
      updatedData.category = turnResult.extracted.category;
    }
    if (turnResult.extracted?.location) {
      updatedData.location = {
        country: "India",
        state: turnResult.extracted.location.state || collectedData.location?.state || "West Bengal",
        district: turnResult.extracted.location.district || collectedData.location?.district || "Dakshin Dinajpur",
        city: turnResult.extracted.location.city || collectedData.location?.city || "Balurghat",
      };
    }

    if (turnResult?.debug) {
      setDebugInfo(turnResult.debug);
    }

    setCollectedData(updatedData);
    setConversationStep(turnResult.nextStep || conversationStep + 1);

    const agentReplyMsg: ConversationMessage = {
      id: `agent-${Date.now()}`,
      sender: "agent",
      text: turnResult.replyText,
      textBn: turnResult.replyTextBn || turnResult.replyText,
      textHi: turnResult.replyTextHi || turnResult.replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, agentReplyMsg]);
    setCurrentSuggestedOptions(turnResult.suggestedAnswers || []);
    console.log(`GEMINI RESPONSE: "${turnResult.replyText}"`);

    if (turnResult.isComplete || conversationStep >= 3) {
      const finalRequest: CitizenDevelopmentRequest = {
        requestId: `REQ-${Date.now().toString().slice(-5)}`,
        language: currentLanguage,
        originalText: updatedData.originalText || inputText,
        category: updatedData.category || "healthcare",
        subCategory: `${updatedData.category || "healthcare"}_access`,
        location: updatedData.location || {
          country: "India",
          state: "West Bengal",
          district: "Dakshin Dinajpur",
          city: "Balurghat",
        },
        problem:
          updatedData.problem ||
          updatedData.originalText ||
          "Citizen reported local infrastructure need",
        urgency: updatedData.urgency || "high",
        affectedPopulation: updatedData.affectedPopulation || "community",
        citizenSuggestedSolution: updatedData.citizenSuggestedSolution || null,
        timestamp: "Just now",
        source: "voice",
        verifiedStatus: "verified",
        priorityScoreEstimate: 92,
      };

      setIsCompleted(true);
      setSavedRequest(finalRequest);
      onSaveRequest(finalRequest);

      if (turnResult.assistantAudioBase64) {
        setTurnState("ASSISTANT_SPEAKING");
        console.log("VOICE STATE: ASSISTANT_SPEAKING");
        playDirectBase64Audio(turnResult.assistantAudioBase64, () => {
          setTurnState("IDLE");
          console.log("VOICE STATE: IDLE | microphone = OFF");
        });
      } else {
        speakCurrentAgentMessage(turnResult.replyText, () => {
          setTurnState("IDLE");
          console.log("VOICE STATE: IDLE | microphone = OFF");
        });
      }
      return;
    }

    if (turnResult.assistantAudioBase64) {
      setTurnState("ASSISTANT_SPEAKING");
      console.log("VOICE STATE: ASSISTANT_SPEAKING");
      playDirectBase64Audio(turnResult.assistantAudioBase64, () => {
        setTurnState("WAITING_FOR_USER");
        console.log("VOICE STATE: WAITING_FOR_USER");
        startVoiceListening();
      });
    } else {
      speakCurrentAgentMessage(turnResult.replyText);
    }
  };

  // Main turn processor (text or quick options)
  const handleCitizenInput = async (inputText: string) => {
    if (!inputText.trim()) return;

    console.log(`VOICE INPUT RECEIVED: "${inputText.trim()}"`);

    // Transition to PROCESSING_USER and disable microphone immediately
    setTurnState("PROCESSING_USER");
    console.log("VOICE STATE: PROCESSING_USER | microphone = OFF");
    stopSpeaking();
    stopAllAudioCapture();

    // Add user message
    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTypedInput("");

    // Call server AI endpoint with fast local fallback
    try {
      const response = await fetch("/api/development-agent-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: inputText,
          currentLanguage,
          conversationStep,
          collectedData,
        }),
      });

      let turnResult: any = null;
      if (response.ok) {
        turnResult = await response.json();
      }

      if (!turnResult || !turnResult.replyText) {
        // Local fallback
        const localClassified = classifyCitizenTextLocally(inputText);
        turnResult = {
          extracted: localClassified,
          replyText:
            currentLanguage === "bn"
              ? "ধন্যবাদ, আপনার এলাকার এই সমস্যাটি নথিবদ্ধ করা হয়েছে। আপনি কি আর কিছু যোগ করতে চান?"
              : currentLanguage === "hi"
              ? "धन्यवाद, आपके क्षेत्र की यह समस्या दर्ज कर ली गई है। क्या आप कुछ और जोड़ना चाहते हैं?"
              : "Thank you, this issue has been recorded. Would you like to add anything else?",
          nextStep: conversationStep + 1,
          isComplete: conversationStep >= 2,
          suggestedAnswers: [],
        };
      }

      applyTurnResponse(turnResult, inputText);
    } catch {
      const localClassified = classifyCitizenTextLocally(inputText);
      applyTurnResponse({
        extracted: localClassified,
        replyText:
          currentLanguage === "bn"
            ? "ধন্যবাদ, আপনার এলাকার এই সমস্যাটি নথিবদ্ধ করা হয়েছে।"
            : "Thank you, this issue has been recorded.",
        nextStep: conversationStep + 1,
        isComplete: true,
        suggestedAnswers: [],
      }, inputText);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, turnState]);

  const isAssistantSpeaking = turnState === "ASSISTANT_SPEAKING";
  const isWaitingForUser = turnState === "WAITING_FOR_USER";
  const isProcessing = turnState === "PROCESSING_USER";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
        showBack={true}
        onBack={onBack}
      />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-3 pb-8 flex flex-col justify-between">
        {/* Top Status & Mode Banner */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-xs mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isWaitingForUser ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </>
              ) : isAssistantSpeaking ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
              )}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {isAssistantSpeaking
                ? currentLanguage === "bn"
                  ? "সহায়ক কথা বলছে..."
                  : currentLanguage === "hi"
                  ? "सहायक बोल रहा है..."
                  : "Sahayak Speaking..."
                : isWaitingForUser
                ? currentLanguage === "bn"
                  ? "আপনার কথা বলুন (মাইক সক্রিয়)"
                  : currentLanguage === "hi"
                  ? "अपनी बात कहें (माइक सक्रिय)"
                  : "Listening to You..."
                : isProcessing
                ? currentLanguage === "bn"
                  ? "চিন্তা করছে..."
                  : currentLanguage === "hi"
                  ? "सोच रहा है..."
                  : "Processing..."
                : "Sahayak Voice Agent"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Female AI Voice
            </span>
          </div>
        </div>

        {/* Start Button Gate or Active Voice Interface */}
        {!hasStartedConversation ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-md my-auto space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg">
              <Mic className="w-10 h-10 animate-bounce stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                {currentLanguage === "bn"
                  ? "সহায়ক সাহায্য করার জন্য প্রস্তুত"
                  : currentLanguage === "hi"
                  ? "सहायक मदद के लिए तैयार है"
                  : "Sahayak is Ready to Help"}
              </h2>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {currentLanguage === "bn"
                  ? "বোতামটি চাপলে সহায়ক প্রথমে কথা বলবে, তারপর আপনার কথা শুনবে।"
                  : currentLanguage === "hi"
                  ? "बटन दबाने पर सहायक पहले बोलेगा, फिर आपकी बात सुनेगा।"
                  : "Tap the button below. Sahayak will speak first, then listen to your problem."}
              </p>
            </div>

            <button
              id="start-dev-voice-btn"
              onClick={handleStartConversation}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2.5 text-base transition-all transform active:scale-98 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {currentLanguage === "bn"
                  ? "কথোপকথন শুরু করুন"
                  : currentLanguage === "hi"
                  ? "बातचीत शुरू करें"
                  : "Start Conversation"}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between space-y-3">
            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto max-h-[46vh] space-y-3 pr-1">
              {messages.map((msg) => {
                const isAgent = msg.sender === "agent";
                const display =
                  currentLanguage === "bn" && msg.textBn
                    ? msg.textBn
                    : currentLanguage === "hi" && msg.textHi
                    ? msg.textHi
                    : msg.text;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isAgent ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isAgent && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                        S
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                        isAgent
                          ? "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                          : "bg-indigo-600 text-white rounded-tr-xs"
                      }`}
                    >
                      <p className="leading-relaxed font-medium">{display}</p>
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100">
                        {isAgent ? (
                          <button
                            type="button"
                            onClick={() => speakCurrentAgentMessage(display)}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                            title="Replay audio"
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
                        ) : <span />}
                        <div
                          className={`text-[10px] font-medium ${
                            isAgent ? "text-slate-400" : "text-indigo-200"
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                    {!isAgent && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                        U
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Processing / Thinking Indicator */}
              {isProcessing && (
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

              {/* Success Request Card when completed */}
              {isCompleted && savedRequest && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-md space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Request Structured & Saved
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      {savedRequest.requestId}
                    </span>
                  </div>

                  <div className="bg-white/80 rounded-xl p-3 border border-emerald-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Category:</span>
                      <span className="font-bold text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-md">
                        {savedRequest.category.toUpperCase().replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Location:</span>
                      <span className="font-bold text-slate-800">
                        {savedRequest.location.city}, {savedRequest.location.district}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Priority Impact:</span>
                      <span className="font-bold text-rose-600">
                        High (Score 92/100)
                      </span>
                    </div>
                  </div>

                  <button
                    id="view-hotspot-from-voice-btn"
                    onClick={onViewDashboard}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span>View Live on Policymaker Dashboard →</span>
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested quick response pills (only interactive when waiting for user) */}
            {currentSuggestedOptions.length > 0 && !isCompleted && isWaitingForUser && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {currentSuggestedOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleCitizenInput(opt)}
                    className="shrink-0 text-xs font-semibold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-full transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Visual Indicator for Microphone State (Listening, Processing, Idle, Speaking) */}
            <MicrophoneStateIndicator
              turnState={turnState}
              currentLanguage={currentLanguage}
              hasSpeechDetected={turnState === "USER_SPEAKING"}
              onMicClick={() => {
                if (isAssistantSpeaking) {
                  stopSpeaking();
                  setTurnState("WAITING_FOR_USER");
                  startVoiceListening();
                } else if (isWaitingForUser) {
                  stopVoiceListening();
                } else {
                  setTurnState("WAITING_FOR_USER");
                  startVoiceListening();
                }
              }}
            />

            {/* Voice Orb & Central Turn Controller */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col items-center space-y-3">
              <VoiceOrb
                state={turnState}
                size={80}
                onClick={() => {
                  if (isAssistantSpeaking) {
                    // Barge-in: interrupt assistant speech
                    stopSpeaking();
                    setTurnState("WAITING_FOR_USER");
                    console.log("[TURN DEBUG] state = WAITING_FOR_USER (barge-in) | microphone = ON");
                    startVoiceListening();
                  } else if (isWaitingForUser) {
                    stopVoiceListening();
                  } else {
                    startVoiceListening();
                  }
                }}
              />

              <div className="flex items-center gap-3">
                <button
                  id="voice-agent-mic-toggle"
                  onClick={() => {
                    if (isAssistantSpeaking) {
                      // Barge-in interruption
                      stopSpeaking();
                      setTurnState("WAITING_FOR_USER");
                      console.log("[TURN DEBUG] state = WAITING_FOR_USER (barge-in) | microphone = ON");
                      startVoiceListening();
                    } else if (isWaitingForUser) {
                      stopVoiceListening();
                    } else {
                      setTurnState("WAITING_FOR_USER");
                      console.log("[TURN DEBUG] state = WAITING_FOR_USER | microphone = ON");
                      startVoiceListening();
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isWaitingForUser
                      ? "bg-emerald-600 text-white animate-pulse"
                      : isAssistantSpeaking
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isWaitingForUser ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>
                        {currentLanguage === "bn"
                          ? "মাইক সক্রিয় (কথা বলুন)"
                          : currentLanguage === "hi"
                          ? "माइक सक्रिय (बात करें)"
                          : "Listening... Speak now"}
                      </span>
                    </>
                  ) : isAssistantSpeaking ? (
                    <>
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>
                        {currentLanguage === "bn"
                          ? "সহায়ক কথা বলছে..."
                          : currentLanguage === "hi"
                          ? "सहायक बोल रहा है..."
                          : "Assistant Speaking..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>
                        {currentLanguage === "bn"
                          ? "কথা বলতে ট্যাপ করুন"
                          : currentLanguage === "hi"
                          ? "बात करने के लिए टैप करें"
                          : "Tap to Speak"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {micError && (
                <div className="text-[11px] text-rose-600 font-medium text-center">
                  {micError}
                </div>
              )}

              {/* Text Fallback Input */}
              <div className="w-full flex items-center gap-2 pt-1 border-t border-slate-100">
                <input
                  ref={textInputRef}
                  type="text"
                  value={typedInput}
                  disabled={isAssistantSpeaking || isProcessing}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && typedInput.trim() && !isAssistantSpeaking && !isProcessing) {
                      handleCitizenInput(typedInput.trim());
                    }
                  }}
                  placeholder={
                    isAssistantSpeaking
                      ? currentLanguage === "bn"
                        ? "সহায়কের কথা শেষ হওয়া পর্যন্ত অপেক্ষা করুন..."
                        : currentLanguage === "hi"
                        ? "सहायक के बोलने तक प्रतीक्षा करें..."
                        : "Waiting for Sahayak to finish..."
                      : currentLanguage === "bn"
                      ? "অথবা এখানে লিখে জানান..."
                      : currentLanguage === "hi"
                      ? "या यहाँ लिखकर बताएं..."
                      : "Or type your message here..."
                  }
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={() => {
                    if (typedInput.trim() && !isAssistantSpeaking && !isProcessing) {
                      handleCitizenInput(typedInput.trim());
                    }
                  }}
                  disabled={!typedInput.trim() || isAssistantSpeaking || isProcessing}
                  className="bg-indigo-600 disabled:opacity-40 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Interactive Live Debug Drawer */}
      <ConversationDebugDrawer
        debugInfo={debugInfo}
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        onOpen={() => setIsDebugOpen(true)}
      />

      <BottomNav currentTab="voice_report" onSelectTab={onSelectNavTab} />
    </div>
  );
};
