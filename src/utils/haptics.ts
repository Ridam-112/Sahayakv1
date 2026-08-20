/**
 * Mobile Haptic Feedback Utility (Navigator Vibration API)
 * Provides non-visual tactical confirmation of AI voice agent states,
 * microphone activation, recording completion, and speech detection.
 */

export const HAPTIC_PATTERNS = {
  // Mic activated / Recording starts: single crisp, energetic pulse
  MIC_START: [45],
  // Mic deactivated / Recording stopped / Processing: distinct double confirmation pulse
  MIC_STOP: [60, 40, 60],
  // Speech/VAD detected: subtle light tick
  SPEECH_DETECTED: [25],
  // Turn completed / Success
  SUCCESS: [30, 40, 60],
  // Error or permission blocked: warning vibration
  ERROR: [80, 50, 80],
  // Light touch tap
  TAP: [20],
} as const;

/**
 * Checks if the browser & device support the Web Vibration API.
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/**
 * Triggers a vibration pattern if supported by the user device.
 * Wrapped in a safe try-catch to prevent any runtime exceptions.
 */
export function triggerHaptic(pattern: number | number[] | readonly number[]): boolean {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      return navigator.vibrate(pattern as VibratePattern);
    }
  } catch (e) {
    // Browsers with strict vibration sandboxing or user gesture policies may silently ignore
    console.debug("[Haptic Notice] Vibration API note:", e);
  }
  return false;
}

/**
 * Haptic pulse when the microphone starts listening or recording begins.
 * Provides physical non-visual confirmation that the AI is listening.
 */
export function hapticMicStart(): void {
  triggerHaptic(HAPTIC_PATTERNS.MIC_START);
}

/**
 * Haptic pulse when the microphone stops recording / input is submitted for processing.
 * Provides physical confirmation that voice input was captured and audio is processing.
 */
export function hapticMicStop(): void {
  triggerHaptic(HAPTIC_PATTERNS.MIC_STOP);
}

/**
 * Subtle micro-pulse when voice activity detection (VAD) detects citizen speech.
 */
export function hapticSpeechDetected(): void {
  triggerHaptic(HAPTIC_PATTERNS.SPEECH_DETECTED);
}

/**
 * Haptic pattern for voice flow success (e.g. scheme matching complete).
 */
export function hapticSuccess(): void {
  triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
}

/**
 * Haptic pattern for errors or mic permissions issues.
 */
export function hapticError(): void {
  triggerHaptic(HAPTIC_PATTERNS.ERROR);
}

/**
 * Light haptic tap for interaction.
 */
export function hapticTap(): void {
  triggerHaptic(HAPTIC_PATTERNS.TAP);
}
