import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SynthesizeTextDto } from './synthesize-text.dto';
import { DialogueLineDto, SynthesizeDialogueDto } from './synthesize-dialogue.dto';

async function validateDto(dtoClass: new () => object, plain: Record<string, unknown>) {
  const instance = plainToInstance(dtoClass, plain, { exposeDefaultValues: true });
  return validate(instance as object, { whitelist: true, forbidNonWhitelisted: true });
}

describe('SynthesizeTextDto', () => {
  it('accepts a valid request', async () => {
    const errors = await validateDto(SynthesizeTextDto, { text: '你好' });
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['empty text', { text: '' }],
    ['text over 2000 chars', { text: '好'.repeat(2001) }],
    ['unknown speaker', { text: '你好', speaker: 'E' }],
    ['speed below range', { text: '你好', speed: 0.3 }],
    ['speed above range', { text: '你好', speed: 2.5 }],
    ['non-string text', { text: 123 }],
  ])('rejects %s', async (_case, plain) => {
    const errors = await validateDto(SynthesizeTextDto, plain);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts boundary speeds 0.5 and 2', async () => {
    const errors = await validateDto(SynthesizeTextDto, { text: '你好', speed: 0.5 });
    const fast = await validateDto(SynthesizeTextDto, { text: '你好', speed: 2 });
    expect(errors).toHaveLength(0);
    expect(fast).toHaveLength(0);
  });
});

describe('SynthesizeDialogueDto', () => {
  const validLines = [{ speaker: 'A', text: '你好' }, { text: '我很好' }];

  it('accepts lines with and without speaker', async () => {
    const errors = await validateDto(SynthesizeDialogueDto, { lines: validLines });
    expect(errors).toHaveLength(0);
  });

  it('rejects more than 50 lines', async () => {
    const lines = Array.from({ length: 51 }, () => ({ speaker: 'A', text: '好' }));
    const errors = await validateDto(SynthesizeDialogueDto, { lines });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a line over 500 chars', async () => {
    const errors = await validateDto(SynthesizeDialogueDto, {
      lines: [{ speaker: 'A', text: '好'.repeat(501) }],
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects unknown speaker and out-of-range pause', async () => {
    const badSpeaker = await validateDto(SynthesizeDialogueDto, {
      lines: [{ speaker: 'F', text: '好' }],
    });
    const badPause = await validateDto(SynthesizeDialogueDto, {
      lines: [{ text: '好' }],
      pauseMs: 3000,
    });
    expect(badSpeaker.length).toBeGreaterThan(0);
    expect(badPause.length).toBeGreaterThan(0);
  });

  it('rejects non-array lines', async () => {
    const errors = await validateDto(SynthesizeDialogueDto, { lines: '你好' });
    expect(errors.length).toBeGreaterThan(0);
  });
});
