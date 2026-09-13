import { useCallback, useEffect, useRef, useState } from 'react';
import {
  resolveAudioSrc,
  synthesizeText,
  TtsDialogueLine,
  TtsDialogueOptions,
  TtsSpeakOptions,
} from '../api/tts-api';
import { useChineseTTS } from './use-chinese-tts';

export interface UseTtsAudio {
  /** Speak one text via server TTS; falls back to browser speech on failure. */
  play: (text: string, options?: TtsSpeakOptions) => void;
  /**
   * Play a dialogue as a per-line playlist: each line is its own audio file
   * played back-to-back, so onLineStart fires EXACTLY when the line starts
   * (no char-ratio estimation). Lines without a speaker alternate A/B — the
   * same rule the backend applies for merged dialogue synthesis.
   */
  playLines: (
    lines: TtsDialogueLine[],
    options?: TtsDialogueOptions,
    onLineStart?: (index: number) => void,
  ) => void;
  stop: () => void;
  /** Tạm dừng sequence đang phát — giữ nguyên vị trí câu + giây. */
  pause: () => void;
  /** Phát tiếp từ vị trí đã tạm dừng. */
  resume: () => void;
  /**
   * Đổi tốc độ lúc đang phát: câu hiện tại áp qua audio.playbackRate tức thì
   * (audio đã synth với tốc độ cũ, browser giữ pitch); các câu sau synth theo
   * tốc độ mới. Khi không phát: chỉ lưu cho lần phát kế tiếp.
   */
  setSpeed: (speed: number) => void;
  /** True while synthesizing or during playback — drives button UI states. */
  isBusy: boolean;
  /** True khi sequence đang tạm dừng (isBusy vẫn true). */
  isPaused: boolean;
  /** Server TTS works everywhere; kept for existing isSupported gates. */
  isSupported: boolean;
}

/**
 * Azure-backed pronunciation: POST → audioUrl → <audio> playback, with the
 * fetched srcs memoized for the session so repeat taps don't re-request.
 * Any server failure (offline, 503 TTS_NOT_CONFIGURED, rate limit) degrades
 * silently to the Web Speech engine so learning is never interrupted.
 */
