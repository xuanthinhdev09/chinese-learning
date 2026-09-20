import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTtsAudio } from '../../hooks/use-tts-audio';
import { usePersistentToggle } from '../../hooks/use-persistent-toggle';
import { DialogueLine } from '../../api/daily-session';
import { DialogueActions, PlaybackControls } from './dialogue-controls';
import { GroupSelect } from './group-select';
import { LyricsPanel } from './lyrics-panel';

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
 * panel trượt căn giữa theo audio. Tap dòng = nhảy tới dòng đó (không tự phát).
 *
 * Mobile (<lg): khung vừa viewport (header + info trên, panel lyrics co giãn
 * giữa, bar thao tác nằm dưới cùng TRONG FLOW) — mọi nút thao tác luôn trong
 * tầm tay và không bao giờ đè lên nội dung hội thoại vì trang không cuộn,
 * panel tự cuộn nội bộ phía trên bar.
 *
 * Desktop (lg+): info phiên + điều khiển ở cột trái sticky, panel bên phải.
 */
export function DialogueReader({ title, lines, mode, onDone, sessionHeader }: DialogueReaderProps) {
  const [index, setIndex] = useState(0);
  const [groupIndex, setGroupIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1);
  const { playLines, stop, pause, resume, setSpeed, isBusy, isPaused } = useTtsAudio();
  // Toggle layer chữ: BẬT = hiện trên MỌI dòng (chuyển câu không chèn/xóa
  // nội dung → không giật), TẮT = ẩn toàn bộ (luyện nghe thuần chỉ hanzi).
  const [showPinyin, toggleShowPinyin] = usePersistentToggle('today-lyrics-pinyin');
  const [showVietnamese, toggleShowVietnamese] = usePersistentToggle('today-lyrics-vietnamese');

  // Chia phiên luyện theo 课文 (3-4 đoạn/bài): mỗi đoạn là một lượt đọc/phát
  // riêng — hết đoạn tự sang đoạn kế, chỉ đoạn cuối mới chấm Trôi/Chưa.
  // Dữ liệu legacy không có dialogueOrder → gộp thành 1 nhóm như cũ.
  const groups = useMemo(() => {
    const result: DialogueLine[][] = [];
    for (const line of lines) {
      const last = result[result.length - 1];
      const sameGroup =
        last !== undefined &&
        line.dialogueOrder !== null &&
        last[0].dialogueOrder === line.dialogueOrder;
      if (sameGroup) {
        last.push(line);
      } else {
        result.push([line]);
      }
    }
    return result;
  }, [lines]);
  const safeGroupIndex = Math.min(groupIndex, groups.length - 1);
  const groupLines = groups[safeGroupIndex] ?? [];
  const isLastGroup = safeGroupIndex === groups.length - 1;
  const linesBeforeGroup = groups
    .slice(0, safeGroupIndex)
    .reduce((sum, group) => sum + group.length, 0);

  // Panel có thể render lại với hội thoại khác (do-due-dialogue kế tiếp tại
  // cùng vị trí component) — reset về câu đầu để tránh "Câu N/M" sai.
  useEffect(() => {
    setIndex(0);
    setGroupIndex(0);
  }, [title]);

  // Per-line playlist: the highlight advances EXACTLY when each line's
  // audio starts — no time estimation involved. Phát từ câu ĐANG ACTIVE tới
  // hết đoạn (slice từ index), callback trả offset nên cộng lại bằng lineIndex.
  const handlePlayAll = () => {
    playLines(
      groupLines.slice(index).map((item) => ({ speaker: item.speaker, text: item.hanzi })),
      { speed: speechRate },
      (offset) => setIndex(index + offset),
    );
  };

  // Phát/tạm dừng/tiếp tục — một nút duy nhất, trạng thái do isBusy/isPaused quyết định
  const handlePlayPause = () => {
    if (isBusy) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      handlePlayAll();
    }
  };

  // Tap dòng bất kỳ: CHỈ nhảy highlight tới dòng đó, KHÔNG tự phát audio.
  // stop() trước để hủy sequence đang chạy (nếu có) — nếu không, highlight
  // sẽ bị playback đang chạy ghi đè. Phát chỉ khi bấm nút Play.
  const handleSelectLine = (lineIndex: number) => {
    stop();
    setIndex(lineIndex);
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

  const isLast = isLastGroup && index === groupLines.length - 1;
  const showNextGroup = !isLast && !isLastGroup && index === groupLines.length - 1;
  // Hành động cuối lượt (Đoạn tiếp / chấm điểm) chỉ hiện khi hết đoạn hoặc hết bài;
  // giữa đoạn thì bar chỉ còn nút phát — nhảy dòng bằng tap trên panel.
  const showActions = showNextGroup || isLast;

  const goToNextGroup = () => {
    stop();
    setGroupIndex((current) => Math.min(current + 1, groups.length - 1));
    setIndex(0);
  };

  // Chọn đoạn bất kỳ từ danh sách phát — hủy audio đang chạy, đứng dòng đầu
  const selectGroup = (groupIdx: number) => {
    stop();
    setGroupIndex(groupIdx);
    setIndex(0);
  };

  const progressText = (
    <>
      Câu {linesBeforeGroup + index + 1}/{lines.length}
      {groups.length > 1 && ` • Đoạn ${safeGroupIndex + 1}/${groups.length}`} •{' '}
      {mode === 'new' ? 'Bài mới — đọc theo' : 'Ôn tập'}
    </>
  );

  // Danh sách phát 课文: chọn đoạn bất kỳ để đọc/phát riêng
  const playlistBlock =
    groups.length > 1 ? (
      <div className="mb-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Danh sách phát
        </p>
        <div className="space-y-1">
          {groups.map((group, groupIdx) => {
            const first = group[0];
            const active = groupIdx === safeGroupIndex;
            return (
              <button
                key={groupIdx}
                type="button"
                onClick={() => selectGroup(groupIdx)}
                className={
                  'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ' +
                  (active
                    ? 'border-primary bg-primary-light/40'
                    : 'border-border hover:bg-background-alt')
                }
              >
                <span className="truncate text-sm text-foreground">
                  <span className="chinese-text">
                    {first.dialogueTitleHanzi ?? `Đoạn ${groupIdx + 1}`}
                  </span>
                  {first.dialogueTitleVi && (
                    <span className="text-muted"> · {first.dialogueTitleVi}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted">{group.length} câu</span>
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div className="mx-auto max-w-lg p-4 sm:max-w-2xl sm:p-6 lg:grid lg:max-w-6xl lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* ===== Mobile (<lg): khung vừa viewport, bar thao tác trong flow dưới cùng ===== */}
      {/* Chiều cao = 100dvh - header(4rem) - main py-8(4rem) - p-4/p-6(2/3rem) */}
      <div className="flex flex-col h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-11rem)] lg:hidden">
        {/* Info: header phiên + tiêu đề + tiến độ — playlist dạng select nằm ở bar dưới */}
        <div className="shrink-0">
          {sessionHeader && <div className="mb-2">{sessionHeader}</div>}
          <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted">{progressText}</p>
        </div>

        {/* Panel lyrics: chiếm phần còn lại — tự cuộn nội bộ, KHÔNG bị bar đè */}
        <div className="min-h-0 flex-1">
          <LyricsPanel
            className="h-full sm:h-full"
            lines={groupLines}
            index={index}
            onSelectLine={handleSelectLine}
            showPinyin={showPinyin}
            showVietnamese={showVietnamese}
          />
        </div>

        {/* Bar thao tác: trong flow (không fixed/sticky) → không đè nội dung.
            Chọn đoạn + phát + tốc độ + layer chữ ngang hàng một hàng. */}
        <div className="shrink-0 mt-2 space-y-2 pb-[env(safe-area-inset-bottom)]">
          {lines.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {groups.length > 1 && (
                <GroupSelect groups={groups} activeIndex={safeGroupIndex} onSelect={selectGroup} />
              )}
              <PlaybackControls
                isBusy={isBusy}
                isPaused={isPaused}
                onPlayPause={handlePlayPause}
                speed={speechRate}
                onSpeedChange={(value) => {
                  setSpeechRate(value);
                  setSpeed(value);
                }}
                showPinyin={showPinyin}
                showVietnamese={showVietnamese}
                onTogglePinyin={toggleShowPinyin}
                onToggleVietnamese={toggleShowVietnamese}
              />
            </div>
          )}
          {showActions && (
            <DialogueActions
              showNextGroup={showNextGroup}
              mode={mode}
              onNextGroup={goToNextGroup}
              onDone={onDone}
            />
          )}
        </div>
      </div>

      {/* ===== Desktop (lg+): cột trái sticky — info + điều khiển ===== */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        {sessionHeader && <div className="mb-6">{sessionHeader}</div>}
        <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
        <p className="mb-4 text-sm text-muted">{progressText}</p>

        {lines.length > 1 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <PlaybackControls
              isBusy={isBusy}
              isPaused={isPaused}
              onPlayPause={handlePlayPause}
              speed={speechRate}
              onSpeedChange={(value) => {
                setSpeechRate(value);
                setSpeed(value);
              }}
              showPinyin={showPinyin}
              showVietnamese={showVietnamese}
              onTogglePinyin={toggleShowPinyin}
              onToggleVietnamese={toggleShowVietnamese}
            />
          </div>
        )}

        {playlistBlock}
      </aside>

      {/* ===== Desktop (lg+): cột phải — panel lyrics + điều hướng ===== */}
      <div className="hidden lg:block">
        <LyricsPanel
          lines={groupLines}
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

        {showActions && (
          <div className="mt-6">
            <DialogueActions
              showNextGroup={showNextGroup}
              mode={mode}
              onNextGroup={goToNextGroup}
              onDone={onDone}
            />
          </div>
        )}
      </div>
    </div>
  );
}
