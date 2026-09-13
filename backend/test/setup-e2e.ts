import 'reflect-metadata';
import * as os from 'os';
import * as path from 'path';

// E2E runs outside bootstrap(): isolate storage per run and guarantee a JWT
// secret even when backend/.env does not define one.
process.env.TTS_STORAGE_DIR = path.join(os.tmpdir(), `tts-e2e-${Date.now()}`);
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret';
// Fake credentials so the provider passes isConfigured(); axios is mocked in
// the spec, so no real Azure call ever happens.
process.env.AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || 'e2e-fake-key';
process.env.AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'southeastasia';
