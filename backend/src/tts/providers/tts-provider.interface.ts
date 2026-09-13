/**
 * Provider-agnostic TTS synthesis port. The rest of the app depends on this
 * interface, never on the Azure REST client directly, so the provider can be
 * swapped (another cloud, self-hosted) without touching orchestration.
 */

export type TtsErrorCode =
  | 'TTS_NOT_CONFIGURED'
  | 'TTS_AUTH'
  | 'TTS_FORBIDDEN'
  | 'TTS_QUOTA'
  | 'TTS_INVALID_REQUEST'
  | 'TTS_UPSTREAM';

export class TtsError extends Error {
  constructor(
    public readonly code: TtsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'TtsError';
  }
}

export interface TtsProvider {
  /** True when credentials are present (cache hits still work without). */
  isConfigured(): boolean;
  /** Synthesize a full SSML document to audio bytes in the given format. */
  synthesizeSsml(ssml: string, outputFormat: string): Promise<Buffer>;
}
