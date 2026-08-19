// Audio recorder utility for Gemini Native Voice Conversation
// Captures user microphone audio, monitors RMS audio levels for animation, and detects speech activity

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
  private startTime: number = 0;
  private hasSpoken: boolean = false;
  private speechStartTime: number = 0;
  private lastSpokenTime: number = 0;
  private silenceCheckTimer: any = null;
  private maxDurationTimer: any = null;
  private isRecording: boolean = false;
  private chosenMimeType: string = "audio/webm";

  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      silenceThresholdMs: 3000,
      volumeThreshold: 0.015,
      maxRecordingMs: 25000,
      ...options,
    };
  }

  public getIsRecording(): boolean {
    return this.isRecording;
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

  public async start(): Promise<void> {
    if (this.isRecording) {
      this.cancel();
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not supported in this environment");
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.chosenMimeType = this.pickSupportedMimeType();
    const recorderOptions: MediaRecorderOptions = {};
    if (this.chosenMimeType) {
      recorderOptions.mimeType = this.chosenMimeType;
    }

    this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);
    this.audioChunks = [];
    this.startTime = Date.now();
    this.hasSpoken = false;
    this.lastSpokenTime = Date.now();
    this.isRecording = true;

    // Set up real-time audio volume analysis for Voice Orb animation and VAD
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.4;
        source.connect(this.analyser);

        this.startVolumeMonitoring();
      }
    } catch (e) {
      console.warn("[Gemini Audio] Volume analyser init notice:", e);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Auto-stop if exceeding max recording duration
    if (this.options.maxRecordingMs) {
      this.maxDurationTimer = setTimeout(() => {
        if (this.isRecording && this.options.onSilenceTimeout) {
          this.options.onSilenceTimeout();
        }
      }, this.options.maxRecordingMs);
    }

    this.mediaRecorder.start(100); // 100ms slices for responsive audio
  }

  private startVolumeMonitoring() {
    if (!this.analyser) return;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        sum += val;
        if (val > peak) peak = val;
      }
      const average = sum / bufferLength;
      // High sensitivity audio normalization
      const normalizedLevel = Math.min(1, Math.max(0, Math.max(average / 70, peak / 160)));

      this.options.onVolumeChange?.(normalizedLevel);

      const threshold = this.options.volumeThreshold || 0.015;
      const now = Date.now();

      if (normalizedLevel > threshold) {
        if (!this.hasSpoken) {
          this.hasSpoken = true;
          this.speechStartTime = now;
          this.options.onSpeechStart?.();
        }
        this.lastSpokenTime = now;
      } else if (this.hasSpoken && this.speechStartTime) {
        const spokenDuration = this.lastSpokenTime - this.speechStartTime;
        const silenceDuration = now - this.lastSpokenTime;
        const silenceThreshold = this.options.silenceThresholdMs || 3000;
        // User must have spoken for at least 500ms and then paused for silenceThreshold
        if (spokenDuration >= 500 && silenceDuration >= silenceThreshold) {
          if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
          }
          if (this.options.onSilenceTimeout) {
            this.options.onSilenceTimeout();
            return;
          }
        }
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  public async stop(): Promise<AudioRecordingResult> {
    this.isRecording = false;
    this.cleanupTimers();

    return new Promise((resolve) => {
      const finish = () => {
        const durationMs = Date.now() - this.startTime;
        const mime = this.chosenMimeType || "audio/webm";
        const blob = new Blob(this.audioChunks, { type: mime });

        this.cleanupAudioContextAndStream();

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string) || "";
          resolve({
            blob,
            base64,
            mimeType: mime,
            durationMs,
            hasSpeech: this.hasSpoken || durationMs >= 600 || this.audioChunks.length > 0,
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

  public cancel(): void {
    this.isRecording = false;
    this.cleanupTimers();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.cleanupAudioContextAndStream();
    this.audioChunks = [];
  }

  private cleanupTimers() {
    if (this.silenceCheckTimer) {
      clearTimeout(this.silenceCheckTimer);
      this.silenceCheckTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private cleanupAudioContextAndStream() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.mediaStream = null;
    }
    this.options.onVolumeChange?.(0);
  }
}
