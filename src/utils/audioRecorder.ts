// Persistent Audio Recorder & Input Manager for Gemini Voice Conversation
// Keeps persistent MediaStream alive across conversational turns without tearing down microphone hardware.

import { hapticMicStart, hapticMicStop, hapticSpeechDetected } from "./haptics";

export interface AudioRecordingResult {
  blob: Blob;
  base64: string;
  mimeType: string;
  durationMs: number;
  hasSpeech: boolean;
}

export interface AudioRecorderOptions {
  onVolumeChange?: (level: number) => void;
  onSpeechStart?: () => void;
  onSilenceTimeout?: () => void;
  silenceThresholdMs?: number;
  volumeThreshold?: number;
  maxRecordingMs?: number;
}

export class GeminiAudioRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private chosenMimeType: string = "audio/webm";

  private isStreamActive: boolean = false;
  private isAcceptingInput: boolean = false;
  private turnStartTime: number = 0;

  // Voice Activity Detection (VAD) state
  private hasSpoken: boolean = false;
  private speechFramesCount: number = 0;
  private speechStartTime: number = 0;
  private lastSpokenTime: number = 0;
  private maxDurationTimer: any = null;

  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      silenceThresholdMs: 2800,
      volumeThreshold: 0.035,
      maxRecordingMs: 30000,
      ...options,
    };
  }

  public getIsStreamActive(): boolean {
    return this.isStreamActive && (this.mediaStream?.active ?? false);
  }

  public getIsRecording(): boolean {
    return this.isAcceptingInput;
  }

  public getHasSpoken(): boolean {
    return this.hasSpoken;
  }

  private pickSupportedMimeType(): string {
    if (typeof MediaRecorder === "undefined") return "audio/webm";
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/wav",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }

  /**
   * Initializes the persistent MediaStream and AudioContext once.
   * Keeps audio hardware active across turns.
   */
  public async initAudioSession(): Promise<void> {
    if (this.isStreamActive && this.mediaStream && this.mediaStream.active) {
      return; // Already initialized and alive
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not supported in this browser environment");
    }

    // Acquire persistent microphone stream with noise suppression and echo cancellation
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.isStreamActive = true;
    this.chosenMimeType = this.pickSupportedMimeType();

    // Set up persistent volume analyser
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === "closed") {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === "suspended") {
          try {
            await this.audioContext.resume();
          } catch {}
        }
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.4;
        source.connect(this.analyser);
      }
    } catch (e) {
      console.warn("[Gemini Audio] Analyser init notice:", e);
    }

    // Start persistent volume loop
    this.startVolumeMonitoring();
  }

  /**
   * Starts a new user listening turn without destroying the underlying stream.
   */
  public async start(): Promise<void> {
    if (!this.isStreamActive || !this.mediaStream || !this.mediaStream.active) {
      await this.initAudioSession();
    }

    this.isAcceptingInput = true;
    hapticMicStart();
    console.log("[MIC STATE DEBUG]", {
      state: "acceptingUserInput = true",
      isListening: true,
      acceptingUserInput: true,
      streamActive: this.getIsStreamActive(),
      sourceFunction: "GeminiAudioRecorder.start",
      reason: "Turn started / waiting for user speech",
    });
    console.log("[MIC STATE CHANGE]", {
      acceptingUserInput: true,
      reason: "Turn started / waiting for citizen speech",
      caller: "GeminiAudioRecorder.start",
      streamActive: this.getIsStreamActive(),
    });
    this.audioChunks = [];
    this.turnStartTime = Date.now();
    this.hasSpoken = false;
    this.speechFramesCount = 0;
    this.speechStartTime = 0;
    this.lastSpokenTime = Date.now();

    this.clearTimers();

    // Setup or start MediaRecorder for this turn
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        try {
          this.mediaRecorder.stop();
        } catch {}
      }

      if (this.mediaStream) {
        const recorderOptions: MediaRecorderOptions = {};
        if (this.chosenMimeType) {
          recorderOptions.mimeType = this.chosenMimeType;
        }

        this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);
        this.mediaRecorder.ondataavailable = (event) => {
          if (this.isAcceptingInput && event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.start(100);
      }
    } catch (recorderErr) {
      console.warn("[Gemini Audio] MediaRecorder turn start notice:", recorderErr);
    }

    // Max recording safety timer
    if (this.options.maxRecordingMs) {
      this.maxDurationTimer = setTimeout(() => {
        if (this.isAcceptingInput && this.options.onSilenceTimeout) {
          this.options.onSilenceTimeout();
        }
      }, this.options.maxRecordingMs);
    }
  }

  /**
   * Temporarily disables audio input during assistant speaking without stopping the stream.
   */
  public disableInput(reason: string = "Assistant speaking"): void {
    const prev = this.isAcceptingInput;
    this.isAcceptingInput = false;
    if (prev) {
      hapticMicStop();
    }
    console.log("[MIC STATE DEBUG]", {
      state: "acceptingUserInput = false",
      isListening: false,
      acceptingUserInput: false,
      previous: prev,
      streamActive: this.getIsStreamActive(),
      sourceFunction: "GeminiAudioRecorder.disableInput",
      reason,
    });
    console.log("[MIC STATE CHANGE]", {
      previous: prev,
      next: false,
      acceptingUserInput: false,
      reason,
      caller: "GeminiAudioRecorder.disableInput",
      streamActive: this.getIsStreamActive(),
    });
    this.clearTimers();
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      try {
        this.mediaRecorder.requestData();
      } catch {}
    }
  }

  /**
   * Resets the turn speech state (e.g. if noise triggered but no speech words were spoken).
   */
  public resetTurnState(): void {
    this.hasSpoken = false;
    this.speechFramesCount = 0;
    this.speechStartTime = 0;
    this.lastSpokenTime = Date.now();
    this.audioChunks = [];
  }

  /**
   * Stops accepting input and extracts the current turn's audio into base64.
   * Crucially, the underlying MediaStream is KEPT ALIVE for the next turn.
   */
  public async stop(): Promise<AudioRecordingResult> {
    this.isAcceptingInput = false;
    hapticMicStop();
    console.log("[MIC STATE DEBUG]", {
      state: "acceptingUserInput = false",
      isListening: false,
      acceptingUserInput: false,
      streamActive: this.getIsStreamActive(),
      sourceFunction: "GeminiAudioRecorder.stop",
      reason: "Audio recording turn ended / processing audio",
    });
    this.clearTimers();

    return new Promise((resolve) => {
      const finish = () => {
        const durationMs = Date.now() - this.turnStartTime;
        const mime = this.chosenMimeType || "audio/webm";
        const blob = new Blob(this.audioChunks, { type: mime });

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string) || "";
          resolve({
            blob,
            base64,
            mimeType: mime,
            durationMs,
            hasSpeech: this.hasSpoken || durationMs >= 700 || this.audioChunks.length > 0,
          });
        };
        reader.readAsDataURL(blob);
      };

      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.onstop = finish;
        try {
          this.mediaRecorder.stop();
        } catch {
          finish();
        }
      } else {
        finish();
      }
    });
  }

  /**
   * Cancels current recording turn without destroying persistent stream.
   */
  public cancel(): void {
    this.isAcceptingInput = false;
    hapticMicStop();
    console.log("[MIC STATE DEBUG]", {
      state: "acceptingUserInput = false",
      isListening: false,
      acceptingUserInput: false,
      streamActive: this.getIsStreamActive(),
      sourceFunction: "GeminiAudioRecorder.cancel",
      reason: "Recording cancelled",
    });
    this.clearTimers();
    this.audioChunks = [];
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
  }

  /**
   * Complete teardown: only called on full component unmount or exit.
   */
  public destroy(): void {
    this.isAcceptingInput = false;
    this.isStreamActive = false;
    console.log("[MIC STATE DEBUG]", {
      state: "acceptingUserInput = false (DESTROY)",
      isListening: false,
      acceptingUserInput: false,
      streamActive: false,
      sourceFunction: "GeminiAudioRecorder.destroy",
      reason: "Component unmount or conversation exit",
    });
    this.clearTimers();

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
      this.mediaRecorder = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }

    this.options.onVolumeChange?.(0);
  }

  private clearTimers() {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  private startVolumeMonitoring() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      if (!this.isStreamActive || !this.mediaStream || !this.mediaStream.active) {
        return;
      }

      if (this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = dataArray[i];
          sum += val;
          if (val > peak) peak = val;
        }
        const average = sum / bufferLength;
        const normalizedLevel = Math.min(1, Math.max(0, Math.max(average / 65, peak / 150)));

        // Update UI visualizer only when accepting input or for ambient feedback
        this.options.onVolumeChange?.(this.isAcceptingInput ? normalizedLevel : 0);

        // Voice Activity Detection (VAD) logic (only active when accepting input)
        if (this.isAcceptingInput) {
          const threshold = this.options.volumeThreshold || 0.035;
          const now = Date.now();

          if (normalizedLevel > threshold) {
            this.speechFramesCount++;
            // Require at least 3 consecutive frames to confirm real human speech (filters out single clicks)
            if (this.speechFramesCount >= 3) {
              if (!this.hasSpoken) {
                this.hasSpoken = true;
                this.speechStartTime = now;
                hapticSpeechDetected();
                this.options.onSpeechStart?.();
              }
              this.lastSpokenTime = now;
            }
          } else {
            this.speechFramesCount = Math.max(0, this.speechFramesCount - 1);

            // Silence detection after user has confirmedly spoken
            if (this.hasSpoken && this.speechStartTime) {
              const spokenDuration = this.lastSpokenTime - this.speechStartTime;
              const silenceDuration = now - this.lastSpokenTime;
              const silenceThreshold = this.options.silenceThresholdMs || 2800;

              // User spoke for >= 500ms and has paused for silenceThreshold
              if (spokenDuration >= 500 && silenceDuration >= silenceThreshold) {
                this.isAcceptingInput = false;
                if (this.options.onSilenceTimeout) {
                  this.options.onSilenceTimeout();
                }
              }
            }
          }
        }
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }
}
