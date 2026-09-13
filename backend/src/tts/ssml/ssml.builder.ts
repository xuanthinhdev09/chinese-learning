import { SpeakerVoiceMap, SsmlDialogueLine } from './ssml.types';

/**
 * Builds Azure Speech SSML from structured DTO data. User text is ALWAYS
 * XML-escaped here — raw user input must never reach the SSML document,
 * otherwise it could inject arbitrary markup (SSML injection).
 */

const SSML_LANG = 'zh-CN';

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** App-level speed multiplier (0.5..2) → SSML relative rate ("+25%", "-25%"). */
export function prosodyRate(speed: number): string {
  const percent = Math.round((speed - 1) * 100);
  return `${percent >= 0 ? '+' : ''}${percent}%`;
}

function voiceBlock(voice: string, innerMarkup: string, speed: number): string {
  if (speed !== 1) {
    return `    <voice name="${voice}"><prosody rate="${prosodyRate(speed)}">${innerMarkup}</prosody></voice>`;
  }
  return `    <voice name="${voice}">${innerMarkup}</voice>`;
}

function wrapSsml(inner: string): string {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${SSML_LANG}">\n${inner}\n</speak>`;
}

/** Single text (word or sentence) spoken by one voice. */
export function buildTextSsml(text: string, voice: string, speed = 1): string {
  return wrapSsml(voiceBlock(voice, escapeXml(text), speed));
}

/**
 * Whole dialogue in one document: one <voice> per turn. The inter-turn
 * <break> lives INSIDE the next turn's <voice> — Azure rejects <break> as
 * a direct child of <speak> between voices (verified against the real
 * endpoint). Speakers must be resolved (no nulls) before this call; unknown
 * speakers fall back to A's voice defensively.
 */
export function buildDialogueSsml(
  lines: SsmlDialogueLine[],
  voices: SpeakerVoiceMap,
  pauseMs = 300,
  speed = 1,
): string {
  if (lines.length === 0) {
    throw new Error('Dialogue must contain at least one line');
  }

  const blocks: string[] = [];
  lines.forEach((line, index) => {
    const pause = index > 0 ? `<break time="${pauseMs}ms"/>` : '';
    blocks.push(voiceBlock(voices[line.speaker] ?? voices.A, pause + escapeXml(line.text), speed));
  });

  return wrapSsml(blocks.join('\n'));
}
