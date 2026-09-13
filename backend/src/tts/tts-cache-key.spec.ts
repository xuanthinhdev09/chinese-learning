import { buildTtsCacheKey, normalizeText } from './tts-cache-key';

const BASE = {
  type: 'text' as const,
  text: '你好',
  voices: ['zh-CN-XiaoxiaoNeural'],
  speed: 1,
  pauseMs: null,
  outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
};

describe('normalizeText', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeText('  你好   世界 ')).toBe('你好 世界');
  });
});

describe('buildTtsCacheKey', () => {
  it('is deterministic for identical params', () => {
    expect(buildTtsCacheKey(BASE)).toBe(buildTtsCacheKey(BASE));
  });

  it('produces a sha256 hex key', () => {
    expect(buildTtsCacheKey(BASE)).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each([
    ['text', { ...BASE, text: '再见' }],
    ['type', { ...BASE, type: 'dialogue' as const }],
    ['voices', { ...BASE, voices: ['zh-CN-YunxiNeural'] }],
    ['speed', { ...BASE, speed: 0.75 }],
    ['pauseMs', { ...BASE, type: 'dialogue' as const, lines: [], pauseMs: 500 }],
    ['outputFormat', { ...BASE, outputFormat: 'audio-16khz-32kbitrate-mono-mp3' }],
  ])('changes when %s changes', (_field, params) => {
    expect(buildTtsCacheKey(params)).not.toBe(buildTtsCacheKey(BASE));
  });

  it('treats equivalent text with different whitespace as the same key', () => {
    const key = buildTtsCacheKey(BASE);
    const same = buildTtsCacheKey({ ...BASE, text: ' 你好 ' });
    expect(same).toBe(key);
  });

  it('changes when dialogue line order changes', () => {
    const a = buildTtsCacheKey({
      ...BASE,
      type: 'dialogue',
      text: undefined,
      lines: [
        { speaker: 'A', text: '一' },
        { speaker: 'B', text: '二' },
      ],
    });
    const b = buildTtsCacheKey({
      ...BASE,
      type: 'dialogue',
      text: undefined,
      lines: [
        { speaker: 'B', text: '二' },
        { speaker: 'A', text: '一' },
      ],
    });
    expect(a).not.toBe(b);
  });
});
