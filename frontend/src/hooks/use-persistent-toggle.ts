import { useCallback, useState } from 'react';

/**
 * Boolean toggle lưu localStorage — mặc định ON khi thiếu giá trị hoặc
 * storage bị chặn (private mode). Toggle vẫn hoạt động trong phiên dù ghi fail.
 */
export function usePersistentToggle(key: string): [boolean, () => void] {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) !== '0';
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setValue((current) => {
      const next = !current;
      try {
        localStorage.setItem(key, next ? '1' : '0');
      } catch {
        // storage có thể bị chặn — không sao, toggle vẫn sống trong phiên
      }
      return next;
    });
  }, [key]);

  return [value, toggle];
}
