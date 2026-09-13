import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import { promises as fs } from 'fs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * HTTP integration tests for /tts with the real app wiring (validation,
 * guards, throttler, Prisma) and a mocked Azure transport via axios spy.
 * Requires the dev Postgres to be running (DATABASE_URL from backend/.env).
 */

const FAKE_AUDIO = Buffer.from('fake-mp3-audio-bytes');

describe('TTS endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let axiosSpy: jest.SpyInstance;
  let authCookie: string;
  const createdCacheKeys: string[] = [];

  const synthesize = (body: object, status = 200) =>
    request(app.getHttpServer()).post('/tts/synthesize').set('Cookie', authCookie).send(body).expect(status);

  const audioUrlKey = (audioUrl: string) => audioUrl.split('/').pop() as string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser()); // JwtAuthGuard reads tokens from req.cookies
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = Date.now();
    const email = `tts-e2e-${suffix}@test.local`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, username: `tts${suffix}`, password: 'Str0ng!Passw0rd' }) // username max 20 chars
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Str0ng!Passw0rd' })
      .expect(200);
    const setCookie = login.headers['set-cookie'];
    const cookies: string[] = Array.isArray(setCookie) ? setCookie : [setCookie];
    authCookie = cookies.map((cookie) => cookie.split(';')[0]).join('; ');

    axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue({ data: FAKE_AUDIO });
  });

  afterAll(async () => {
    await prisma.ttsAudio.deleteMany({ where: { cacheKey: { in: createdCacheKeys } } });
    await app.close();
    await fs.rm(process.env.TTS_STORAGE_DIR as string, { recursive: true, force: true });
  });

  it('401 when POST without JWT', () => {
    return request(app.getHttpServer()).post('/tts/synthesize').send({ text: '你好' }).expect(401);
  });

  it('synthesizes once, then serves the second identical request from cache', async () => {
    const first = await synthesize({ text: '你好，很高兴认识你。' });
    expect(first.body.cached).toBe(false);
    expect(first.body.audioUrl).toMatch(/^\/tts\/audio\/[a-f0-9]{64}$/);
    createdCacheKeys.push(audioUrlKey(first.body.audioUrl));
    expect(axiosSpy).toHaveBeenCalledTimes(1);

    const second = await synthesize({ text: '你好，很高兴认识你。' });
    expect(second.body.cached).toBe(true);
    expect(second.body.audioUrl).toBe(first.body.audioUrl);
    expect(axiosSpy).toHaveBeenCalledTimes(1);
  });

  it('serves cached audio with mp3 content type and immutable caching', async () => {
    const synth = await synthesize({ text: '测试音频下载。' });
    createdCacheKeys.push(audioUrlKey(synth.body.audioUrl));

    const res = await request(app.getHttpServer()).get(synth.body.audioUrl).expect(200);
    expect(res.headers['content-type']).toContain('audio/mpeg');
    expect(res.headers['cache-control']).toContain('immutable');
    expect(res.body).toEqual(FAKE_AUDIO);
  });

  it('rejects malformed cache keys and unknown keys', async () => {
    await request(app.getHttpServer()).get('/tts/audio/not-a-hash').expect(400);
    await request(app.getHttpServer()).get(`/tts/audio/${'a'.repeat(64)}`).expect(404);
  });

  it('maps Azure 429 to 503 TTS_QUOTA', async () => {
    axiosSpy.mockRejectedValueOnce({ isAxiosError: true, response: { status: 429 }, message: 'rate limited' });
    const res = await synthesize({ text: '配额测试。' }, 503);
    expect(res.body.message).toBe('TTS_QUOTA');
  });

  it('merges dialogue turns into one synthesis with per-speaker voices', async () => {
    const callsBefore = axiosSpy.mock.calls.length;
    const res = await request(app.getHttpServer())
      .post('/tts/dialogue')
      .set('Cookie', authCookie)
      .send({ lines: [{ speaker: 'A', text: '你好，你叫什么名字？' }, { text: '我叫王明。你呢？' }] })
      .expect(200);
    expect(res.body.cached).toBe(false);
    createdCacheKeys.push(audioUrlKey(res.body.audioUrl));
    expect(axiosSpy.mock.calls.length).toBe(callsBefore + 1);

    const ssml = axiosSpy.mock.calls[callsBefore][1] as string; // [url, ssml, config]
    expect(ssml).toContain('zh-CN-XiaoxiaoNeural');
    expect(ssml).toContain('zh-CN-YunxiNeural');
    expect(ssml).toContain('<break time="300ms"/>');
  });

  it('synthesizes a slower dialogue as a separate cache entry', async () => {
    const lines = [{ speaker: 'A', text: '你好' }, { speaker: 'B', text: '我很好' }];
    const normal = await request(app.getHttpServer())
      .post('/tts/dialogue')
      .set('Cookie', authCookie)
      .send({ lines })
      .expect(200);
    createdCacheKeys.push(audioUrlKey(normal.body.audioUrl));

    const slower = await request(app.getHttpServer())
      .post('/tts/dialogue')
      .set('Cookie', authCookie)
      .send({ lines, speed: 0.75 })
      .expect(200);
    createdCacheKeys.push(audioUrlKey(slower.body.audioUrl));

    expect(slower.body.cached).toBe(false);
    expect(slower.body.audioUrl).not.toBe(normal.body.audioUrl);
    const callsBefore = axiosSpy.mock.calls.length;
    const slowestSsml = axiosSpy.mock.calls[callsBefore - 1][1] as string;
    expect(slowestSsml).toContain('<prosody rate="-25%">');
  });

  it('rejects invalid payloads with 400', async () => {
    await synthesize({ text: '' }, 400);
    await synthesize({ text: '你好', speed: 9 }, 400);
    await request(app.getHttpServer())
      .post('/tts/dialogue')
      .set('Cookie', authCookie)
      .send({ lines: [{ speaker: 'Z', text: '你好' }] })
      .expect(400);
  });

  // Kept last: this test exhausts the per-IP throttle bucket for the app.
  it('throttles synthesize beyond 30 requests per minute', async () => {
    let sawThrottled = false;
    for (let i = 0; i < 35 && !sawThrottled; i++) {
      const res = await request(app.getHttpServer())
        .post('/tts/synthesize')
        .set('Cookie', authCookie)
        .send({ text: `throttle-probe ${Date.now()} ${i}` });
      if (res.status === 429) {
        sawThrottled = true;
      }
    }
    expect(sawThrottled).toBe(true);
  }, 60000);
});
