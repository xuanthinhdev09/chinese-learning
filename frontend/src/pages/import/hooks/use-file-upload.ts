import { useState, useCallback } from 'react';

interface FileUploadState {
  file: File | null;
  error: string | null;
  isDragging: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function useFileUpload() {
  const [state, setState] = useState<FileUploadState>({
    file: null,
    error: null,
    isDragging: false,
  });

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith('.json')) {
      return 'Only JSON files are allowed';
    }
    if (file.size > MAX_SIZE) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const setFile = useCallback((file: File | null) => {
    if (file) {
      const error = validateFile(file);
      setState({ file, error, isDragging: false });
    } else {
      setState({ file: null, error: null, isDragging: false });
    }
  }, []);

  const setDragging = useCallback((isDragging: boolean) => {
    setState((prev) => ({ ...prev, isDragging }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    file: state.file,
    error: state.error,
    isDragging: state.isDragging,
    setFile,
    setDragging,
    clearError,
  };
}
