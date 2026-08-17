import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { LanguageCode, CitizenProfile } from "../types";
import { speakText, stopSpeaking, createSpeechRecognizer } from "../utils/speech";

interface AssistantChatModalProps {
  profile: CitizenProfile;
  currentLanguage: LanguageCode;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

export const AssistantChatModal: React.FC<AssistantChatModalProps> = ({
  profile,
  currentLanguage,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text:
        currentLanguage === "bn"
          ? "নমস্কার! আমি সহায়ক এআই। আপনি যেকোনো সরকারি স্কিম, যোগ্যতা বা আবেদন সম্পর্কে প্রশ্ন জিজ্ঞাসা করতে পারেন।"
          : currentLanguage === "hi"
          ? "नमस्ते! मैं सहायक एआई हूँ। आप किसी भी सरकारी योजना, पात्रता या आवेदन के बारे में सवाल पूछ सकते हैं।"
          : "Hello! I am your Sahayak AI Assistant. You can ask me about any government scheme, eligibility requirements, or application procedures.",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          profile,
          language: currentLanguage === "bn" ? "Bengali" : currentLanguage === "hi" ? "Hindi" : "English",
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.answer || "I am processing your query based on current DPI guidelines.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text:
          "Under PM-KISAN, eligible farmer families receive ₹6,000 annually via Direct Benefit Transfer in 3 equal installments. Make sure your Aadhaar is linked to your bank account and land records.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const langTag =
      currentLanguage === "hi"
        ? "hi-IN"
        : currentLanguage === "bn"
        ? "bn-IN"
        : "en-IN";

    const recognizer = createSpeechRecognizer(
      langTag,
      (transcript) => {
        setInput(transcript);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
      } catch {
        setIsListening(false);
      }
    } else {
      setTimeout(() => setIsListening(false), 2000);
    }
  };

  const handleReadAloud = (msg: ChatMessage) => {
    if (playingMsgId === msg.id) {
      stopSpeaking();
      setPlayingMsgId(null);
    } else {
      setPlayingMsgId(msg.id);
      speakText(msg.text, currentLanguage, () => {
        setPlayingMsgId(null);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-3.5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>Sahayak Civic AI</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30 font-medium">
                  Online
                </span>
              </div>
              <div className="text-[10px] text-slate-300">
                Voice & Multilingual Citizen Assistance
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1 text-slate-300 hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isBot ? "items-start" : "items-end justify-end"}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs space-y-1 ${
                    isBot
                      ? "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                      : "bg-indigo-600 text-white rounded-tr-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 pt-0.5">
                    <span>{msg.timestamp}</span>
                    {isBot && (
                      <button
                        onClick={() => handleReadAloud(msg)}
                        className="hover:opacity-100 flex items-center gap-1 text-indigo-600 font-semibold cursor-pointer"
                        title="Read aloud"
                      >
                        {playingMsgId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span>{playingMsgId === msg.id ? "Stop" : "Listen"}</span>
                      </button>
                    )}
                  </div>
                </div>
                {!isBot && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 max-w-[70%] shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing scheme guidelines...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSend("What documents are needed for PM-KISAN?")}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer transition-colors font-medium"
          >
            📄 PM-KISAN Documents
          </button>
          <button
            onClick={() => handleSend("How to link Aadhaar with bank account for DBT?")}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer transition-colors font-medium"
          >
            🏦 Aadhaar DBT Linking
          </button>
          <button
            onClick={() => handleSend("Why am I not eligible for PMAY housing?")}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer transition-colors font-medium"
          >
            🏠 PMAY Criteria
          </button>
        </div>

        {/* Input bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 rounded-b-2xl">
          <button
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
            title="Speak"
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              currentLanguage === "bn"
                ? "প্রশ্ন লিখুন..."
                : currentLanguage === "hi"
                ? "प्रश्न लिखें..."
                : "Ask about any scheme or rule..."
            }
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
