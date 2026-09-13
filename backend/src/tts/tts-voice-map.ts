/**
 * Speaker → Azure neural voice mapping.
 * Defaults live in code so a missing TTS_VOICE_MAP never breaks synthesis;
 * the env var merges per-speaker overrides on top (format "A:voice,B:voice").
 */

export const SPEAKERS = ['A', 'B', 'C', 'D'] as const;
export type SpeakerId = (typeof SPEAKERS)[number];

export const DEFAULT_SPEAKER_VOICES: Record<SpeakerId, string> = {
  A: 'zh-CN-XiaoxiaoNeural',
  B: 'zh-CN-YunxiNeural',
  C: 'zh-CN-YunxiaNeural',
  D: 'zh-CN-XiaohanNeural',
};

export function isValidSpeaker(value: string): value is SpeakerId {
  return (SPEAKERS as readonly string[]).includes(value);
}

/**
 * Merge env overrides ("A:zh-CN-XiaohanNeural,C:...") onto the defaults.
 * Throws on malformed entries so a typo in config fails loudly, not silently.
 */
export function resolveSpeakerVoices(override?: string | null): Record<SpeakerId, string> {
  const map: Record<SpeakerId, string> = { ...DEFAULT_SPEAKER_VOICES };
  if (!override) {
    return map;
  }

  for (const pair of override.split(',')) {
    const trimmed = pair.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const separatorIndex = trimmed.indexOf(':');
    const speaker = separatorIndex > 0 ? trimmed.slice(0, separatorIndex).trim() : '';
    const voice = separatorIndex > 0 ? trimmed.slice(separatorIndex + 1).trim() : '';
    if (!isValidSpeaker(speaker) || voice.length === 0) {
      throw new Error(`Invalid TTS_VOICE_MAP entry "${trimmed}" (expected "A:zh-CN-XxxNeural")`);
    }
    map[speaker] = voice;
  }

  return map;
}

/**
 * Speaker used when a dialogue line has no speaker in the data: alternate
 * A/B by position so a two-person dialogue reads naturally without waiting
 * for speaker metadata to be imported.
 */
export function alternateSpeaker(index: number): SpeakerId {
  return index % 2 === 0 ? 'A' : 'B';
}
