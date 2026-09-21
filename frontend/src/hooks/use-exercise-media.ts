import { useQuery } from '@tanstack/react-query';
import { exercisesApi } from '../api/exercises-api';

/**
 * <img>/<audio> tags cannot send the Authorization header, so authenticated
 * workbook media is fetched as blobs and served via object URLs. Lesson data
 * is private (copyrighted workbook scans), so these never fall back to
 * unauthenticated <img src> requests.
 */
export function useExerciseImageBlob(imageId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['exercise-image', imageId],
    // The object URL is created inside queryFn so it is stable per fetch —
    // an inline select would re-run every render and mint a new URL each
    // time. URLs stay alive for the page session; revoking on cache GC is
    // not worth the bookkeeping for a few dozen small PNGs.
    queryFn: async () => {
      const blob = await exercisesApi.fetchImageBlob(imageId!);
      return URL.createObjectURL(blob);
    },
    enabled: enabled && !!imageId,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });
}

export function useExerciseAudioBlob(filename: string | null) {
  return useQuery({
    queryKey: ['exercise-audio', filename],
    queryFn: async () => {
      const blob = await exercisesApi.fetchAudioBlob(filename!);
      return URL.createObjectURL(blob);
    },
    enabled: !!filename,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });
}
