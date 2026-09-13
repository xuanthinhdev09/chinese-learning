import { createHash } from 'crypto';

/**
 * Deterministic cache keys for synthesized audio. Every synthesis-affecting
 * parameter is part of the key: change one → new key → new synthesis.
 * The unit separator keeps field boundaries unambiguous.
 */

export const SSML_VERSION = '1.0';
const FIELD_SEPARATOR = '␟';

export interface TtsCacheKeyParams {
  type: 'text' | 'dialogue';
  /** Normalized plain text (text synthesis). */
  text?: string;
  /** Ordered dialogue lines (dialogue synthesis). */
  lines?: Array<{ speaker: string; text: string }>;
  /** Voices actually used, in speaking order. */
  voices: string[];
  speed: number;
  pauseMs?: number | null;
  outputFormat: string;
}

/** Collapse whitespace so trivial formatting differences share one cache entry. */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function buildTtsCacheKey(params: TtsCacheKeyParams): string {
  // Normalize inside the builder so callers can never hash unnormalized text.
  const text = params.text != null ? normalizeText(params.text) : '';
  const lines = params.lines?.map((line) => ({
    speaker: line.speaker,
    text: normalizeText(line.text),
  }));
  const parts = [
    params.type,
    text,
    lines ? JSON.stringify(lines) : '',
    params.voices.join('|'),
    params.speed.toFixed(2),
    params.pauseMs == null ? '' : String(params.pauseMs),
    params.outputFormat,
    SSML_VERSION,
  ];
  return createHash('sha256').update(parts.join(FIELD_SEPARATOR)).digest('hex');
}
