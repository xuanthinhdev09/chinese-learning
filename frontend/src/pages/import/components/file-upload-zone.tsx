import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileUpload } from '../hooks/use-file-upload';

interface FileUploadZoneProps {
  label: string;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

export function FileUploadZone({
  label,
  disabled = false,
  onFileSelect,
  onFileRemove,
}: FileUploadZoneProps) {
  const { t } = useTranslation();
  const { file, error, isDragging, setFile, setDragging } =
    useFileUpload();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);

      if (disabled) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const validationError = validateFile(droppedFile);
        setFile(droppedFile);
        if (!validationError) {
          onFileSelect(droppedFile);
        }
      }
    },
    [disabled, setFile, onFileSelect, setDragging]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setDragging(true);
      }
    },
    [disabled, setDragging]
  );

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    },
    [setFile, onFileSelect]
  );

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith('.json')) {
      return t('import.onlyJson');
    }
    if (file.size > 10 * 1024 * 1024) {
      return t('import.fileTooLarge');
    }
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const inputId = `file-input-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-gray-400'
          }`}
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-gray-600 text-center">
            {isDragging ? t('import.dropHere') : t('import.dragDrop')}
          </p>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className={`mt-4 text-sm text-blue-600 hover:text-blue-700 ${
              disabled ? 'pointer-events-none' : ''
            }`}
          >
            {t('import.browse')}
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} •{' '}
                {new Date(file.lastModified).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                onFileRemove();
              }}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {t('import.remove')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  );
}
