import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer } from './audio-player-context';

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function PlayPauseButton({ filename, size = 'md' }: { filename: string; size?: 'md' | 'lg' }) {
  const player = useAudioPlayer();
  const active = player.current === filename;
  const playing = active && player.playing;
  // disabled only while THIS track's blob is still downloading — an inactive
  // button must stay clickable so the first tap can start playback
  const dim = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  return (
    <button
      type="button"
      aria-label={playing ? 'Pause' : 'Play'}
      disabled={active && player.loading}
      onClick={() => player.toggle(filename)}
      className={`${dim} flex shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-40 ${
        playing ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {active && player.loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : playing ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <rect x="5" y="4" width="3.5" height="12" rx="1" />
          <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M6 4.5v11a1 1 0 0 0 1.54.84l8.4-5.5a1 1 0 0 0 0-1.68l-8.4-5.5A1 1 0 0 0 6 4.5z" />
        </svg>
      )}
    </button>
  );
}

function ProgressSlider({ filename, compact = false }: { filename: string; compact?: boolean }) {
  const player = useAudioPlayer();
  const active = player.current === filename;
  return (
    <input
      type="range"
      min={0}
      max={player.duration || 0}
      step={0.1}
      value={active ? player.currentTime : 0}
      disabled={!active || player.loading || !player.duration}
      onChange={(e) => player.seek(Number(e.target.value))}
      aria-label="Seek"
      className={`w-full accent-blue-600 disabled:opacity-40 ${compact ? 'h-1.5' : 'h-2'}`}
    />
  );
}

/**
 * Inline player for one workbook track. Shows real progress only while its
 * track is the active one; reports viewport visibility so the sticky bottom
 * bar can take over once this player scrolls out of sight.
 */
export function ExerciseAudioPlayer({ filename }: { filename: string }) {
  const player = useAudioPlayer();
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);
  const active = player.current === filename;
  const { setInlineVisible } = player;

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInlineVisible(entry.isIntersecting));
    observer.observe(el);
    setInlineVisible(true);
    return () => {
      observer.disconnect();
      setInlineVisible(true);
    };
  }, [active, setInlineVisible]);

  if (active && player.failed) {
    return <p className="text-sm text-red-600">{t('exercises.audioMissing', { file: filename })}</p>;
  }

  return (
    <div ref={ref}>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
        <PlayPauseButton filename={filename} />
        <div className="min-w-0 flex-1">
          <ProgressSlider filename={filename} />
          <div className="flex justify-between text-[10px] tabular-nums text-gray-500">
            <span>{active ? fmt(player.currentTime) : '0:00'}</span>
            <span>{active && player.duration ? fmt(player.duration) : '--:--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fixed bottom mini-player — stays usable once the inline player is off-screen. */
export function StickyAudioBar() {
  const player = useAudioPlayer();
  const current = player.current;
  if (!current || player.inlineVisible) return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2">
        <PlayPauseButton filename={current} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-baseline justify-between gap-2">
            <span className="truncate text-xs font-medium text-gray-700">{current}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-gray-500">
              {fmt(player.currentTime)} / {player.duration ? fmt(player.duration) : '--:--'}
            </span>
          </div>
          <ProgressSlider filename={current} compact />
        </div>
        <button
          type="button"
          aria-label="Close player"
          onClick={player.close}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.3 6.3a1 1 0 0 1 1.4 0L10 8.6l2.3-2.3a1 1 0 1 1 1.4 1.4L11.4 10l2.3 2.3a1 1 0 0 1-1.4 1.4L10 11.4l-2.3 2.3a1 1 0 0 1-1.4-1.4L8.6 10 6.3 7.7a1 1 0 0 1 0-1.4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
