import { apiClient } from '../lib/api-client';

/**
 * Server-side TTS client. The frontend never knows voice names — it only
 * sends speaker letters (A-D) and text; the backend maps speakers to Azure
 * neural voices. Audio files are public GETs (unguessable sha256 keys).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TtsResult {
  audioUrl: string;
  cached: boolean;
}

export interface TtsSpeakOptions {
  /** Voice slot A-D; omitted → backend default voice. */
  speaker?: string;
  /** Playback rate multiplier 0.5-2 (1 = normal). */
  speed?: number;
}

export interface TtsDialogueLine {
  /** Absent → backend alternates A/B by line position. */
  speaker?: string | null;
  text: string;
}

/** Prefix backend-relative audio URLs with the API origin. */
export function resolveAudioSrc(audioUrl: string): string {
  return `${API_URL}${audioUrl}`;
}

export async function synthesizeText(text: string, options: TtsSpeakOptions = {}): Promise<TtsResult> {
  const response = await apiClient.post('/tts/synthesize', {
    text,
    ...(options.speaker ? { speaker: options.speaker } : {}),
    ...(options.speed != null ? { speed: options.speed } : {}),
  });
  if (!response.ok) {
    throw new Error(`TTS synthesize failed (${response.status})`);
  }
  return response.json();
}

export interface TtsDialogueOptions {
  pauseMs?: number;
  /** Playback rate multiplier 0.5-2 (1 = normal). */
  speed?: number;
}

export async function synthesizeDialogue(
  lines: TtsDialogueLine[],
  options: TtsDialogueOptions = {},
): Promise<TtsResult> {
  const response = await apiClient.post('/tts/dialogue', {
    lines: lines.map((line) => ({ ...(line.speaker ? { speaker: line.speaker } : {}), text: line.text })),
    ...(options.pauseMs != null ? { pauseMs: options.pauseMs } : {}),
    ...(options.speed != null ? { speed: options.speed } : {}),
  });
  if (!response.ok) {
    throw new Error(`TTS dialogue failed (${response.status})`);
  }
  return response.json();
}