export function useTtsAudio(): UseTtsAudio {
  const [isBusy, setIsBusy] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const srcCache = useRef<Map<string, string>>(new Map());
  const inflightRef = useRef<Map<string, Promise<string | null>>>(new Map());
  const sequenceAbortRef = useRef(false);
  // Tốc độ "hiện hành" của sequence — đọc tại thời điểm synth từng dòng để
  // đổi tốc độ giữa chừng có hiệu lực từ câu kế tiếp.
  const speedRef = useRef(1);
  const { speak } = useChineseTTS();

  useEffect(
    () => () => {
      audioRef.current?.pause();
      srcCache.current.forEach((src) => {
        if (src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
      });
      srcCache.current.clear();
    },
    [],
  );

  const startPlayback = useCallback(
    (src: string, onTimeUpdate?: (currentTime: number, duration: number) => void) => {
      audioRef.current?.pause();
      const audio = new Audio(src);
      audio.onended = () => setIsBusy(false);
      audio.onplay = () => setIsBusy(true);
      // Media errors after playback starts never fire onended — reset the
      // busy state here so buttons don't stay disabled forever.
      audio.onerror = () => setIsBusy(false);
      if (onTimeUpdate) {
        audio.ontimeupdate = () => {
          if (audio.duration > 0) {
            onTimeUpdate(audio.currentTime, audio.duration);
          }
        };
      }
      audioRef.current = audio;
      void audio.play().catch(() => setIsBusy(false));
    },
    [],
  );

  const playCached = useCallback(
    async (
      cacheKey: string,
      synth: () => Promise<string>,
      fallback: () => void,
      onTimeUpdate?: (currentTime: number, duration: number) => void,
    ) => {
      setIsBusy(true);
      try {
        let src = srcCache.current.get(cacheKey);
        if (!src) {
          src = resolveAudioSrc(await synth());
          srcCache.current.set(cacheKey, src);
        }
        startPlayback(src, onTimeUpdate);
      } catch {
        // Server TTS unavailable — degrade to browser speech, no user-facing error.
        console.warn('Server TTS unavailable, falling back to browser speech');
        setIsBusy(false);
        fallback();
      }
    },
    [startPlayback],
  );

  const play = useCallback(
    (text: string, options: TtsSpeakOptions = {}) => {
      const cacheKey = JSON.stringify({ kind: 'text', text, ...options });
      void playCached(
        cacheKey,
        () => synthesizeText(text, options).then((r) => r.audioUrl),
        () => speak(text, options.speed ?? 0.8),
      );
    },
    [playCached, speak],
  );

  /** Single-file playback resolved on end/error — the playlist building block. */
  const playOne = useCallback(
    (src: string) =>
      new Promise<void>((resolve) => {
        audioRef.current?.pause();
        const audio = new Audio(src);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audioRef.current = audio;
        void audio.play().catch(() => resolve());
      }),
    [],
  );

  /**
   * Synthesize một dòng + ghi cache; trả src hoặc null khi server lỗi (429
   * throttle, network). In-flight dedup: prefetch pipeline và play loop cùng
   * chạm một dòng chưa cache phải dùng CHUNG một POST — nếu không, mỗi dòng
   * bị gọi 2 lần và chạm ngưỡng throttle 30 POST/phút rất nhanh.
   */
  const synthLine = useCallback((line: TtsDialogueLine, speaker: string): Promise<string | null> => {
    const cacheKey = JSON.stringify({
      kind: 'text',
      text: line.text,
      speaker,
      speed: speedRef.current,
    });
    const cached = srcCache.current.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
    const inflight = inflightRef.current.get(cacheKey);
    if (inflight) {
      return inflight;
    }
    const pending = (async () => {
      try {
        const src = resolveAudioSrc(
          (await synthesizeText(line.text, { speaker, speed: speedRef.current })).audioUrl,
        );
        srcCache.current.set(cacheKey, src);
        return src;
      } catch {
        return null;
      } finally {
        inflightRef.current.delete(cacheKey);
      }
    })();
    inflightRef.current.set(cacheKey, pending);
    return pending;
  }, []);

  const playDialogue = useCallback(
    (lines: TtsDialogueLine[], options: TtsDialogueOptions = {}, onLineStart?: (index: number) => void) => {
      sequenceAbortRef.current = false;
      speedRef.current = options.speed ?? 1;
      setIsPaused(false);
      setIsBusy(true);

      // Per-line speakers: explicit value wins, else alternate A/B (the
      // backend's merged-dialogue rule, applied client-side so each
      // per-line POST synthesizes the right voice).
      const speakers = lines.map((line, index) => line.speaker ?? (index % 2 === 0 ? 'A' : 'B'));

      void (async () => {
        try {
          // Prefetch pipeline: đổ cache TỪNG DÒNG (tuần tự) song song với
          // playback — playback thường không chờ; đổi tốc độ giữa chừng thì
          // các dòng chưa synth kịp dùng tốc độ mới.
          void (async () => {
            for (let i = 0; i < lines.length; i++) {
              if (sequenceAbortRef.current) {
                return;
              }
              await synthLine(lines[i], speakers[i]);
            }
          })();

          // Play back-to-back; advance the highlight exactly on each start.
          for (let index = 0; index < lines.length; index++) {
            if (sequenceAbortRef.current) {
              return;
            }
            onLineStart?.(index);
            // Throttle 429 là cửa sổ 1 phút — chờ rồi thử lại trước khi đổ
            // giọng fallback (đọc cả bài bằng giọng máy rất khó chịu giữa
            // chừng Azure).
            let src = await synthLine(lines[index], speakers[index]);
            for (const retryDelayMs of [5000, 10000]) {
              if (src || sequenceAbortRef.current) {
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
              if (sequenceAbortRef.current) {
                return;
              }
              src = await synthLine(lines[index], speakers[index]);
            }
            if (sequenceAbortRef.current) {
              return;
            }
            if (!src) {
              throw new Error('synthesis failed');
            }
            await playOne(src);
          }
          setIsBusy(false);
        } catch {
          // Server TTS unavailable — degrade to browser speech, no user-facing error.
          console.warn('Server TTS unavailable, falling back to browser speech');
          setIsBusy(false);
          speak(lines.map((line) => line.text).join(' '));
        }
      })();
    },
    [playOne, speak, synthLine],
  );

  const stop = useCallback(() => {
    sequenceAbortRef.current = true;
    audioRef.current?.pause();
    setIsPaused(false);
    setIsBusy(false);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    void audioRef.current?.play().catch(() => setIsBusy(false));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  return {
    play,
    playLines: playDialogue,
    stop,
    pause,
    resume,
    setSpeed,
    isBusy,
    isPaused,
    isSupported: true,
  };
}
