import { buildDialogueSsml, buildTextSsml, escapeXml, prosodyRate } from './ssml.builder';
import { DEFAULT_SPEAKER_VOICES } from '../tts-voice-map';

describe('escapeXml', () => {
  it('escapes all SSML-significant characters', () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });

  it('leaves plain Chinese text untouched', () => {
    expect(escapeXml('你好，很高兴认识你。')).toBe('你好，很高兴认识你。');
  });
});

describe('prosodyRate', () => {
  it('maps 0.75x to -25%', () => expect(prosodyRate(0.75)).toBe('-25%'));
  it('maps 1.25x to +25%', () => expect(prosodyRate(1.25)).toBe('+25%'));
  it('maps 1.0x to +0%', () => expect(prosodyRate(1)).toBe('+0%'));
});

describe('buildTextSsml', () => {
  it('wraps text in a single voice element', () => {
    const ssml = buildTextSsml('你好', DEFAULT_SPEAKER_VOICES.A);
    expect(ssml).toContain('<speak version="1.0"');
    expect(ssml).toContain('xml:lang="zh-CN"');
    expect(ssml).toContain('<voice name="zh-CN-XiaoxiaoNeural">你好</voice>');
  });

  it('adds prosody when speed differs from 1', () => {
    const ssml = buildTextSsml('你好', DEFAULT_SPEAKER_VOICES.A, 0.75);
    expect(ssml).toContain('<prosody rate="-25%">你好</prosody>');
  });

  it('omits prosody at normal speed', () => {
    expect(buildTextSsml('你好', DEFAULT_SPEAKER_VOICES.A, 1)).not.toContain('prosody');
  });

  it('escapes user text inside the voice element', () => {
    const ssml = buildTextSsml('a<b&c', DEFAULT_SPEAKER_VOICES.A);
    expect(ssml).toContain('a&lt;b&amp;c');
    expect(ssml).not.toContain('a<b&c');
  });
});

describe('buildDialogueSsml', () => {
  const lines = [
    { speaker: 'A', text: '你好，你叫什么名字？' },
    { speaker: 'B', text: '我叫王明。你呢？' },
    { speaker: 'A', text: '我叫李娜，很高兴认识你。' },
  ];

  it('emits one voice element per turn in order', () => {
    const ssml = buildDialogueSsml(lines, DEFAULT_SPEAKER_VOICES);
    const xiaoxiao = ssml.indexOf('zh-CN-XiaoxiaoNeural');
    const yunxi = ssml.indexOf('zh-CN-YunxiNeural');
    expect(xiaoxiao).toBeGreaterThan(-1);
    expect(yunxi).toBeGreaterThan(xiaoxiao);
    expect(ssml).toContain('你叫什么名字');
    expect(ssml).toContain('我叫王明');
  });

  it('inserts a break between turns with the configured pause', () => {
    const ssml = buildDialogueSsml(lines, DEFAULT_SPEAKER_VOICES, 500);
    expect(ssml.match(/<break time="500ms"\/>/g)).toHaveLength(2);
  });

  it('keeps breaks INSIDE voice elements — Azure rejects breaks between voices', () => {
    const ssml = buildDialogueSsml(lines, DEFAULT_SPEAKER_VOICES, 300);
    expect(ssml).toContain('<voice name="zh-CN-YunxiNeural"><break time="300ms"/>我叫王明');
    expect(ssml).not.toMatch(/<\/voice>\s*<break/);
  });

  it('defaults pause to 300ms', () => {
    const ssml = buildDialogueSsml(lines, DEFAULT_SPEAKER_VOICES);
    expect(ssml).toContain('<break time="300ms"/>');
  });

  it('throws on an empty dialogue', () => {
    expect(() => buildDialogueSsml([], DEFAULT_SPEAKER_VOICES)).toThrow();
  });

  it('falls back to voice A for an unresolved speaker', () => {
    const ssml = buildDialogueSsml([{ speaker: 'Z', text: '你好' }], DEFAULT_SPEAKER_VOICES);
    expect(ssml).toContain('zh-CN-XiaoxiaoNeural');
  });

  it('applies prosody to every turn when speed differs from 1', () => {
    const ssml = buildDialogueSsml(
      [
        { speaker: 'A', text: '你好' },
        { speaker: 'B', text: '我很好' },
      ],
      DEFAULT_SPEAKER_VOICES,
      300,
      0.75,
    );
    expect(ssml.match(/<prosody rate="-25%">/g)).toHaveLength(2);
  });
});
