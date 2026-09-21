import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useExerciseAudioBlob } from '../../hooks/use-exercise-media';

interface AudioPlayerState {
  /** filename of the loaded track, null = nothing loaded */
  current: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  /** true while the active track's blob is still downloading */
  loading: boolean;
  /** true when fetching the active track failed (file missing) */
  failed: boolean;
  /** the active inline player is on screen → sticky bottom bar can hide */
  inlineVisible: boolean;
  setInlineVisible: (visible: boolean) => void;
  toggle: (filename: string) => void;
  seek: (time: number) => void;
  close: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerState | null>(null);

export function useAudioPlayer(): AudioPlayerState {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used inside AudioPlayerProvider');
  return ctx;
}

/**
 * Owns the single <audio> element for the whole exercises page, so only one
 * track can ever sound: toggling another filename swaps the source, which
 * stops the previous one. Inline players and the sticky bottom bar are both
 * just views on this state.
 */
export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [inlineVisible, setInlineVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlayRef = useRef(false);

  const query = useExerciseAudioBlob(current);
  const blobUrl = query.data;
  const loading = !!current && query.isLoading;
  const failed = !!current && query.isError;

  // Swap the source when the chosen track's blob URL is ready.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current || !blobUrl) return;
    if (audio.dataset.track !== current) {
      audio.dataset.track = current;
      audio.src = blobUrl;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      if (shouldPlayRef.current) {
        audio.play().catch(() => setPlaying(false));
        shouldPlayRef.current = false;
      }
    }
  }, [blobUrl, current]);

  const toggle = useCallback(
    (filename: string) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (current === filename) {
        // a second tap while the new blob is still loading cancels the
        // pending autoplay instead of leaving it armed
        shouldPlayRef.current = false;
        if (audio.paused) {
          audio.play().catch(() => setPlaying(false));
        } else {
          audio.pause();
        }
        return;
      }
      shouldPlayRef.current = true;
      setCurrent(filename);
      setCurrentTime(0);
      setDuration(0);
    },
    [current],
  );

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setCurrent(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        current,
        playing,
        currentTime,
        duration,
        loading,
        failed,
        inlineVisible,
        setInlineVisible,
        toggle,
        seek,
        close,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        preload="none"
      />
    </AudioPlayerContext.Provider>
  );
}
