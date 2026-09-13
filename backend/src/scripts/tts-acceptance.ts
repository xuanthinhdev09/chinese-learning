import 'reflect-metadata';
import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';

/**
 * Manual Azure acceptance (spec §30) over HTTP against a RUNNING backend —
 * exercises the full production path (controller, guards, throttler, cache).
 *
 * NOT a Nest standalone context: tsx (esbuild) does not emit design:paramtypes
 * metadata, so Nest DI (JwtStrategy → ConfigService) fails outside ts-jest/tsc
 * runtimes. HTTP mode avoids that entirely.
 *
 * Run from backend/ with the dev container up and AZURE_SPEECH_* configured:
 *   npx tsx src/scripts/tts-acceptance.ts
 * Override target with TTS_ACCEPTANCE_BASE_URL (default http://localhost:3000).
 * Files land in storage/tts/acceptance/*.mp3 — play them in a browser.
 */

const BASE_URL = process.env.TTS_ACCEPTANCE_BASE_URL || 'http://localhost:3000';
const PASSWORD = 'Str0ng!Acc3ptance';

const LONG_PARAGRAPH =
  '汉语是世界上使用人数最多的语言之一。学习汉语不仅可以了解中国的历史文化，' +
  '还能帮助我们在工作和生活中结识更多的朋友。通过每天的练习，我们的听力和口语都会慢慢进步。';

interface AcceptanceCase {
  name: string;
  text?: string;
  lines?: Array<{ speaker?: string; text: string }>;
}

const CASES: AcceptanceCase[] = [
  { name: '1-word', text: '你好' },
  { name: '2-sentence', text: '你好，很高兴认识你。我叫李娜。' },
  { name: '3-paragraph', text: LONG_PARAGRAPH },
  {
    name: '4-dialogue-2-speakers',
    lines: [
      { speaker: 'A', text: '你好，你叫什么名字？' },
      { speaker: 'B', text: '我叫王明。你呢？' },
      { speaker: 'A', text: '我叫李娜，很高兴认识你。' },
    ],
  },
  {
    name: '5-dialogue-3-speakers',
    lines: [
      { speaker: 'A', text: '今天天气真好，我们去公园吧。' },
      { speaker: 'B', text: '好啊，我也正想去。' },
      { speaker: 'C', text: '等等我，我也一起去。' },
      { speaker: 'A', text: '那我们三点半在门口见。' },
    ],
  },
];

async function main(): Promise<void> {
  const suffix = Date.now();
  const email = `tts-accept-${suffix}@test.local`;

  // Register + login to get the JWT cookie (RegisterDto username max 20 chars).
  await axios.post(`${BASE_URL}/auth/register`, { email, username: `tts${suffix}`, password: PASSWORD });
  const login = await axios.post(`${BASE_URL}/auth/login`, { email, password: PASSWORD });
  const setCookie = login.headers['set-cookie'];
  const cookie = (Array.isArray(setCookie) ? setCookie : [setCookie])
    .map((c) => c.split(';')[0])
    .join('; ');

  const outDir = path.join(process.cwd(), 'storage', 'tts', 'acceptance');
  await fs.mkdir(outDir, { recursive: true });

  console.log(`Running Azure TTS acceptance against ${BASE_URL}…`);
  let totalRawChars = 0;
  for (const item of CASES) {
    const startedAt = Date.now();
    const isDialogue = Boolean(item.lines?.length);
    const synth = await axios.post(
      `${BASE_URL}/tts/${isDialogue ? 'dialogue' : 'synthesize'}`,
      isDialogue ? { lines: item.lines } : { text: item.text },
      { headers: { Cookie: cookie }, maxRedirects: 0 },
    );

    const { audioUrl, cached } = synth.data as { audioUrl: string; cached: boolean };
    const audio = await axios.get(`${BASE_URL}${audioUrl}`, { responseType: 'arraybuffer' });
    const outFile = path.join(outDir, `${item.name}.mp3`);
    await fs.writeFile(outFile, Buffer.from(audio.data));

    const rawChars = isDialogue
      ? (item.lines as Array<{ text: string }>).reduce((sum, line) => sum + line.text.length, 0)
      : (item.text as string).length;
    totalRawChars += rawChars;
    console.log(
      `✓ ${item.name}: ${outFile} (${audio.data.length} bytes, ${Date.now() - startedAt}ms, cached=${cached}, ` +
        `~${rawChars * 2} billed chars)`,
    );
  }

  console.log(
    `\nAll 5 files generated. Total ≈ ${totalRawChars * 2} billed chars ` +
      '(CJK counts as 2). Play them in a browser to verify voices and pauses.',
  );
}

main().catch((error) => {
  // exitCode (not exit) so stdout/stderr flush before the process ends on Windows.
  const detail = axios.isAxiosError(error) ? `${error.response?.status ?? ''} ${error.message}` : error;
  console.error('✗ Acceptance failed:', detail instanceof Error ? detail.message : detail);
  process.exitCode = 1;
});
