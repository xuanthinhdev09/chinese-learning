import { useEffect, useState } from 'react';

interface ImportStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_count: number;
  skipped_count: number;
  error_count: number;
  errors: string[];
}

export function useImportProgress(
  isImporting: boolean,
  isComplete: boolean
) {
  const [progress, setProgress] = useState<ImportStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isImporting || isComplete) {
      setProgress(null);
      setError(null);
      return;
    }

    // Simulate progress for now (will be replaced with actual polling)
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
      }

      setProgress({
        job_id: 'import-job',
        status: currentProgress === 100 ? 'completed' : 'processing',
        progress: Math.min(currentProgress, 100),
        created_count: Math.floor(currentProgress * 0.8),
        skipped_count: Math.floor(currentProgress * 0.1),
        error_count: 0,
        errors: [],
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isImporting, isComplete]);

  return { progress, error };
}
