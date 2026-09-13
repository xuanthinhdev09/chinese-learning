import { alternateSpeaker, resolveSpeakerVoices } from './tts-voice-map';

describe('resolveSpeakerVoices', () => {
  it('returns the four default Mandarin voices without override', () => {
    const voices = resolveSpeakerVoices(null);
    expect(voices.A).toBe('zh-CN-XiaoxiaoNeural');
    expect(voices.B).toBe('zh-CN-YunxiNeural');
    expect(voices.C).toBe('zh-CN-YunxiaNeural');
    expect(voices.D).toBe('zh-CN-XiaohanNeural');
  });

  it('merges per-speaker overrides onto defaults', () => {
    const voices = resolveSpeakerVoices('B:zh-CN-YunjianNeural');
    expect(voices.B).toBe('zh-CN-YunjianNeural');
    expect(voices.A).toBe('zh-CN-XiaoxiaoNeural');
  });

  it('accepts multiple comma-separated overrides with spaces', () => {
    const voices = resolveSpeakerVoices(' A:zh-CN-XiaoyiNeural , D:zh-CN-YunyeNeural ');
    expect(voices.A).toBe('zh-CN-XiaoyiNeural');
    expect(voices.D).toBe('zh-CN-YunyeNeural');
  });

  it.each([
    ['unknown speaker "E"', 'E:zh-CN-XiaoxiaoNeural'],
    ['missing voice', 'A:'],
    ['missing separator', 'Azh-CN-XiaoxiaoNeural'],
  ])('throws on %s', (_case, override) => {
    expect(() => resolveSpeakerVoices(override)).toThrow(/TTS_VOICE_MAP/);
  });
});

describe('alternateSpeaker', () => {
  it('alternates A/B by position', () => {
    expect([0, 1, 2, 3, 4].map(alternateSpeaker)).toEqual(['A', 'B', 'A', 'B', 'A']);
  });
});
