import { useEffect, useRef } from 'react';

/**
 * Cuộn phần tử vào khung nhìn mỗi khi `shown` chuyển sang true (vd 4 nút chấm
 * mức ghi nhớ hiện ra sau khi lật thẻ, nằm dưới màn hình gập trên mobile).
 * Kết hợp với `scroll-mb-*` trên phần tử để chừa chỗ cho thanh công cụ Safari
 * — `block: 'end'` tôn trọng scroll-margin nên nút dừng phía trên thanh đó.
 */
export function useScrollIntoViewWhenShown<T extends HTMLElement>(shown: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!shown) return;
    // Đợi frame kế tiếp để layout (animation fade-in) đã có kích thước thật.
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(frame);
  }, [shown]);

  return ref;
}
