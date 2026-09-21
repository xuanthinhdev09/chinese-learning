import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  LessonExerciseImage,
  exercisesApi,
} from '../../api/exercises-api';
import { useExerciseImageBlob } from '../../hooks/use-exercise-media';
import { useImageSlotSelection } from './image-slot-selection-context';

interface ExerciseImageSlotProps {
  image: LessonExerciseImage;
  /** compact slot (answer-pool grids); false = full-width (examples, 笔顺) */
  compact?: boolean;
}

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';

/** Server error code (thrown as Error message) -> i18n key. */
const UPLOAD_ERROR_KEYS: Record<string, string> = {
  UNSUPPORTED_IMAGE_TYPE: 'exercises.uploadBadType',
  IMAGE_EXTENSION_MISMATCH: 'exercises.uploadBadExt',
  IMAGE_SIZE_OUT_OF_RANGE: 'exercises.uploadTooLarge',
};

function firstImageFile(files: FileList | undefined | null): File | null {
  const file = files?.[0];
  if (!file) return null;
  return file.type.startsWith('image/') ? file : null;
}

/**
 * One workbook image position. If the file has been uploaded, renders the
 * image (drag a new file onto it to replace); otherwise renders a dashed
 * placeholder accepting upload button, drag & drop, and Ctrl+V paste.
 */
export function ExerciseImageSlot({ image, compact = false }: ExerciseImageSlotProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const selection = useImageSlotSelection();
  const selected = selection?.selectedId === image.id;
  const { data: blobUrl } = useExerciseImageBlob(image.id, image.exists);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => exercisesApi.uploadExerciseImage(image.id, file),
    onSuccess: () => {
      setUploadError(null);
      void queryClient.invalidateQueries({ queryKey: ['lesson-exercises'] });
    },
    onError: (error: Error) => {
      const key = UPLOAD_ERROR_KEYS[error.message];
      setUploadError(key ? t(key) : t('exercises.uploadFailed'));
    },
  });

  useEffect(() => {
    const upload = (file: File) => uploadMutation.mutate(file);
    selection?.registerUpload(image.id, upload);
    return () => selection?.registerUpload(image.id, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.registerUpload, image.id]);

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = firstImageFile(e.dataTransfer.files);
      if (file) uploadMutation.mutate(file);
    },
  };

  if (image.exists) {
    return (
      <figure
        className={`m-0 ${compact ? '' : 'w-full'} ${dragOver ? 'rounded-lg outline-2 outline-dashed outline-blue-400' : ''}`}
        {...dropHandlers}
      >
        <img
          src={blobUrl}
          alt={t('exercises.imageAlt', { ref: image.ref })}
          className={`rounded-lg border border-gray-200 bg-white ${compact ? 'max-h-28 w-auto' : 'max-w-full'}`}
        />
      </figure>
    );
  }

  const caption = uploadError ?? (selected ? t('exercises.pasteSelectedHint') : image.filePath);

  return (
    <div
      {...dropHandlers}
      onClick={() => selection?.onSelect(image.id)}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 ${
        compact ? 'min-h-24' : 'min-h-28 w-full'
      } ${
        dragOver
          ? 'border-blue-500 bg-blue-50'
          : selected
            ? 'border-blue-400 bg-blue-50/60'
            : 'border-gray-300 bg-gray-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={onPickFile}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {uploadMutation.isPending ? t('exercises.uploading') : t('exercises.uploadImage')}
      </button>
      <span
        className={`max-w-full truncate px-1 text-center text-[10px] ${
          selected && !uploadError ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        {caption}
      </span>
      {!uploadError && selected && (
        <span className="max-w-full truncate px-1 text-center text-[10px] text-gray-400">
          {image.filePath}
        </span>
      )}
    </div>
  );
}
