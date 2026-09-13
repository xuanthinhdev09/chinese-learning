import { useEffect, useState, type ReactNode } from 'react';
import { useTtsAudio } from '../../hooks/use-tts-audio';
import { usePersistentToggle } from '../../hooks/use-persistent-toggle';
import { DialogueLine } from '../../api/daily-session';
import { LyricsPanel } from './lyrics-panel';
import { LyricsLayerToggles } from './lyrics-layer-toggles';
import { SpeedControl } from './speed-control';

interface DialogueReaderProps {
  title: string;
  lines: DialogueLine[];
  /** new = rate "Trôi/Chưa trôi" at the end; review = single confirm */
  mode: 'new' | 'review';
  onDone: (passed: boolean) => void;
  /** "Bước x/n + streak" của page — desktop: đá vào cột trái; mobile: xếp trên cùng. */
  sessionHeader?: ReactNode;
}

/**
 * Shadowing hội thoại theo style trình phát lời bài hát: toàn bộ dialogue
 * nằm trong MỘT panel tự trượt (LyricsPanel) — câu active to + đổi màu,
 * panel trượt căn giữa theo audio. Tap dòng = phát từ dòng đó.
 * Desktop (lg+): info phiên + điều khiển ở cột trái sticky, panel bên phải.
 */
export function DialogueReader({ title, lines, mode, onDone, sessionHeader }: DialogueReaderProps) {
  const [index, setIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1);
  const { playLines, stop, pause, resume, setSpeed, isBusy, isPaused } = useTtsAudio();
  // Toggle layer chữ: BẬT = hiện trên MỌI dòng (chuyển câu không chèn/xóa
  // nội dung → không giật), TẮT = ẩn toàn bộ (luyện nghe thuần chỉ hanzi).
  const [showPinyin, toggleShowPinyin] = usePersistentToggle('today-lyrics-pinyin');
  const [showVietnamese, toggleShowVietnamese] = usePersistentToggle('today-lyrics-vietnamese');

  // Panel có thể render lại với hội thoại khác (do-due-dialogue kế tiếp tại
  // cùng vị trí component) — reset về câu đầu để tránh "Câu N/M" sai.
  useEffect(() => {
    setIndex(0);
  }, [title]);

  // Per-line playlist: the highlight advances EXACTLY when each line's
  // audio starts — no time estimation involved.
  const handlePlayAll = () => {
    playLines(
      lines.map((item) => ({ speaker: item.speaker, text: item.hanzi })),
      { speed: speechRate },
      (lineIndex) => setIndex(lineIndex),
    );
  };

  // Tap dòng bất kỳ: phát từ dòng đó rồi tự chạy tiếp — slice playlist từ
  // vị trí tap, callback trả offset tương đối nên cộng lại bằng lineIndex.
  // stop() trước để hủy sequence phát đang chạy (nếu có) — nếu không,
  // tap lúc đang fetch cold-cache sẽ bị sequence cũ "cướp" playback.
  const handleSelectLine = (lineIndex: number) => {
    stop();
    setIndex(lineIndex);
    playLines(
      lines.slice(lineIndex).map((item) => ({ speaker: item.speaker, text: item.hanzi })),
      { speed: speechRate },
      (offset) => setIndex(lineIndex + offset),
    );
  };

  if (lines.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted">Bài học chưa có hội thoại.</p>
        <button onClick={() => onDone(true)} className="btn-secondary mt-4 px-6 py-2 rounded-lg">
          Bỏ qua →
        </button>
      </div>
    );
  }

  const isLast = index === lines.length - 1;

  const go = (delta: number) => {
    setIndex((current) => Math.min(Math.max(current + delta, 0), lines.length - 1));
  };

  return (
    <div className="mx-auto max-w-lg p-4 sm:max-w-2xl sm:p-6 lg:grid lg:max-w-6xl lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* Cột trái (desktop, sticky): thông tin phiên + điều khiển; mobile: xếp trên */}
      <aside className="lg:sticky lg:top-24">
        {sessionHeader && <div className="mb-4 lg:mb-6">{sessionHeader}</div>}
        <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
        <p className="mb-4 text-sm text-muted">
          Câu {index + 1}/{lines.length} • {mode === 'new' ? 'Bài mới — đọc theo' : 'Ôn tập'}
        </p>

        {lines.length > 1 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (isBusy) {
                  if (isPaused) {
                    resume();
                  } else {
                    pause();
                  }
                } else {
                  handlePlayAll();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background-alt active:scale-95 transition-all lg:w-full lg:justify-center"
              title={
                isBusy
                  ? isPaused
                    ? 'Phát tiếp từ vị trí đang dừng'
                    : 'Tạm dừng'
                  : 'Nghe cả bài hội thoại với giọng theo nhân vật'
              }
            >
              <span>{isBusy && !isPaused ? '⏸' : '▶'}</span>
              <span className="text-sm font-medium">
                {isBusy ? (isPaused ? 'Tiếp tục' : 'Tạm dừng') : 'Play cả bài'}
              </span>
            </button>

            <SpeedControl
              value={speechRate}
              onChange={(value) => {
                setSpeechRate(value);
                setSpeed(value);
              }}
            />

            <LyricsLayerToggles
              showPinyin={showPinyin}
              showVietnamese={showVietnamese}
              onTogglePinyin={toggleShowPinyin}
              onToggleVietnamese={toggleShowVietnamese}
            />
          </div>
        )}
      </aside>

      {/* Cột phải: panel lyrics + điều hướng */}
      <div>
        <LyricsPanel
          lines={lines}
          index={index}
          onSelectLine={handleSelectLine}
          showPinyin={showPinyin}
          showVietnamese={showVietnamese}
        />

        {isBusy && (
          <p className="mt-3 text-center text-sm text-muted animate-pulse">
            {isPaused ? 'Tạm dừng — bấm Tiếp tục để phát lại' : 'Đang phát…'}
          </p>
        )}

        {/* Line navigation */}
        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={() => go(-1)}
            disabled={index === 0}
            className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground hover:bg-background-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Trước
          </button>
          {!isLast ? (
            <button
              onClick={() => go(1)}
              className="flex-1 px-4 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark active:scale-95 transition-all"
            >
              Tiếp →
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              {mode === 'new' ? (
                <>
                  <button
                    onClick={() => onDone(true)}
                    className="flex-1 px-3 py-3 rounded-lg bg-accent text-white hover:bg-green-600 active:scale-95 transition-all font-semibold"
                    title="Đọc trôi chảy"
                  >
                    Trôi ✓
                  </button>
                  <button
                    onClick={() => onDone(false)}
                    className="flex-1 px-3 py-3 rounded-lg bg-warning text-white hover:bg-amber-600 active:scale-95 transition-all font-semibold"
                    title="Cần luyện lại"
                  >
                    Chưa ↻
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onDone(true)}
                  className="flex-1 px-3 py-3 rounded-lg bg-accent text-white hover:bg-green-600 active:scale-95 transition-all font-semibold"
                >
                  Đã ôn ✓
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
