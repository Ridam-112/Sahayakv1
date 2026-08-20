import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Send,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  ArrowRight,
  Sparkles,
  MapPin,
  Building2,
  Database,
  ShieldCheck,
  BarChart3,
  Clock,
  Radio,
  FileText,
} from "lucide-react";
import {
  CitizenDevelopmentRequest,
  LanguageCode,
  NavTab,
} from "../types";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { speakText, stopSpeaking } from "../utils/speech";

interface CivicReportingScreenProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSaveRequest: (request: CitizenDevelopmentRequest) => void;
  onViewDashboard: () => void;
  onSelectNavTab: (tab: NavTab) => void;
  onBack?: () => void;
}

type ReportMode = "voice" | "text";
type VoiceState = "IDLE" | "RECORDING" | "RECORDING_READY" | "UPLOADING" | "SUBMITTED";
type TextState = "TEXT_INPUT" | "UPLOADING" | "SUBMITTED";

export const DevelopmentVoiceAgent: React.FC<CivicReportingScreenProps> = ({
  currentLanguage,
  onSelectLanguage,
  onSaveRequest,
  onViewDashboard,
  onSelectNavTab,
  onBack,
}) => {
  // Mode selection: Voice vs Text
  const [activeMode, setActiveMode] = useState<ReportMode>("voice");

  // Voice recording state machine
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [recordingDurationSec, setRecordingDurationSec] = useState<number>(0);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Audio Playback state for recorded clip
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const recordedAudioElemRef = useRef<HTMLAudioElement | null>(null);

  // Text report state machine
  const [textState, setTextState] = useState<TextState>("TEXT_INPUT");
  const [originalText, setOriginalText] = useState<string>("");
  const [locality, setLocality] = useState<string>("");
  const [city, setCity] = useState<string>("Balurghat");
  const [district, setDistrict] = useState<string>("Dakshin Dinajpur");
  const [stateName, setStateName] = useState<string>("West Bengal");

  // Submitted report reference
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [submittedTimestamp, setSubmittedTimestamp] = useState<string>("");
  const [submittedSummary, setSubmittedSummary] = useState<string>("");

  // Static Instruction Speech Player (Optional user-triggered audio)
  const [isInstructionPlaying, setIsInstructionPlaying] = useState<boolean>(false);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Static Sahayak Introduction Text (Constant & Immutable)
  const getStaticIntroduction = () => {
    switch (currentLanguage) {
      case "bn":
        return "নমস্কার। আমি সহায়ক। আপনার এলাকার কোনো সমস্যা, প্রয়োজন বা উন্নয়নের বিষয় আমাদের জানান। আপনি চাইলে লিখে বা নিজের কণ্ঠে বলতে পারেন। আপনার দেওয়া তথ্য সংশ্লিষ্ট সরকারি কর্তৃপক্ষের কাছে পাঠানোর জন্য সংরক্ষণ করা হবে।";
      case "hi":
        return "नमस्ते। मैं सहायक हूँ। अपने क्षेत्र की किसी समस्या, ज़रूरत या विकास से जुड़ी बात हमें बताइए। आप लिखकर या अपनी आवाज़ में बता सकते हैं। आपकी दी गई जानकारी संबंधित सरकारी अधिकारियों तक पहुँचाने के लिए सुरक्षित रखी जाएगी।";
      default:
        return "Hello. I'm Sahayak. Tell us about any problem, need, or development issue in your area. You can write it or submit it using your voice. The information you provide will be securely stored to reach relevant authorities.";
    }
  };

  const getLocalizedUi = () => {
    switch (currentLanguage) {
      case "bn":
        return {
          headerTitle: "সহায়ক নাগরিক রিপোর্ট",
          headerSubtitle: "আপনার এলাকার উন্নয়ন চাহিদা ও সমস্যার কথা জানান",
          introTitle: "সহায়ক পরিচিতি ও নির্দেশনা",
          listenInstruction: "নির্দেশনা শুনুন",
          stopInstruction: "থামান",
          choiceTitle: "আপনার কথা কীভাবে জানাতে চান?",
          voiceTab: "🎤 নিজের কণ্ঠে বলুন",
          textTab: "✍️ লিখে জানান",
          voiceIdleHeadline: "আপনার এলাকার সমস্যা বা প্রয়োজন নিজের কণ্ঠে বলুন",
          voiceIdleDesc: "কোনো জটিল ফরম পূরণ নেই। কথা বলতে নিচের লাল রেকর্ড বোতামে চাপুন।",
          startRecordingBtn: "রেকর্ড শুরু করুন",
          recordingHeadline: "আপনার কথা বলুন...",
          recordingHint: "বলা শেষ হলে নিচের বোতামে চেপে রেকর্ডিং সম্পন্ন করুন",
          stopRecordingBtn: "রেকর্ডিং থামান",
          readyHeadline: "আপনার Voice Report প্রস্তুত",
          readyHint: "জমা দেওয়ার আগে আপনার রেকর্ড করা অডিওটি শুনে নিতে পারেন",
          playAudio: "শুনুন",
          pauseAudio: "থামান",
          recordAgainBtn: "আবার রেকর্ড করুন",
          submitBtn: "রিপোর্ট জমা দিন",
          submitting: "নাগরিক ডাটাবেসে সংরক্ষিত হচ্ছে...",
          submittedTitle: "রিপোর্ট সফলভাবে জমা হয়েছে!",
          submittedSub: "আপনার মূল জমাটি সহায়ক নাগরিক ডাটাবেসে সংরক্ষিত হয়েছে।",
          refLabel: "রেফারেন্স নম্বর",
          statusLabel: "সংরক্ষণ স্থিতি",
          statusValue: "নাগরিক ডাটাবেসে সংরক্ষিত — নীতি পর্যালোচনার জন্য প্রস্তুত",
          origAudioPreserved: "আসল অডিও ফাইল সংরক্ষিত",
          textPlaceholder: "আপনার এলাকার সমস্যা বা প্রয়োজনীয়তার কথা লিখুন... (যেমন: রাস্তা ভাঙা, হাসপাতালে ডাক্তার নেই, পানীয় জলের সমস্যা ইত্যাদি)",
          textWordCount: "অক্ষর",
          locationDetails: "এলাকার বিবরণ (ঐচ্ছিক)",
          cityLabel: "শহর / গ্রাম",
          districtLabel: "জেলা",
          stateLabel: "রাজ্য",
          submitAnotherBtn: "নতুন রিপোর্ট দিন",
          viewDashboardBtn: "উন্নয়ন ড্যাশবোর্ড দেখুন",
          returnHomeBtn: "হোমে ফিরুন",
        };
      case "hi":
        return {
          headerTitle: "सहायक नागरिक रिपोर्ट",
          headerSubtitle: "अपने क्षेत्र की विकास संबंधी जरूरतें और समस्याएं बताएं",
          introTitle: "सहायक परिचय एवं निर्देश",
          listenInstruction: "निर्देश सुनें",
          stopInstruction: "रोकें",
          choiceTitle: "आप अपनी बात कैसे बताना चाहते हैं?",
          voiceTab: "🎤 अपनी आवाज़ में बताएं",
          textTab: "✍️ लिखकर बताएं",
          voiceIdleHeadline: "अपने क्षेत्र की समस्या या आवश्यकता अपनी आवाज़ में बताएं",
          voiceIdleDesc: "कोई कठिन फ़ॉर्म नहीं। बोलने के लिए नीचे दिए गए रिकॉर्ड बटन को दबाएं।",
          startRecordingBtn: "रिकॉर्डिंग शुरू करें",
          recordingHeadline: "अपनी बात बोलिए...",
          recordingHint: "बोलना पूरा होने पर नीचे दिए गए बटन से रिकॉर्डिंग रोकें",
          stopRecordingBtn: "रिकॉर्डिंग रोकें",
          readyHeadline: "आपकी Voice Report तैयार है",
          readyHint: "जमा करने से पहले अपनी रिकॉर्ड की गई आवाज़ सुन सकते हैं",
          playAudio: "सुनें",
          pauseAudio: "रोकें",
          recordAgainBtn: "पुनः रिकॉर्ड करें",
          submitBtn: "रिपोर्ट जमा करें",
          submitting: "नागरिक डेटाबेस में सुरक्षित किया जा रहा है...",
          submittedTitle: "रिपोर्ट सफलतापूर्वक जमा हुई!",
          submittedSub: "आपकी मूल रिपोर्ट सहायक नागरिक डेटाबेस में सुरक्षित कर ली गई है।",
          refLabel: "संदर्भ संख्या",
          statusLabel: "स्थिति",
          statusValue: "नागरिक डेटाबेस में दर्ज — नीति विश्लेषण के लिए तैयार",
          origAudioPreserved: "मूल ऑडियो फ़ाइल सुरक्षित",
          textPlaceholder: "अपने क्षेत्र की समस्या या विकास आवश्यकता के बारे में लिखें... (जैसे: टूटी सड़क, अस्पताल में डॉक्टर नहीं, पीने के पानी की समस्या आदि)",
          textWordCount: "अक्षर",
          locationDetails: "स्थान विवरण (वैकल्पिक)",
          cityLabel: "शहर / गाँव",
          districtLabel: "ज़िला",
          stateLabel: "राज्य",
          submitAnotherBtn: "नई रिपोर्ट दें",
          viewDashboardBtn: "डेवलपमेंट डैशबोर्ड देखें",
          returnHomeBtn: "होम पर लौटें",
        };
      default:
        return {
          headerTitle: "Sahayak Civic Reporting",
          headerSubtitle: "Submit local development needs and civic issues directly",
          introTitle: "Sahayak Introduction & Guidance",
          listenInstruction: "Listen to guidance",
          stopInstruction: "Stop",
          choiceTitle: "How would you like to submit your report?",
          voiceTab: "🎤 Voice Report",
          textTab: "✍️ Write Report",
          voiceIdleHeadline: "Speak about your area's issue in your own voice",
          voiceIdleDesc: "No complex forms. Speak naturally when ready by pressing start recording.",
          startRecordingBtn: "Start Recording",
          recordingHeadline: "Speak your report now...",
          recordingHint: "Press stop when you are finished speaking",
          stopRecordingBtn: "Stop Recording",
          readyHeadline: "Your Voice Report is Ready",
          readyHint: "You can listen to your recording before submitting to the civic database",
          playAudio: "Play",
          pauseAudio: "Pause",
          recordAgainBtn: "Record Again",
          submitBtn: "Submit Report",
          submitting: "Uploading to civic database...",
          submittedTitle: "Report Submitted Successfully!",
          submittedSub: "Your original submission has been recorded in the Sahayak civic database.",
          refLabel: "Reference ID",
          statusLabel: "Database Status",
          statusValue: "Recorded in Civic Database — Queued for Policy Analysis",
          origAudioPreserved: "Original Audio Preserved",
          textPlaceholder: "Write about problems, needs, or development issues in your area (e.g. damaged road, healthcare shortages, clean water access, electricity outages)...",
          textWordCount: "Characters",
          locationDetails: "Location Context (Optional)",
          cityLabel: "City / Village",
          districtLabel: "District",
          stateLabel: "State",
          submitAnotherBtn: "Submit Another Report",
          viewDashboardBtn: "View Policymaker Dashboard",
          returnHomeBtn: "Return to Home",
        };
    }
  };

  const ui = getLocalizedUi();
  const staticIntro = getStaticIntroduction();

  // Auto-play introduction audio when the page opens or when language changes
  useEffect(() => {
    let cancelSpeech: (() => void) | null = null;
    setIsInstructionPlaying(true);

    const timer = setTimeout(() => {
      cancelSpeech = speakText(staticIntro, currentLanguage, () => {
        setIsInstructionPlaying(false);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      if (cancelSpeech) cancelSpeech();
      stopSpeaking();
      setIsInstructionPlaying(false);
    };
  }, [currentLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopMicrophoneStreams();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, []);

  const stopMicrophoneStreams = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Static Instruction audio player
  const handleToggleInstructionAudio = () => {
    if (isInstructionPlaying) {
      stopSpeaking();
      setIsInstructionPlaying(false);
    } else {
      setIsInstructionPlaying(true);
      speakText(staticIntro, currentLanguage, () => {
        setIsInstructionPlaying(false);
      });
    }
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    setMicError(null);
    stopSpeaking();
    setIsInstructionPlaying(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;

      // Web Audio API for responsive visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length / 255;
            setMicVolume(avg);
          }
          animFrameRef.current = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      } catch (e) {
        console.warn("AudioContext visualizer notice:", e);
      }

      // MediaRecorder setup
      audioChunksRef.current = [];
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"];
      const supportedMime = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setRecordedBlob(audioBlob);

        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        try {
          const b64 = await blobToBase64(audioBlob);
          setRecordedBase64(b64);
        } catch (e) {
          console.warn("Base64 conversion notice:", e);
        }

        stopMicrophoneStreams();
        setVoiceState("RECORDING_READY");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Collect in 250ms chunks

      setRecordingDurationSec(0);
      setVoiceState("RECORDING");

      // Recording duration counter (cap at 3 minutes)
      const start = Date.now();
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setRecordingDurationSec(elapsed);
        if (elapsed >= 180) {
          handleStopRecording();
        }
      }, 1000);
    } catch (err: any) {
      console.error("Microphone permission/access error:", err);
      setMicError(
        currentLanguage === "bn"
          ? "মাইক্রোফোনের অনুমতি পাওয়া যায়নি। অনুগ্রহ করে ব্রাউজারে মাইক চালু করুন।"
          : currentLanguage === "hi"
          ? "माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक की अनुमति दें।"
          : "Microphone permission denied. Please allow microphone access to record."
      );
      setVoiceState("IDLE");
    }
  };

  // Stop Voice Recording
  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Reset to Record Again
  const handleRecordAgain = () => {
    if (recordedAudioElemRef.current) {
      recordedAudioElemRef.current.pause();
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setIsPlayingRecorded(false);
    setPlaybackTime(0);
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setRecordingDurationSec(0);
    setVoiceState("IDLE");
  };

  // Play / Pause Recorded Audio Clip
  const handleTogglePlayRecorded = () => {
    if (!recordedAudioElemRef.current) {
      if (!recordedAudioUrl) return;
      const audio = new Audio(recordedAudioUrl);
      recordedAudioElemRef.current = audio;

      audio.ontimeupdate = () => {
        setPlaybackTime(audio.currentTime);
      };
      audio.onended = () => {
        setIsPlayingRecorded(false);
        setPlaybackTime(0);
      };
    }

    const audio = recordedAudioElemRef.current;
    if (isPlayingRecorded) {
      audio.pause();
      setIsPlayingRecorded(false);
    } else {
      audio.play().then(() => {
        setIsPlayingRecorded(true);
      }).catch((e) => console.warn("Playback error:", e));
    }
  };

  // Submit Voice Report to Backend
  const handleSubmitVoiceReport = async () => {
    if (!recordedBase64 && !recordedBlob) return;
    setVoiceState("UPLOADING");

    try {
      const b64 = recordedBase64 || (recordedBlob ? await blobToBase64(recordedBlob) : "");
      const res = await fetch("/api/submit-civic-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "voice",
          audioBase64: b64,
          audioMimeType: recordedBlob?.type || "audio/webm",
          durationSeconds: recordingDurationSec,
          language: currentLanguage,
          location: { state: stateName, district, city, locality },
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      const refId = data.reportId || `#SHK-VR-${Math.floor(10000 + Math.random() * 90000)}`;
      setSubmittedReportId(refId);
      setSubmittedTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSubmittedSummary(data.report?.aiMetadata?.summary || "Voice civic report");

      // Save to parent list as a verified citizen request
      const citizenReq: CitizenDevelopmentRequest = {
        requestId: refId,
        language: currentLanguage,
        originalText: data.report?.transcript || "Voice Report (Audio Recording)",
        category: (data.report?.aiMetadata?.category as any) || "roads",
        subCategory: `${data.report?.aiMetadata?.category || "roads"}_need`,
        location: {
          country: "India",
          state: stateName,
          district,
          city,
          locality,
        },
        problem: data.report?.transcript || "Citizen voice submission for civic infrastructure",
        urgency: (data.report?.aiMetadata?.urgency as any) || "medium",
        affectedPopulation: "community",
        citizenSuggestedSolution: null,
        timestamp: "Just now",
        source: "voice",
        verifiedStatus: "verified",
        citizenName: "Citizen Voice Contributor",
      };
      onSaveRequest(citizenReq);

      setVoiceState("SUBMITTED");
    } catch (err) {
      console.warn("Submit voice report error:", err);
      // Fallback local save
      const refId = `#SHK-VR-${Math.floor(10000 + Math.random() * 90000)}`;
      setSubmittedReportId(refId);
      setSubmittedTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setVoiceState("SUBMITTED");
    }
  };

  // Submit Text Report to Backend
  const handleSubmitTextReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalText.trim()) return;

    setTextState("UPLOADING");

    try {
      const res = await fetch("/api/submit-civic-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          text: originalText.trim(),
          language: currentLanguage,
          location: { state: stateName, district, city, locality },
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      const refId = data.reportId || `#SHK-TR-${Math.floor(10000 + Math.random() * 90000)}`;
      setSubmittedReportId(refId);
      setSubmittedTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

      // Save to parent list
      const citizenReq: CitizenDevelopmentRequest = {
        requestId: refId,
        language: currentLanguage,
        originalText: originalText.trim(),
        category: (data.report?.aiMetadata?.category as any) || "roads",
        subCategory: `${data.report?.aiMetadata?.category || "roads"}_need`,
        location: {
          country: "India",
          state: stateName,
          district,
          city,
          locality,
        },
        problem: originalText.trim(),
        urgency: (data.report?.aiMetadata?.urgency as any) || "medium",
        affectedPopulation: "community",
        citizenSuggestedSolution: null,
        timestamp: "Just now",
        source: "text",
        verifiedStatus: "verified",
        citizenName: "Citizen Contributor",
      };
      onSaveRequest(citizenReq);

      setTextState("SUBMITTED");
    } catch (err) {
      console.warn("Submit text report error:", err);
      const refId = `#SHK-TR-${Math.floor(10000 + Math.random() * 90000)}`;
      setSubmittedReportId(refId);
      setSubmittedTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setTextState("SUBMITTED");
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const resetAllForms = () => {
    handleRecordAgain();
    setOriginalText("");
    setTextState("TEXT_INPUT");
    setSubmittedReportId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
      />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-3 pb-8 space-y-4">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            ← {ui.returnHomeBtn}
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Civic Database Portal</span>
          </div>
        </div>

        {/* Static Introduction Card (Constant & Immutable) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  {ui.introTitle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                "{staticIntro}"
              </p>
            </div>
          </div>

          {/* Optional Audio Playback for Instruction */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-medium text-slate-500">
              {currentLanguage === "bn" ? "অফিসিয়াল স্থায়ী নির্দেশনা" : currentLanguage === "hi" ? "आधिकारिक स्थिर निर्देश" : "Official Static Guidance"}
            </span>
            <button
              onClick={handleToggleInstructionAudio}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isInstructionPlaying
                  ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              }`}
            >
              {isInstructionPlaying ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{ui.stopInstruction}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{ui.listenInstruction}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input Mode Selector (Voice vs Text) */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1">
          <button
            id="tab-voice-report"
            onClick={() => {
              setActiveMode("voice");
              stopSpeaking();
            }}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === "voice"
                ? "bg-white text-indigo-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mic className={`w-4 h-4 ${activeMode === "voice" ? "text-indigo-600" : "text-slate-500"}`} />
            <span>{ui.voiceTab}</span>
          </button>

          <button
            id="tab-text-report"
            onClick={() => {
              setActiveMode("text");
              stopSpeaking();
            }}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === "text"
                ? "bg-white text-indigo-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Keyboard className={`w-4 h-4 ${activeMode === "text" ? "text-indigo-600" : "text-slate-500"}`} />
            <span>{ui.textTab}</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MODE 1: VOICE REPORT */}
        {/* ============================================================ */}
        {activeMode === "voice" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Error banner if mic fails */}
            {micError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
            )}

            {/* STATE 1: IDLE */}
            {voiceState === "IDLE" && (
              <div className="text-center py-6 space-y-5">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-rose-500/20 border-2 border-orange-400/30 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
                    <Mic className="w-7 h-7" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {ui.voiceIdleHeadline}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {ui.voiceIdleDesc}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-start-voice-recording"
                    onClick={handleStartRecording}
                    className="w-full max-w-xs mx-auto bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
                  >
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span>{ui.startRecordingBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 2: RECORDING */}
            {voiceState === "RECORDING" && (
              <div className="text-center py-4 space-y-5">
                {/* Live Recording Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                  <span>RECORDING ACTIVE</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {ui.recordingHeadline}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ui.recordingHint}
                  </p>
                </div>

                {/* Live Audio Visualizer */}
                <div className="h-16 flex items-center justify-center gap-1.5 px-4 bg-slate-900 rounded-2xl">
                  {[...Array(24)].map((_, i) => {
                    const heightFactor = Math.max(0.15, Math.sin((i / 24) * Math.PI) * (micVolume * 3 + 0.2));
                    const barHeight = Math.min(48, Math.max(6, heightFactor * 48));
                    return (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-orange-500 to-amber-300 transition-all duration-75"
                        style={{ height: `${barHeight}px` }}
                      />
                    );
                  })}
                </div>

                {/* Recording Timer */}
                <div className="text-2xl font-mono font-black text-slate-900">
                  {formatTimer(recordingDurationSec)}{" "}
                  <span className="text-xs text-slate-400 font-sans font-normal">/ 03:00</span>
                </div>

                {/* Stop Button */}
                <button
                  id="btn-stop-voice-recording"
                  onClick={handleStopRecording}
                  className="w-full max-w-xs mx-auto bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>{ui.stopRecordingBtn}</span>
                </button>
              </div>
            )}

            {/* STATE 3: RECORDING_READY */}
            {voiceState === "RECORDING_READY" && (
              <div className="py-3 space-y-5">
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs font-semibold">
                    <div className="font-bold text-slate-900">{ui.readyHeadline}</div>
                    <div className="text-slate-600">{ui.readyHint}</div>
                  </div>
                </div>

                {/* Playback Card */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      {ui.origAudioPreserved}
                    </span>
                    <span className="font-mono">{formatTimer(playbackTime)} / {formatTimer(recordingDurationSec)}</span>
                  </div>

                  {/* Play / Pause Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTogglePlayRecorded}
                      className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-colors cursor-pointer shadow-md font-bold"
                    >
                      {isPlayingRecorded ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full transition-all duration-100"
                        style={{
                          width: `${recordingDurationSec > 0 ? (playbackTime / recordingDurationSec) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <button
                    onClick={handleRecordAgain}
                    className="w-full sm:w-auto flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    <span>{ui.recordAgainBtn}</span>
                  </button>

                  <button
                    id="btn-submit-voice-report"
                    onClick={handleSubmitVoiceReport}
                    className="w-full sm:w-auto flex-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{ui.submitBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: UPLOADING */}
            {voiceState === "UPLOADING" && (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-sm font-bold text-slate-800">{ui.submitting}</div>
              </div>
            )}

            {/* STATE 5: SUBMITTED */}
            {voiceState === "SUBMITTED" && (
              <div className="py-4 space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {ui.submittedTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ui.submittedSub}
                  </p>
                </div>

                {/* Submission Receipt Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">{ui.refLabel}:</span>
                    <span className="font-mono font-black text-indigo-700">{submittedReportId}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">Submission Type:</span>
                    <span className="font-bold text-slate-800">Voice Audio ({recordingDurationSec}s)</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">{ui.statusLabel}:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Civic Database Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Timestamp:</span>
                    <span className="text-slate-700">{submittedTimestamp}</span>
                  </div>
                </div>

                {/* Next Steps Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={onViewDashboard}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-md"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>{ui.viewDashboardBtn}</span>
                  </button>

                  <button
                    onClick={resetAllForms}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    {ui.submitAnotherBtn}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: TEXT REPORT */}
        {/* ============================================================ */}
        {activeMode === "text" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            {textState === "TEXT_INPUT" && (
              <form onSubmit={handleSubmitTextReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    {currentLanguage === "bn" ? "আপনার রিপোর্ট লিখুন" : currentLanguage === "hi" ? "अपनी रिपोर्ट लिखें" : "Write Your Report"}
                  </label>
                  <textarea
                    id="textarea-civic-report"
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder={ui.textPlaceholder}
                    rows={5}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm text-slate-900 outline-none transition-all resize-none font-sans leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {currentLanguage === "bn" ? "মূল বক্তব্য কোনো পরিবর্তন ছাড়া সংরক্ষিত হবে" : currentLanguage === "hi" ? "मूल विवरण बिना किसी बदलाव के सुरक्षित होगा" : "Original text is preserved 100% untouched"}
                    </span>
                    <span>{originalText.length} {ui.textWordCount}</span>
                  </div>
                </div>

                {/* Optional Location Fields */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{ui.locationDetails}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{ui.cityLabel}</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{ui.districtLabel}</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!originalText.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{ui.submitBtn}</span>
                </button>
              </form>
            )}

            {textState === "UPLOADING" && (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-sm font-bold text-slate-800">{ui.submitting}</div>
              </div>
            )}

            {textState === "SUBMITTED" && (
              <div className="py-4 space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {ui.submittedTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ui.submittedSub}
                  </p>
                </div>

                {/* Untouched Original Text Display */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">{ui.refLabel}:</span>
                    <span className="font-mono font-black text-indigo-700">{submittedReportId}</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Exact Citizen Text (Untouched):
                    </span>
                    <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-900 font-medium italic text-xs leading-relaxed">
                      "{originalText}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
                    <span>{city}, {district} ({stateName})</span>
                    <span>{submittedTimestamp}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={onViewDashboard}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-md"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>{ui.viewDashboardBtn}</span>
                  </button>

                  <button
                    onClick={resetAllForms}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    {ui.submitAnotherBtn}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav
        activeTab="voice_report"
        onSelectTab={onSelectNavTab}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
