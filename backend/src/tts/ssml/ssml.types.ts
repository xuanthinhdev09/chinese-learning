/**
 * Shared SSML builder types for the TTS module.
 */

/** One dialogue turn: speaker is 'A'..'D' (nulls resolved before building). */
export interface SsmlDialogueLine {
  speaker: string;
  text: string;
}

/** Speaker → Azure neural voice name (e.g. A → zh-CN-XiaoxiaoNeural). */
export type SpeakerVoiceMap = Record<string, string>;
