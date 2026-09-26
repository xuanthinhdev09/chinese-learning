import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hskApi } from '../api/hsk-api';

/**
 * Route param ":id" accepts either the raw HSK level id (CUID) or the level
 * number for pretty URLs like /hsk/2. Numeric params resolve through the
 * levels list; anything else passes through untouched so existing CUID links
 * keep working.
 */
export function useResolveHskLevelId(param: string | undefined): {
  levelId: string | undefined;
  isResolving: boolean;
} {
  const isLevel = !!param && /^\d+$/.test(param);

  // Chia sẻ cache với hsk-list-page (cùng query key) — không fetch thừa.
  const { data, isLoading } = useQuery({
    queryKey: ['hsk-levels'],
    queryFn: () => hskApi.getLevels(),
    enabled: isLevel,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    if (!param) return { levelId: undefined, isResolving: false };
    if (!isLevel) return { levelId: param, isResolving: false };
    const level = Number(param);
    const found = data?.find((l) => l.level === level);
    return { levelId: found?.id, isResolving: isLoading };
  }, [param, isLevel, data, isLoading]);
}
